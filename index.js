import { appendFileSync } from 'node:fs';

const payloadRaw = process.env.INPUT_PAYLOAD;
const outputPath = process.env.GITHUB_OUTPUT;

const stable = (value) => {
  if (value === null) return 'null';
  const t = typeof value;
  if (t === 'string') return JSON.stringify(value);
  if (t === 'number') return Number.isFinite(value) ? String(value) : (() => { throw new Error('Invalid number value'); })();
  if (t === 'boolean') return value ? 'true' : 'false';
  if (Array.isArray(value)) {
    let s = '[';
    for (let i = 0; i < value.length; i++) {
      if (i) s += ',';
      s += stable(value[i]);
    }
    return s + ']';
  }
  if (t === 'object') {
    const keys = Object.keys(value).sort();
    let s = '{';
    for (let i = 0; i < keys.length; i++) {
      if (i) s += ',';
      const k = keys[i];
      s += JSON.stringify(k) + ':' + stable(value[k]);
    }
    return s + '}';
  }
  throw new Error('Unsupported JSON value');
};

try {
  if (typeof payloadRaw !== 'string') throw new Error('Invalid input');
  if (typeof outputPath !== 'string' || outputPath.length === 0) throw new Error('Invalid output path');

  const parsed = JSON.parse(payloadRaw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid input');
  if (!Object.prototype.hasOwnProperty.call(parsed, 'values')) throw new Error('Invalid input');
  if (!Array.isArray(parsed.values)) throw new Error('Invalid input');

  const values = parsed.values;
  const seen = new Set();
  const unique = [];
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    const key = stable(v);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(v);
    }
  }

  const result = { unique, removed: values.length - unique.length };
  appendFileSync(outputPath, `result=${JSON.stringify(result)}\n`);
} catch (e) {
  throw new Error(e instanceof Error ? e.message : 'Error');
}