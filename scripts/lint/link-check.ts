#!/usr/bin/env tsx
/**
 * link-check — spec-drift sub-check
 *
 * Asserts (per `22-infrastructure/09-ci-cd.md §2.1.1` row): every relative
 * markdown link in spec/21-app (recursive `.md` files) resolves to an existing file. Locks W-5.
 *
 * Implementation note: the §2.1.1 row suggests `lychee --offline`. This
 * implementation is a pure-Node equivalent — same offline guarantee, no Rust
 * dep, fits the "no-deps-beyond-tsx" convention. If lychee is later adopted in
 * CI, this script can become its wrapper.
 *
 * What's checked:
 *   - Markdown link targets matching `[text](path-or-url)`.
 *   - Wiki-style local refs `mem://...` are skipped (handled by memory tooling).
 *   - Absolute URLs (http://, https://, mailto:, tel:, ftp://) are skipped (offline mode).
 *   - In-page anchors (`#section`) are skipped (no header table of contents check).
 *   - Relative paths (with optional `#anchor`) are resolved relative to the file's dir,
 *     stripped of the anchor, and required to exist on disk.
 *   - Image links `![alt](path)` checked the same way.
 *
 * Allowlist: `scripts/lint/link-check.allowlist.txt` — `<file>:<rawTarget>` entries
 * exempt specific link occurrences (planned future paths, intentional dead refs, etc.).
 *
 * Output: `{file}:{line}:{col} [link-check] {message}`. Exit 0 = clean; 1 = violations.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';

const ROOT = 'spec/21-app';
const ALLOWLIST_PATH = 'scripts/lint/link-check.allowlist.txt';

// Markdown link/image regex. Permits images (`![...](...)`) too.
// Capture group 1 = target. Avoids matching `\[` escaped brackets.
const LINK_RE = /(?<!\\)!?\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

const SKIP_SCHEMES = /^(https?:|mailto:|tel:|ftp:|ftps:|ws:|wss:|data:|chrome-extension:|chrome:|about:|file:|#|\/\/|mem:\/\/)/i;

type Violation = { file: string; line: number; col: number; message: string };
const violations: Violation[] = [];

function loadAllowlist(): Set<string> {
  if (!existsSync(ALLOWLIST_PATH)) return new Set();
  const out = new Set<string>();
  for (const line of readFileSync(ALLOWLIST_PATH, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    out.add(t);
  }
  return out;
}
const allowlist = loadAllowlist();

function* walkFiles(dir: string): Generator<string> {
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) yield* walkFiles(full);
    else if (name.endsWith('.md')) yield full;
  }
}

let scannedFiles = 0;
let checkedLinks = 0;

for (const path of walkFiles(ROOT)) {
  scannedFiles++;
  const rel = relative('.', path);
  const fileDir = dirname(path);
  const lines = readFileSync(path, 'utf8').split('\n');

  // Skip fenced code blocks — links inside ```...``` blocks are illustrative, not
  // navigational. Track block state line by line.
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const re = new RegExp(LINK_RE.source, 'g');
    let m: RegExpExecArray | null;
    while ((m = re.exec(line)) !== null) {
      let target = m[1].trim();
      if (!target) continue;
      if (SKIP_SCHEMES.test(target)) continue;

      checkedLinks++;
      const allowKey = `${rel}:${target}`;
      if (allowlist.has(allowKey)) continue;

      // Strip in-file anchor
      const hashIdx = target.indexOf('#');
      const pathPart = hashIdx >= 0 ? target.slice(0, hashIdx) : target;
      if (!pathPart) continue; // pure anchor like `#section`

      // Resolve relative to the markdown file's directory
      const resolved = normalize(resolve(fileDir, pathPart));
      if (!existsSync(resolved)) {
        violations.push({
          file: rel,
          line: i + 1,
          col: m.index + 1,
          message: `broken relative link: "${target}" → ${relative('.', resolved)} (not found)`,
        });
      }
    }
  }
}

violations.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
for (const v of violations) console.log(`${v.file}:${v.line}:${v.col} [link-check] ${v.message}`);

if (violations.length > 0) {
  console.error(`\n${violations.length} broken link(s) across ${scannedFiles} files (${checkedLinks} relative links checked)`);
  process.exit(1);
}
console.log(`link-check: clean — ${checkedLinks} relative links resolved across ${scannedFiles} files`);
