import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { trackSubmissionSchema } from '../../lib/validation';
import type { SubmissionRow, StatusHistoryRow } from '../../db/schema';

type Env = { DB: D1Database; REF_LOOKUP: KVNamespace; RATE_LIMIT: KVNamespace };

const track = new Hono<{ Bindings: Env }>();

track.post(
  '/',
  zValidator('json', trackSubmissionSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tracking request',
            details: result.error.flatten(),
            requestId: crypto.randomUUID(),
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    // Rate limit
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    const rateLimitKey = `track:${ip}`;
    const current = await c.env.RATE_LIMIT.get(rateLimitKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= 10) {
      return c.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many tracking requests. Please try again later.', requestId: crypto.randomUUID() } },
        429,
      );
    }

    await c.env.RATE_LIMIT.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });

    const { referenceNumber, contact } = c.req.valid('json');

    // KV lookup
    const submissionId = await c.env.REF_LOOKUP.get(`ref:${referenceNumber}`);
    if (!submissionId) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Submission not found. Please check your reference number.', requestId: crypto.randomUUID() } },
        404,
      );
    }

    // Fetch submission
    const submission = await c.env.DB.prepare(
      'SELECT * FROM submissions WHERE id = ?'
    ).bind(submissionId).first<SubmissionRow>();

    if (!submission) {
      return c.json(
        { error: { code: 'NOT_FOUND', message: 'Submission record not found.', requestId: crypto.randomUUID() } },
        404,
      );
    }

    // Verify contact matches (email or phone)
    const contactLower = contact.toLowerCase().trim();
    const emailMatch = submission.email?.toLowerCase() === contactLower;
    const phoneMatch = submission.phone === contact.trim();

    if (!emailMatch && !phoneMatch) {
      return c.json(
        { error: { code: 'UNAUTHORIZED', message: 'Contact information does not match our records.', requestId: crypto.randomUUID() } },
        401,
      );
    }

    // Fetch timeline
    const { results: timeline } = await c.env.DB.prepare(
      'SELECT * FROM submission_status_history WHERE submission_id = ? ORDER BY created_at DESC'
    ).bind(submissionId).all<StatusHistoryRow>();

    return c.json({
      data: {
        referenceNumber: submission.reference_number,
        type: submission.type,
        status: submission.status,
        subject: submission.subject,
        createdAt: submission.created_at,
        updatedAt: submission.updated_at,
        timeline,
      },
    });
  },
);

export { track };
