export const DISPLAY_LIMIT_KEYS = Object.freeze([
  'tagLimit',
  'tagLinkLimit',
  'perTagLinkLimit',
  'outgoingLinkLimit',
  'backlinkLimit',
]);

export const BOOLEAN_SETTING_KEYS = Object.freeze([
  'randomizeOrder',
  'showTagHierarchy',
  'showDividers',
  'hideTagsWithoutLinks',
  'allowTagOverlapOutsideHierarchy',
]);

const STRING_SETTING_KEYS = Object.freeze([
  'fontSize',
  'lineHeight',
]);

const HEADING_STYLES = new Set(['default', 'minimal']);

export function normalizeDisplayLimit(value, fallback) {
  const fallbackNumber = typeof fallback === 'number' && Number.isFinite(fallback)
    ? Math.min(Math.max(Math.trunc(fallback), 0), Number.MAX_SAFE_INTEGER)
    : 0;

  let parsed;
  if (typeof value === 'number') {
    parsed = value;
  } else if (typeof value === 'string' && value.trim() !== '') {
    parsed = Number(value.trim());
  } else {
    return fallbackNumber;
  }

  if (!Number.isFinite(parsed)) return fallbackNumber;
  return Math.min(Math.max(Math.trunc(parsed), 0), Number.MAX_SAFE_INTEGER);
}

export function normalizeRelatedSettings(rawSettings, defaults) {
  const raw = rawSettings && typeof rawSettings === 'object' ? rawSettings : {};
  const normalized = { ...defaults, ...raw };

  for (const key of DISPLAY_LIMIT_KEYS) {
    normalized[key] = normalizeDisplayLimit(raw[key], defaults[key]);
  }

  for (const key of BOOLEAN_SETTING_KEYS) {
    const fallback = typeof defaults[key] === 'boolean' ? defaults[key] : false;
    normalized[key] = typeof raw[key] === 'boolean' ? raw[key] : fallback;
  }

  for (const key of STRING_SETTING_KEYS) {
    const fallback = typeof defaults[key] === 'string' ? defaults[key] : '';
    normalized[key] = typeof raw[key] === 'string' ? raw[key] : fallback;
  }

  const defaultHiddenPaths = Array.isArray(defaults.hiddenNotePaths)
    && defaults.hiddenNotePaths.every((path) => typeof path === 'string')
    ? [...defaults.hiddenNotePaths]
    : [];
  normalized.hiddenNotePaths = Array.isArray(raw.hiddenNotePaths)
    && raw.hiddenNotePaths.every((path) => typeof path === 'string')
    ? [...raw.hiddenNotePaths]
    : defaultHiddenPaths;

  const defaultHeadingStyle = HEADING_STYLES.has(defaults.headingStyle)
    ? defaults.headingStyle
    : 'default';
  normalized.headingStyle = HEADING_STYLES.has(raw.headingStyle)
    ? raw.headingStyle
    : defaultHeadingStyle;

  return normalized;
}

export function buildTagTree(tags) {
  const root = new Map();
  for (const tag of tags) {
    const parts = String(tag).split('/');
    let node = root;
    for (const part of parts) {
      if (!node.has(part)) {
        node.set(part, { children: new Map() });
      }
      node = node.get(part).children;
    }
  }
  return root;
}