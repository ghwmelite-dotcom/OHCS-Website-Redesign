import { Hono } from 'hono';
import type { EventRow } from '../../db/schema';

type Env = { DB: D1Database };

const events = new Hono<{ Bindings: Env }>();

events.get('/', async (c) => {
  const upcoming = c.req.query('upcoming') === 'true';
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const now = new Date().toISOString();
  const whereClause = upcoming
    ? 'WHERE is_published = 1 AND start_date >= ?'
    : 'WHERE is_published = 1';
  const orderDir = upcoming ? 'ASC' : 'DESC';

  const countSql = `SELECT COUNT(*) as total FROM events ${whereClause}`;
  const dataSql = `SELECT * FROM events ${whereClause} ORDER BY start_date ${orderDir} LIMIT ? OFFSET ?`;

  const countStmt = c.env.DB.prepare(countSql);
  const dataStmt = c.env.DB.prepare(dataSql);

  const boundCount = upcoming ? countStmt.bind(now) : countStmt;
  const boundData = upcoming ? dataStmt.bind(now, limit, offset) : dataStmt.bind(limit, offset);

  const results = await c.env.DB.batch([boundCount, boundData]);

  const countResult = results[0]!;
  const rows = results[1]!;
  const total = (countResult.results[0] as Record<string, number>)?.total ?? 0;

  return c.json({
    data: rows.results as EventRow[],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

events.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const row = await c.env.DB.prepare(
    'SELECT * FROM events WHERE slug = ? AND is_published = 1'
  ).bind(slug).first<EventRow>();

  if (!row) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Event not found', requestId: crypto.randomUUID() } }, 404);
  }

  return c.json({ data: row });
});

export { events };
