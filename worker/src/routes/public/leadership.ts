import { Hono } from 'hono';
import type { LeadershipRow } from '../../db/schema';

type Env = { DB: D1Database };

const leadership = new Hono<{ Bindings: Env }>();

leadership.get('/', async (c) => {
  const { results } = await c.env.DB.prepare(
    'SELECT * FROM leadership ORDER BY display_order ASC'
  ).all<LeadershipRow>();

  return c.json({ data: results });
});

leadership.get('/featured', async (c) => {
  const row = await c.env.DB.prepare(
    'SELECT * FROM leadership WHERE is_featured = 1 ORDER BY display_order ASC LIMIT 1'
  ).first<LeadershipRow>();

  if (!row) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'No featured leader found', requestId: crypto.randomUUID() } }, 404);
  }

  return c.json({ data: row });
});

export { leadership };
