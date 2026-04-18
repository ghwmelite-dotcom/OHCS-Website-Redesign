import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { news } from './routes/public/news';
import { events } from './routes/public/events';
import { publications } from './routes/public/publications';
import { leadership } from './routes/public/leadership';
import { submissions } from './routes/public/submissions';
import { track } from './routes/public/track';
import { auth } from './routes/admin/auth';

type Env = {
  DB: D1Database;
  REF_LOOKUP: KVNamespace;
  CACHE: KVNamespace;
  RATE_LIMIT: KVNamespace;
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

// Public API routes
app.route('/api/v1/news', news);
app.route('/api/v1/events', events);
app.route('/api/v1/publications', publications);
app.route('/api/v1/leadership', leadership);
app.route('/api/v1/submissions', submissions);
app.route('/api/v1/track', track);

// Admin API routes
app.route('/api/v1/admin/auth', auth);

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
