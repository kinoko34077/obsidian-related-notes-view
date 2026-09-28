import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildTagTree,
  normalizeDisplayLimit,
  normalizeRelatedSettings,
} from '../src/runtime-contracts.js';

const defaults = {
  tagLimit: 3,
  tagLinkLimit: 5,
  perTagLinkLimit: 5,
  outgoingLinkLimit: 5,
  backlinkLimit: 5,
  randomizeOrder: false,
};

test('tag tree preserves prototype-named segments at every depth', () => {
  const tree = buildTagTree([
    '__proto__/child',
    'constructor/prototype',
    'ordinary/__proto__/leaf',
  ]);

  assert.deepEqual([...tree.keys()], ['__proto__', 'constructor', 'ordinary']);
  assert.ok(tree.get('__proto__')?.children.has('child'));
  assert.ok(tree.get('constructor')?.children.has('prototype'));
  assert.ok(tree.get('ordinary')?.children.get('__proto__')?.children.has('leaf'));
});

test('display limits normalize runtime values without negative slice semantics', () => {
  assert.equal(normalizeDisplayLimit(-1, 5), 0);
  assert.equal(normalizeDisplayLimit('-2', 5), 0);
  assert.equal(normalizeDisplayLimit('7', 5), 7);
  assert.equal(normalizeDisplayLimit('3.9', 5), 3);
  assert.equal(normalizeDisplayLimit('not-a-number', 5), 5);
  assert.equal(normalizeDisplayLimit(Infinity, 5), 5);
  assert.equal(normalizeDisplayLimit(Number.MAX_SAFE_INTEGER + 1000, 5), Number.MAX_SAFE_INTEGER);
});

test('loaded settings normalize every display limit while preserving valid settings', () => {
  const normalized = normalizeRelatedSettings({
    tagLimit: -5,
    tagLinkLimit: '8',
    perTagLinkLimit: 'bad',
    outgoingLinkLimit: 12.8,
    backlinkLimit: Number.POSITIVE_INFINITY,
    randomizeOrder: true,
  }, defaults);

  assert.equal(normalized.tagLimit, 0);
  assert.equal(normalized.tagLinkLimit, 8);
  assert.equal(normalized.perTagLinkLimit, 5);
  assert.equal(normalized.outgoingLinkLimit, 12);
  assert.equal(normalized.backlinkLimit, 5);
  assert.equal(normalized.randomizeOrder, true);
});

test('runtime contracts are wired into load, edit, and tag rendering paths', () => {
  const mainSource = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
  const settingsSource = readFileSync(new URL('../src/settings.ts', import.meta.url), 'utf8');
  const viewSource = readFileSync(new URL('../src/view.ts', import.meta.url), 'utf8');

  assert.match(mainSource, /normalizeRelatedSettings\(await this\.loadData\(\), DEFAULT_SETTINGS\)/);
  for (const key of ['tagLimit', 'perTagLinkLimit', 'outgoingLinkLimit', 'backlinkLimit']) {
    assert.match(settingsSource, new RegExp(`settings\\.${key} = normalizeDisplayLimit\\(value, this\\.plugin\\.settings\\.${key}\\)`));
  }
  assert.match(viewSource, /const tagTree = buildTagTree\(tags\)/);
  assert.match(viewSource, /for \(const \[tag, tagNode\] of node\)/);
});
