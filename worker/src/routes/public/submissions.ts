import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createSubmissionSchema } from '../../lib/validation';
import { generateReferenceNumber } from '../../lib/reference';

type Env = { DB: D1Database; REF_LOOKUP: KVNamespace; RATE_LIMIT: KVNamespace };

const submissions = new Hono<{ Bindings: Env }>();

submissions.post(
  '/',
  zValidator('json', createSubmissionSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid submission data',
            details: result.error.flatten(),
            requestId: crypto.randomUUID(),
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    // Rate limit check
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    const rateLimitKey = `submit:${ip}`;
    const current = await c.env.RATE_LIMIT.get(rateLimitKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= 5) {
      return c.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many submissions. Please try again later.', requestId: crypto.randomUUID() } },
        429,
      );
    }

    await c.env.RATE_LIMIT.put(rateLimitKey, String(count + 1), { expirationTtl: 60 });

    const data = c.req.valid('json');
    const id = crypto.randomUUID();
    const referenceNumber = generateReferenceNumber(data.type);

    // Insert submission
    await c.env.DB.prepare(
      `INSERT INTO submissions (id, reference_number, type, status, name, email, phone, subject, body)
       VALUES (?, ?, ?, 'received', ?, ?, ?, ?, ?)`
    ).bind(id, referenceNumber, data.type, data.name, data.email ?? null, data.phone ?? null, data.subject ?? null, data.body).run();

    // Insert initial status history
    await c.env.DB.prepare(
      `INSERT INTO submission_status_history (id, submission_id, status, note)
       VALUES (?, ?, 'received', 'Submission received')`
    ).bind(crypto.randomUUID(), id).run();

    // Store reference -> id mapping in KV
    await c.env.REF_LOOKUP.put(`ref:${referenceNumber}`, id);

    return c.json(
      {
        data: {
          referenceNumber,
          status: 'received',
          message: 'Your submission has been received. Please save your reference number for tracking.',
        },
      },
      201,
    );
  },
);

export { submissions };
