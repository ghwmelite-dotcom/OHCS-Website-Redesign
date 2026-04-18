import { Hono } from 'hono';
import type { PublicationRow } from '../../db/schema';

type Env = { DB: D1Database };

const publications = new Hono<{ Bindings: Env }>();

publications.get('/', async (c) => {
  const category = c.req.query('category');
  const page = Math.max(1, parseInt(c.req.query('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') ?? '20', 10)));
  const offset = (page - 1) * limit;

  const whereClause = category
    ? 'WHERE is_published = 1 AND category = ?'
    : 'WHERE is_published = 1';

  const countSql = `SELECT COUNT(*) as total FROM publications ${whereClause}`;
  const dataSql = `SELECT * FROM publications ${whereClause} ORDER BY published_at DESC LIMIT ? OFFSET ?`;

  const countStmt = c.env.DB.prepare(countSql);
  const dataStmt = c.env.DB.prepare(dataSql);

  const boundCount = category ? countStmt.bind(category) : countStmt;
  const boundData = category ? dataStmt.bind(category, limit, offset) : dataStmt.bind(limit, offset);

  const results = await c.env.DB.batch([boundCount, boundData]);

  const countResult = results[0]!;
  const rows = results[1]!;
  const total = (countResult.results[0] as Record<string, number>)?.total ?? 0;

  return c.json({
    data: rows.results as PublicationRow[],
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

export { publications };
