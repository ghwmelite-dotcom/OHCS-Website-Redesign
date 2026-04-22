import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { json } from './json';

export type ValidateResult<T> =
  | { kind: 'ok'; value: T }
  | { kind: 'reject'; response: Response };

export async function parseBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
): Promise<ValidateResult<ZodInfer<S>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return {
      kind: 'reject',
      response: json(
        { error: 'invalid request body', issues: [{ message: 'malformed JSON' }] },
        { status: 400 },
      ),
    };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return {
      kind: 'reject',
      response: json({ error: 'invalid request body', issues: parsed.error.issues }, { status: 400 }),
    };
  }

  return { kind: 'ok', value: parsed.data };
}
