import { Hono } from 'hono';
import type { NewsRow } from '../../db/schema';

type Env = { DB: D1Database };

const news = new Hono<{ Bindings: Env }>();

// List published news (paginated)
news.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const results = await c.env.DB.batch([
    c.env.DB.prepare('SELECT COUNT(*) as total FROM news WHERE is_published = 1'),
    c.env.DB.prepare(
      'SELECT * FROM news WHERE is_published = 1 ORDER BY published_at DESC LIMIT ? OFFSET ?'
    ).bind(limit, offset),
  ]);

  const countResult = results[0]!;
  const rows = results[1]!;
  const total = (countResult.results[0] as Record<string, number>)?.total ?? 0;

  return c.json({
    data: rows.results as NewsRow[],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// Single article by slug
news.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const row = await c.env.DB.prepare(
    'SELECT * FROM news WHERE slug = ? AND is_published = 1'
  ).bind(slug).first<NewsRow>();

  if (!row) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Article not found', requestId: crypto.randomUUID() } }, 404);
  }

  return c.json({ data: row });
});

export { news };
