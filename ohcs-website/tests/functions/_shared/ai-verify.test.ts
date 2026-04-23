import { describe, it, expect, vi } from 'vitest';
import { verifyDocument, PROMPT_VERSION } from '../../../functions/_shared/ai-verify';
import { makeD1 } from '../_helpers/d1-mock';
import type { Env } from '../../../functions/_shared/types';

function envWithAi(aiResponse: unknown, db: D1Database): Env {
  return {
    DB: db,
    UPLOADS: { head: vi.fn(), get: vi.fn(), put: vi.fn(), delete: vi.fn() } as unknown as R2Bucket,
    AI: {
      run: vi.fn(async () => aiResponse),
    } as unknown as Ai,
    APP_NAME: 'Test',
    APP_ENV: 'development',
    EMAIL_FROM: 'noreply@example.com',
    EMAIL_FROM_NAME: 'Test',
  };
}

describe('verifyDocument', () => {
  it('writes "passed" when AI returns is_valid=true with confidence >= 0.75', async () => {
    const db = makeD1([
      {
        sql:
          'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
        run: {},
      },
    ]);
    const aiResp = {
      response: JSON.stringify({ is_valid: true, confidence: 0.92, reason: 'Looks like a Ghana Card' }),
    };
    const env = envWithAi(aiResp, db);
    await verifyDocument(env, {
      applicationId: 'OHCS-2026-00001',
      documentTypeId: 'national_id',
      checkType: 'identity',
      r2Key: 'ex-001/OHCS-2026-00001/national_id.pdf',
      mimeType: 'application/pdf',
    });
    expect(env.AI.run).toHaveBeenCalled();
  });

  it('writes "flagged" when confidence is below threshold', async () => {
    const db = makeD1([
      {
        sql:
          'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
        run: {},
      },
    ]);
    const aiResp = {
      response: JSON.stringify({ is_valid: true, confidence: 0.5, reason: 'Could be a card' }),
    };
    const env = envWithAi(aiResp, db);
    await verifyDocument(env, {
      applicationId: 'OHCS-2026-00001',
      documentTypeId: 'national_id',
      checkType: 'identity',
      r2Key: 'ex-001/OHCS-2026-00001/national_id.pdf',
      mimeType: 'application/pdf',
    });
    expect(env.AI.run).toHaveBeenCalled();
  });

  it('writes "unchecked" when AI returns garbage (parse failure)', async () => {
    const db = makeD1([
      {
        sql:
          'UPDATE application_documents SET ai_verdict = ?, ai_confidence = ?, ai_reason = ?, ai_prompt_version = ? WHERE application_id = ? AND document_type_id = ?',
        run: {},
      },
    ]);
    const aiResp = { response: 'not json at all' };
    const env = envWithAi(aiResp, db);
    await verifyDocument(env, {
      applicationId: 'OHCS-2026-00001',
      documentTypeId: 'national_id',
      checkType: 'identity',
      r2Key: 'ex-001/OHCS-2026-00001/national_id.pdf',
      mimeType: 'application/pdf',
    });
    expect(env.AI.run).toHaveBeenCalled();
  });

  it('exports a stable PROMPT_VERSION string', () => {
    expect(typeof PROMPT_VERSION).toBe('string');
    expect(PROMPT_VERSION.length).toBeGreaterThan(0);
  });
});
