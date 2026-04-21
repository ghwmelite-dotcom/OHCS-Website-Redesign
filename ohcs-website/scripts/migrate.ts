import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..');
const MIGRATIONS_DIR = join(REPO_ROOT, 'migrations');
const DB_NAME = 'ohcs-recruitment';

const remote = process.argv.includes('--remote');
const flag = remote ? '--remote' : '--local';

function listMigrations(): string[] {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
}

function applied(): Set<string> {
  try {
    const out = execSync(
      `npx wrangler d1 execute ${DB_NAME} ${flag} --json --command="SELECT id FROM _migrations"`,
      { encoding: 'utf8', cwd: REPO_ROOT, stdio: ['ignore', 'pipe', 'pipe'] },
    );
    const parsed = JSON.parse(out);
    const rows: Array<{ id: string }> = parsed[0]?.results ?? [];
    return new Set(rows.map((r) => r.id));
  } catch {
    return new Set();
  }
}

function apply(file: string): void {
  const path = join(MIGRATIONS_DIR, file);
  const sql = readFileSync(path, 'utf8');
  console.log(`→ applying ${file}`);
  execSync(
    `npx wrangler d1 execute ${DB_NAME} ${flag} --file="${path}"`,
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  execSync(
    `npx wrangler d1 execute ${DB_NAME} ${flag} --command="INSERT INTO _migrations (id, applied_at) VALUES ('${file}', ${Date.now()})"`,
    { cwd: REPO_ROOT, stdio: 'inherit' },
  );
  void sql;
}

function main(): void {
  console.log(`Migrating ${DB_NAME} (${remote ? 'REMOTE' : 'LOCAL'})`);
  const all = listMigrations();
  if (all.length === 0) {
    console.log('No migration files found.');
    return;
  }
  const done = applied();
  const pending = all.filter((f) => !done.has(f));
  if (pending.length === 0) {
    console.log('All migrations already applied.');
    return;
  }
  for (const file of pending) {
    apply(file);
  }
  console.log(`✅ Applied ${pending.length} migration(s).`);
}

main();
