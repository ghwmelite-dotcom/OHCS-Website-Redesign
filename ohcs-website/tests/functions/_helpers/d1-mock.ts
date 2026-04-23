//
// Tiny scriptable D1 stand-in. Tests register expected (sql, binds) → result
// triples; the mock returns the matched result when the endpoint calls
// .prepare(sql).bind(...binds).first()/all()/run().
//
// Match is exact-string on `sql`. If `binds` is omitted, ANY binds match
// (wildcard — useful when the implementation passes Date.now() or other
// values you can't predict). Otherwise binds match by JSON-equal.
//
// If no script matches, the mock throws — surfacing test setup gaps rather
// than silently returning null.

export interface D1Script {
  sql: string;
  binds?: unknown[];
  first?: unknown;
  all?: { results: unknown[]; meta?: Record<string, unknown> };
  run?: { meta?: Record<string, unknown> };
}

export function makeD1(scripts: D1Script[]): D1Database {
  function find(sql: string, binds: unknown[]): D1Script {
    const match = scripts.find((s) => {
      if (s.sql !== sql) return false;
      if (s.binds === undefined) return true; // wildcard: match any binds
      return JSON.stringify(s.binds) === JSON.stringify(binds);
    });
    if (!match) {
      throw new Error(
        `d1-mock: no script registered for sql=${JSON.stringify(sql)} binds=${JSON.stringify(binds)}`,
      );
    }
    return match;
  }

  return {
    prepare(sql: string) {
      let bound: unknown[] = [];
      const stmt = {
        bind(...args: unknown[]) {
          bound = args;
          return stmt;
        },
        async first<T = unknown>(): Promise<T | null> {
          const s = find(sql, bound);
          return (s.first as T) ?? null;
        },
        async all<T = unknown>(): Promise<{ results: T[]; meta?: Record<string, unknown> }> {
          const s = find(sql, bound);
          return s.all
            ? { results: s.all.results as T[], meta: s.all.meta }
            : { results: [] };
        },
        async run(): Promise<{ meta?: Record<string, unknown> }> {
          const s = find(sql, bound);
          return s.run ?? {};
        },
      };
      return stmt;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async batch(_statements: unknown[]): Promise<unknown[]> {
      return [];
    },
  } as unknown as D1Database;
}
