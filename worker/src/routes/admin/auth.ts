import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { AdminUserRow } from '../../db/schema';

type Env = { DB: D1Database };

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const auth = new Hono<{ Bindings: Env }>();

// Login
auth.post(
  '/login',
  zValidator('json', loginSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid credentials format',
            requestId: crypto.randomUUID(),
          },
        },
        400,
      );
    }
  }),
  async (c) => {
    const { email, password } = c.req.valid('json');

    // Enforce @ohcs.gov.gh domain
    if (!email.endsWith('@ohcs.gov.gh')) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Only @ohcs.gov.gh email addresses are permitted.',
            requestId: crypto.randomUUID(),
          },
        },
        401,
      );
    }

    const user = await c.env.DB.prepare(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = 1',
    )
      .bind(email.toLowerCase())
      .first<AdminUserRow>();

    if (!user) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password.',
            requestId: crypto.randomUUID(),
          },
        },
        401,
      );
    }

    // Simple password check (in production, use bcrypt/argon2 via WebCrypto)
    const expectedHash = `$default$${password}`;
    if (user.password_hash !== expectedHash) {
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid email or password.',
            requestId: crypto.randomUUID(),
          },
        },
        401,
      );
    }

    // Create session token
    const token = crypto.randomUUID();
    const tokenHash = await hashToken(token);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await c.env.DB.prepare(
      'INSERT INTO admin_sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    )
      .bind(crypto.randomUUID(), user.id, tokenHash, expiresAt)
      .run();

    // Update last login
    await c.env.DB.prepare(
      "UPDATE admin_users SET last_login_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = ?",
    )
      .bind(user.id)
      .run();

    return c.json({
      data: {
        token,
        expiresAt,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  },
);

// Get current user (validates token)
auth.get('/me', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided.',
          requestId: crypto.randomUUID(),
        },
      },
      401,
    );
  }

  const token = authHeader.slice(7);
  const tokenHash = await hashToken(token);

  const session = await c.env.DB.prepare(
    'SELECT s.*, u.email, u.name, u.role, u.is_active FROM admin_sessions s JOIN admin_users u ON s.user_id = u.id WHERE s.token_hash = ? AND s.expires_at > datetime("now")',
  )
    .bind(tokenHash)
    .first<Record<string, unknown>>();

  if (!session || session.is_active !== 1) {
    return c.json(
      {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired session.',
          requestId: crypto.randomUUID(),
        },
      },
      401,
    );
  }

  return c.json({
    data: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
});

// Logout
auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const tokenHash = await hashToken(token);
    await c.env.DB.prepare('DELETE FROM admin_sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
  }
  return c.json({ data: { message: 'Logged out.' } });
});

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export { auth };
