import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const source = readFileSync(join(here, '..', 'src', 'settings.ts'), 'utf8');

function settingBlock(name) {
  const marker = `.setName("${name}")`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `setting row not found: ${name}`);
  const next = source.indexOf('new Setting(containerEl)', start + marker.length);
  return source.slice(start, next === -1 ? source.length : next);
}

test('per-tag link limit writes the same property consumed by rendering', () => {
  const block = settingBlock('タグごとのリンク上限');
  assert.match(block, /this\.plugin\.settings\.perTagLinkLimit\s*=\s*parseInt\(value\)/);
  assert.doesNotMatch(block, /this\.plugin\.settings\.tagLinkLimit\s*=/);
});
