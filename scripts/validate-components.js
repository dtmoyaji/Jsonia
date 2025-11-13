#!/usr/bin/env node
// Simple utility to validate all components in components/ and jsonia-editor/components/
const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');

const root = path.join(__dirname, '..');
const schemaPath = path.join(root, 'server', 'schemas', 'component-schema.json');
if (!fs.existsSync(schemaPath)) {
  console.error('component schema not found:', schemaPath);
  process.exit(1);
}
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const ajv = new Ajv({ allErrors: true, strict: false });
const validate = ajv.compile(schema);

function walkAndValidate(dir) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...walkAndValidate(full));
    } else if (e.isFile() && e.name.endsWith('.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(full, 'utf8'));
        const ok = validate(data);
        results.push({
          file: path.relative(root, full),
          valid: ok,
          errors: ok ? null : validate.errors,
        });
      } catch (err) {
        results.push({ file: path.relative(root, full), valid: false, errors: [err.message] });
      }
    }
  }
  return results;
}

const compDirs = [path.join(root, 'components'), path.join(root, 'jsonia-editor', 'components')];
let all = [];
for (const d of compDirs) {
  all.push(...walkAndValidate(d));
}

let invalid = all.filter((r) => !r.valid);
if (invalid.length === 0) {
  console.log('All component JSON files are valid according to component-schema.json');
  process.exit(0);
}

console.log(`${invalid.length} invalid component files:`);
for (const v of invalid) {
  console.log('-', v.file, v.errors);
}
process.exit(2);
