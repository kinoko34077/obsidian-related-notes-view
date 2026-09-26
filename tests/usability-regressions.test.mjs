import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const viewSource = readFileSync(join(here, '..', 'src', 'view.ts'), 'utf8');
const mainSource = readFileSync(join(here, '..', 'src', 'main.ts'), 'utf8');

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `missing section start: ${startMarker}`);
  const end = source.indexOf(endMarker, start + startMarker.length);
  assert.notEqual(end, -1, `missing section end: ${endMarker}`);
  return source.slice(start, end);
}

test('outgoing and backlink resolution use Obsidian canonical link resolution instead of basename prefix matching', () => {
  const outgoing = section(
    viewSource,
    '  renderOutgoingLinks(container:',
    '  renderBacklinks(container:',
  );
  const backlinks = section(viewSource, '  renderBacklinks(container:', '  async onClose');

  assert.match(outgoing, /getFirstLinkpathDest\(/);
  assert.match(backlinks, /getFirstLinkpathDest\(/);
  assert.doesNotMatch(outgoing, /startsWith\(f\.basename\)/);
  assert.doesNotMatch(backlinks, /startsWith\(activeFile\.basename\)/);
  assert.match(backlinks, /resolved\?\.path\s*===\s*activeFile\.path/);
});

test('view coalesces file-open metadata and vault mutations through one refresh scheduler', () => {
  const onOpen = section(viewSource, 'async onOpen()', 'async renderView()');

  assert.match(viewSource, /requestRender\(\)/);
  assert.match(viewSource, /refreshTimer/);
  assert.match(viewSource, /window\.clearTimeout\(/);
  assert.match(viewSource, /window\.setTimeout\(/);
  assert.match(onOpen, /workspace\.on\("file-open"/);
  assert.match(onOpen, /metadataCache\.on\("changed"/);
  assert.match(onOpen, /vault\.on\("create"/);
  assert.match(onOpen, /vault\.on\("delete"/);
  assert.match(onOpen, /vault\.on\("rename"/);
});

test('saving settings requests refresh for every open Related Notes view', () => {
  assert.match(mainSource, /refreshRelatedViews\(\)/);
  assert.match(mainSource, /getLeavesOfType\(VIEW_TYPE_RELATED_NOTES\)/);
  assert.match(mainSource, /view\.requestRender\(\)/);

  const saveSettings = section(mainSource, 'async saveSettings()', 'onunload()');
  assert.match(saveSettings, /await this\.saveData\(this\.settings\)/);
  assert.match(saveSettings, /this\.refreshRelatedViews\(\)/);
});

test('Ctrl or Cmd click requests a new leaf instead of collapsing into normal navigation', () => {
  assert.match(viewSource, /evt\.metaKey\s*\|\|\s*evt\.ctrlKey/);
  assert.match(viewSource, /openLinkText\([^\n]+openInNewLeaf/);
});
