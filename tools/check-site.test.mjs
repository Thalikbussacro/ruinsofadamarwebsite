// tools/check-site.test.mjs
// Self-test for tools/check-site.mjs. Builds temp fixture dirs and runs the
// checker as a subprocess against them, asserting on stdout + exit code.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const checkerPath = path.join(__dirname, 'check-site.mjs');

function run(rootDir) {
  const res = spawnSync(process.execPath, [checkerPath, rootDir], { encoding: 'utf8' });
  return res;
}

function write(rootDir, relPath, content) {
  const full = path.join(rootDir, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, 'utf8');
}

function basePage(pageRelPath, { dataRoot = './', bodyAttrs, main = true, title = true, scripts = true } = {}) {
  const body = bodyAttrs !== undefined ? bodyAttrs : `data-root="${dataRoot}" data-page="${pageRelPath}"`;
  const scriptTags = scripts === false
    ? ''
    : scripts === 'swap'
      ? `<script src="js/site.js" defer></script>\n<script src="js/whatsapp.js" defer></script>`
      : scripts === 'no-whatsapp'
        ? `<script src="js/site.js" defer></script>`
        : `<script src="js/whatsapp.js" defer></script>\n<script src="js/site.js" defer></script>`;
  const mainOpen = main ? '<main id="conteudo">' : '<div id="conteudo">';
  const mainClose = main ? '</main>' : '</div>';
  const titleTag = title ? '<title>Teste — Ruínas de Adamar</title>' : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
${titleTag}
<link rel="stylesheet" href="css/style.css">
${scriptTags}
</head>
<body ${body}>
${mainOpen}
<div class="table-wrap"><table><tr><td>ok</td></tr></table></div>
<p>Conteúdo de teste sem termos proibidos.</p>
${mainClose}
</body>
</html>`;
}

function buildGoodRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-site-good-'));
  write(root, 'css/style.css', 'body { color: #d9ccb0; }');
  write(root, 'js/whatsapp.js', fs.readFileSync(path.join(__dirname, '..', 'js', 'whatsapp.js'), 'utf8'));
  write(root, 'js/site.js', "var NAV = [{ label: 'Início', href: 'index.html' }];\n");
  write(root, 'index.html', basePage('index.html'));
  return root;
}

function buildBadRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-site-bad-'));
  write(root, 'css/style.css', 'body { color: #d9ccb0; }');
  write(root, 'js/whatsapp.js', fs.readFileSync(path.join(__dirname, '..', 'js', 'whatsapp.js'), 'utf8'));
  write(root, 'js/site.js', "var NAV = [{ label: 'Início', href: 'index.html' }, { label: 'Fantasma', href: 'nao-existe.html' }];\n");
  write(root, 'index.html', basePage('index.html'));

  write(root, 'bad-body.html', basePage('bad-body.html', { bodyAttrs: '' }));
  write(root, 'bad-mismatch.html', basePage('bad-mismatch.html', { bodyAttrs: 'data-root="./" data-page="outro.html"' }));
  write(root, 'bad-missing-main.html', basePage('bad-missing-main.html', { main: false }));
  write(root, 'bad-missing-title.html', basePage('bad-missing-title.html', { title: false }));

  write(root, 'bad-link.html', basePage('bad-link.html').replace(
    '<p>Conteúdo de teste sem termos proibidos.</p>',
    '<p>Conteúdo de teste sem termos proibidos.</p><a href="nonexistent-page.html">link quebrado</a>'
  ));

  write(root, 'bad-table.html', basePage('bad-table.html').replace(
    '<div class="table-wrap"><table><tr><td>ok</td></tr></table></div>',
    '<table><tr><td>solta</td></tr></table>'
  ));

  write(root, 'bad-forbidden.html', basePage('bad-forbidden.html').replace(
    '<p>Conteúdo de teste sem termos proibidos.</p>',
    '<p>Aqui aparece Strahd e também Lúcia no texto.</p>'
  ));

  write(root, 'bad-todo.html', basePage('bad-todo.html').replace(
    '<p>Conteúdo de teste sem termos proibidos.</p>',
    '<p>TODO: revisar este trecho.</p>'
  ));

  write(root, 'bad-scripts-missing.html', basePage('bad-scripts-missing.html', { scripts: 'no-whatsapp' }));
  write(root, 'bad-scripts-order.html', basePage('bad-scripts-order.html', { scripts: 'swap' }));

  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

// --- Test 1: good fixture must pass cleanly (0 failures, exit 0) ---
{
  const root = buildGoodRoot();
  try {
    const res = run(root);
    assert.equal(res.status, 0, `esperado exit 0 no fixture bom, obteve ${res.status}\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
    assert.match(res.stdout, /1 p[aá]ginas? ok/i);
  } finally {
    cleanup(root);
  }
}

