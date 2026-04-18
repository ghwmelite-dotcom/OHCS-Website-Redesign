import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

type Env = { AI: Ai; DB: D1Database };

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  context: z
    .object({
      exerciseName: z.string().optional(),
      totalApplications: z.number().optional(),
      pipelineData: z.string().optional(),
      examResults: z.string().optional(),
    })
    .optional(),
});

const SYSTEM_PROMPT = `You are the OHCS Recruitment Intelligence Analyst — an AI expert embedded in the Office of the Head of the Civil Service, Ghana's recruitment management portal.

Your role:
- Analyse recruitment data and provide actionable insights
- Answer questions about application trends, candidate quality, and pipeline health
- Identify patterns, anomalies, and opportunities in recruitment data
- Make recommendations for improving recruitment outcomes
- Draft communications to candidates when asked
- Flag potential fraud or duplicate applications

Tone: Professional, data-driven, concise. Use specific numbers when available.
Format: Use bullet points for lists, bold for key figures. Keep responses under 300 words unless asked for detailed analysis.
Context: You are advising senior civil service officials. Be authoritative but diplomatic.`;

const aiChat = new Hono<{ Bindings: Env }>();

aiChat.post(
  '/chat',
  zValidator('json', chatSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid message',
            requestId: crypto.randomUUID(),
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const { message, context } = c.req.valid('json');

    // Build context-enriched prompt
    let contextStr = '';
    if (context) {
      if (context.exerciseName) contextStr += `\nActive Exercise: ${context.exerciseName}`;
      if (context.totalApplications)
        contextStr += `\nTotal Applications: ${context.totalApplications}`;
      if (context.pipelineData) contextStr += `\nPipeline Data: ${context.pipelineData}`;
      if (context.examResults) contextStr += `\nExam Results: ${context.examResults}`;
    }

    const systemMessage =
      SYSTEM_PROMPT + (contextStr ? `\n\nCurrent Data Context:${contextStr}` : '');

    try {
      const response = await c.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      });

      return c.json({
        data: {
          message: (response as { response: string }).response,
          model: 'llama-3.3-70b',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.error('AI Error:', err);
      return c.json(
        {
          error: {
            code: 'AI_ERROR',
            message: 'AI service temporarily unavailable.',
            requestId: crypto.randomUUID(),
          },
        },
        500,
      );
    }
  },
);

export { aiChat };
