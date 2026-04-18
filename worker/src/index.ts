import { Hono } from 'hono';
import { cors } from 'hono/cors';

type Env = {
  DB: D1Database;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Env }>();

// CORS
app.use(
  '/api/*',
  cors({
    origin: ['https://ohcs.gov.gh', 'http://localhost:3000'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    maxAge: 86400,
  }),
);

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 fallback
app.notFound((c) => {
  return c.json(
    {
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
        requestId: crypto.randomUUID(),
      },
    },
    404,
  );
});

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err);
  return c.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred.',
        requestId: crypto.randomUUID(),
      },
    },
    500,
  );
});

export default app;
