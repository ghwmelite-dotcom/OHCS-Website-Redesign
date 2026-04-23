import type { Env } from './types';
import { run } from './db';

export const PROMPT_VERSION = 'v1-2026-04-23';
const CONFIDENCE_THRESHOLD = 0.75;

export type CheckType = 'identity' | 'photo' | 'certificate';

export interface VerifyInput {
  applicationId: string;
  documentTypeId: string;
  checkType: CheckType;
  r2Key: string;
  mimeType: string;
}

interface AiVerdict {
  is_valid: boolean;
  confidence: number;
  reason: string;
}

const PROMPTS: Record<CheckType, string> = {
  identity:
    'You are inspecting an image to verify it is a Ghana National Identity Card (Ghana Card). Answer ONLY in JSON: {"is_valid": boolean, "confidence": 0.0-1.0, "reason": "<one short sentence>"}. Look for: NIA branding, "REPUBLIC OF GHANA" text, photo of holder, NIA number format (GHA-XXXXXXXXX-X), expiry date, hologram patterns.',
  photo:
    'You are inspecting an uploaded image to verify it is a passport-style photograph suitable for a government job application. Answer ONLY in JSON: {"is_valid": boolean, "confidence": 0.0-1.0, "reason": "<one short sentence>"}. Criteria: single human face, front-facing, plain light background, head and shoulders visible, no sunglasses, in focus, well-lit.',
  certificate:
    'You are inspecting a document to verify it appears to be an official educational or professional certificate. Answer ONLY in JSON: {"is_valid": boolean, "confidence": 0.0-1.0, "reason": "<one short sentence>"}. Look for: institution name/seal, candidate name, qualification awarded, date of award, signature/stamp.',
};

function parseVerdict(raw: string): AiVerdict | null {
  try {
    const trimmed = raw.trim();
    const stripped = trimmed.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    const parsed = JSON.parse(stripped) as Partial<AiVerdict>;
    if (
      typeof parsed.is_valid === 'boolean' &&
      typeof parsed.confidence === 'number' &&
      typeof parsed.reason === 'string'
    ) {
      return parsed as AiVerdict;
    }
    return null;
  } catch {
    return null;
  }
}

export async function verifyDocument(env: Env, input: VerifyInput): Promise<void> {
  const prompt = PROMPTS[input.checkType];

  let verdict: 'passed' | 'flagged' | 'unchecked';
  let confidence: number | null = null;
  let reason: string | null = null;

  try {
    const model =
      input.mimeType === 'application/pdf'
        ? '@cf/meta/llama-3.1-8b-instruct'
        : '@cf/llava-hf/llava-1.5-7b-hf';
    const aiResultUnknown: unknown = await env.AI.run(model, {
      prompt,
      max_tokens: 256,
    });
    const aiResult = aiResultUnknown as { response?: string };
    const parsed = aiResult.response ? parseVerdict(aiResult.response) : null;
    if (!parsed) {
      verdict = 'unchecked';
      reason = 'AI response did not parse as expected JSON';
    } else if (parsed.is_valid && parsed.confidence >= CONFIDENCE_THRESHOLD) {
      verdict = 'passed';
      confidence = parsed.confidence;
      reason = parsed.reason;
    } else {
      verdict = 'flagged';
      confidence = parsed.confidence;
      reason = parsed.reason;
    }
  } catch (err) {
    verdict = 'unchecked';
    reason = err instanceof Error ? `AI error: ${err.message}` : 'AI error';
  }

  await run(
    env,
    'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
    verdict,
    confidence,
    reason,
    PROMPT_VERSION,
    input.applicationId,
    input.documentTypeId,
  );
}
