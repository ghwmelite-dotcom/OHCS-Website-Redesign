import type { MiddlewareHandler } from 'hono';

interface RateLimitOptions {
  limit: number;
  windowSeconds: number;
  keyPrefix: string;
}

type Env = {
  RATE_LIMIT: KVNamespace;
};

export function rateLimit(options: RateLimitOptions): MiddlewareHandler<{ Bindings: Env }> {
  return async (c, next) => {
    const ip = c.req.header('cf-connecting-ip') ?? c.req.header('x-forwarded-for') ?? 'unknown';
    const key = `${options.keyPrefix}:${ip}`;

    const current = await c.env.RATE_LIMIT.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= options.limit) {
      return c.json(
        {
          error: {
            code: 'RATE_LIMITED',
            message: `Too many requests. Please try again in ${options.windowSeconds} seconds.`,
            requestId: crypto.randomUUID(),
          },
        },
        429,
      );
    }

    await c.env.RATE_LIMIT.put(key, String(count + 1), {
      expirationTtl: options.windowSeconds,
    });

    await next();
  };
}