// --- Test 2: bad fixture must fail with legible per-file reasons ---
{
  const root = buildBadRoot();
  try {
    const res = run(root);
    assert.equal(res.status, 1, `esperado exit 1 no fixture ruim, obteve ${res.status}\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
    const out = res.stdout;

    assert.match(out, /bad-body\.html:.*data-root|bad-body\.html:.*data-page/i);
    assert.match(out, /bad-mismatch\.html:.*data-page/i);
    assert.match(out, /bad-missing-main\.html:.*main/i);
    assert.match(out, /bad-missing-title\.html:.*title/i);
    assert.match(out, /bad-link\.html:.*nonexistent-page\.html/);
    assert.match(out, /bad-table\.html:.*table-wrap/i);
    assert.match(out, /bad-forbidden\.html:.*(Strahd|Lúcia|Lucia)/i);
    assert.match(out, /bad-todo\.html:.*TODO/);
    assert.match(out, /bad-scripts-missing\.html:.*whatsapp/i);
    assert.match(out, /bad-scripts-order\.html:.*(ordem|antes)/i);
    assert.match(out, /js\/site\.js:.*nao-existe\.html/);

    // The good page in this same root must not be reported as failing.
    assert.doesNotMatch(out, /^index\.html:/m);

    // Must not crash (no stack trace on stderr).
    assert.equal(res.stderr, '', `stderr deveria estar vazio, obteve:\n${res.stderr}`);
  } finally {
    cleanup(root);
  }
}

// --- Test 3: empty root (no pages, no js/site.js) must fail legibly, not crash ---
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'check-site-empty-'));
  try {
    const res = run(root);
    assert.equal(res.status, 1, `esperado exit 1 em raiz vazia, obteve ${res.status}`);
    assert.match(res.stdout, /js\/site\.js:.*NAV source missing/i);
    assert.equal(res.stderr, '', `stderr deveria estar vazio (sem crash), obteve:\n${res.stderr}`);
  } finally {
    cleanup(root);
  }
}

// --- Test 4: accent-insensitive forbidden-term matching (Lucia vs Lúcia) ---
{
  const root = buildGoodRoot();
  try {
    write(root, 'index.html', basePage('index.html').replace(
      '<p>Conteúdo de teste sem termos proibidos.</p>',
      '<p>Menção a Lucia sem acento.</p>'
    ));
    const res = run(root);
    assert.equal(res.status, 1);
    assert.match(res.stdout, /index\.html:.*Lucia/i);
  } finally {
    cleanup(root);
  }
}

// --- Test 5: "todo"/"TBD" markers must be case-sensitive: real Portuguese
// words like "todo dia" / "mundo todo" must pass, an uppercase "TODO" must
// still fail. ---
{
  const root = buildGoodRoot();
  try {
    write(root, 'index.html', basePage('index.html').replace(
      '<p>Conteúdo de teste sem termos proibidos.</p>',
      '<p>Isso acontece todo dia, em todo o mundo, e vale para todo lugar.</p>'
    ));
    const res = run(root);
    assert.equal(res.status, 0, `esperado exit 0 com "todo" em português, obteve ${res.status}\nstdout:\n${res.stdout}\nstderr:\n${res.stderr}`);
  } finally {
    cleanup(root);
  }
}
{
  const root = buildGoodRoot();
  try {
    write(root, 'index.html', basePage('index.html').replace(
      '<p>Conteúdo de teste sem termos proibidos.</p>',
      '<p>TODO: revisar isso. TBD também.</p>'
    ));
    const res = run(root);
    assert.equal(res.status, 1, `esperado exit 1 com "TODO"/"TBD" em maiúsculas, obteve ${res.status}\nstdout:\n${res.stdout}`);
    assert.match(res.stdout, /index\.html:.*TODO/);
    assert.match(res.stdout, /index\.html:.*TBD/);
  } finally {
    cleanup(root);
  }
}

console.log('check-site self-test ok');
