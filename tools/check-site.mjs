#!/usr/bin/env node
// tools/check-site.mjs
// Verifica se todas as páginas HTML do site seguem o contrato de marcação.
// Uso: node tools/check-site.mjs [rootDir]
// Sem rootDir, usa a raiz do repositório (pasta pai de tools/).
// Código de saída: 0 se tudo ok, 1 se houver qualquer falha.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const EXCLUDED_DIRS = new Set(['docs', 'tools', '.superpowers', '.git', 'node_modules']);

const FORBIDDEN_TERMS = [
  'Masmorra de Sirelia',
  'Mestre Perin',
  'Mestre Thalik',
  'Strahd',
  'Lucia',
  'Campanha 1',
  'Espada Misteriosa',
  'Totem Misterioso',
];

const FORBIDDEN_MARKERS = ['TODO', 'TBD', 'lorem'];

// Marcadores que só devem ser tratados como proibidos em MAIÚSCULAS exatas
// (para não confundir com palavras comuns do português, como "todo"/"toda").
const CASE_SENSITIVE_MARKERS = new Set(['TODO', 'TBD']);

function stripDiacritics(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toPosix(p) {
  return p.split(path.sep).join('/');
}

/** Percorre rootDir recursivamente e devolve todos os .html encontrados,
 *  ignorando as pastas em EXCLUDED_DIRS. */
function findHtmlFiles(rootDir) {
  const results = [];
  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        results.push(path.join(dir, entry.name));
      }
    }
  }
  walk(rootDir);
  results.sort();
  return results;
}

function isIgnorableRef(value) {
  if (!value) return true;
  const v = value.trim();
  if (v === '') return true;
  if (v.startsWith('#')) return true;
  if (v.startsWith('mailto:')) return true;
  if (v.startsWith('tel:')) return true;
  if (v.startsWith('javascript:')) return true;
  if (v.startsWith('data:')) return true;
  if (v.startsWith('http://') || v.startsWith('https://')) return true;
  if (v.startsWith('//')) return true;
  return false;
}

function stripQueryHash(value) {
  return value.split('#')[0].split('?')[0];
}

function extractAttr(tagAttrs, name) {
  const re = new RegExp(name + '=["\']([^"\']*)["\']');
  const m = tagAttrs.match(re);
  return m ? m[1] : undefined;
}

/** Verifica se um <table> aberto na posição de índice `openIndex` do array
 *  ordenado de tags div/table possui um ancestral <div class="table-wrap">. */
function checkTablesWrapped(html) {
  const problems = [];
  const tagRe = /<(\/?)(\s*)(div|table)\b([^>]*)>/gi;
  const stack = [];
  let match;
  while ((match = tagRe.exec(html)) !== null) {
    const closing = match[1] === '/';
    const tagName = match[3].toLowerCase();
    const attrs = match[4] || '';
    if (!closing) {
      if (tagName === 'div') {
        const cls = extractAttr(attrs, 'class') || '';
        stack.push({ tag: 'div', isWrap: /\btable-wrap\b/.test(cls) });
      } else if (tagName === 'table') {
        const hasWrapAncestor = stack.some((s) => s.tag === 'div' && s.isWrap);
        if (!hasWrapAncestor) {
          problems.push('existe <table> fora de <div class="table-wrap">');
        }
        stack.push({ tag: 'table' });
      }
    } else {
      // Fecha a tag mais recente que combine com o nome (assume HTML bem formado).
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tagName) {
          stack.splice(i, 1);
          break;
        }
      }
    }
  }
  return problems;
}

function checkForbiddenContent(html) {
  const problems = [];
  const normalized = stripDiacritics(html).toLowerCase();
  for (const term of FORBIDDEN_TERMS) {
    const normalizedTerm = stripDiacritics(term).toLowerCase();
    const re = new RegExp('\\b' + escapeRegExp(normalizedTerm) + '\\b', 'i');
    if (re.test(normalized)) {
      problems.push(`termo proibido encontrado: "${term}"`);
    }
  }
  for (const marker of FORBIDDEN_MARKERS) {
    if (CASE_SENSITIVE_MARKERS.has(marker)) {
      // Aplicado ao texto bruto, sem lowercase/stripDiacritics e sem a flag
      // 'i': só a marca em MAIÚSCULAS conta, não a palavra em português.
      const re = new RegExp('\\b' + escapeRegExp(marker) + '\\b');
      if (re.test(html)) {
        problems.push(`marcador proibido encontrado: "${marker}"`);
      }
    } else {
      const re = new RegExp('\\b' + escapeRegExp(marker.toLowerCase()) + '\\b', 'i');
      if (re.test(normalized)) {
        problems.push(`marcador proibido encontrado: "${marker}"`);
      }
    }
  }
  return problems;
}

/** Extrai [{ raw, index }] de todos os valores de href/src no HTML,
 *  na ordem em que aparecem no documento. */
function extractRefs(html, attrNames) {
  const refs = [];
  const re = new RegExp('\\b(' + attrNames.join('|') + ')=["\']([^"\']*)["\']', 'gi');
  let match;
  while ((match = re.exec(html)) !== null) {
    refs.push({ attr: match[1].toLowerCase(), value: match[2], index: match.index });
  }
  return refs;
}

function checkPage(absPath, rootDir) {
  const relPath = toPosix(path.relative(rootDir, absPath));
  const failures = [];
  const html = fs.readFileSync(absPath, 'utf8');

  // 1. data-root / data-page no <body>
  const bodyTagMatch = html.match(/<body\b([^>]*)>/i);
  const bodyAttrs = bodyTagMatch ? bodyTagMatch[1] : '';
  const dataRoot = extractAttr(bodyAttrs, 'data-root');
  const dataPage = extractAttr(bodyAttrs, 'data-page');
  if (!bodyTagMatch || dataRoot === undefined) {
    failures.push('falta data-root no <body>');
  }
  if (!bodyTagMatch || dataPage === undefined) {
    failures.push('falta data-page no <body>');
  } else if (dataPage !== relPath) {
    failures.push(`data-page ("${dataPage}") não corresponde ao caminho real ("${relPath}")`);
  }

  // 2. <main id="conteudo"> e <title>
  if (!/<main\b[^>]*\bid=["']conteudo["'][^>]*>/i.test(html)) {
    failures.push('falta <main id="conteudo">');
  }
  if (!/<title>[^<]*<\/title>/i.test(html)) {
    failures.push('falta <title>');
  }

  // 3. hrefs/srcs relativos precisam existir em disco
  const pageDir = path.dirname(absPath);
  const refs = extractRefs(html, ['href', 'src']);
  for (const ref of refs) {
    if (isIgnorableRef(ref.value)) continue;
    const cleaned = stripQueryHash(ref.value);
    if (cleaned === '') continue;
    const target = path.resolve(pageDir, cleaned);
    if (!fs.existsSync(target)) {
      failures.push(`${ref.attr} não encontrado em disco: "${ref.value}"`);
    }
  }

  // 4. <table> fora de <div class="table-wrap">
  for (const problem of checkTablesWrapped(html)) {
    failures.push(problem);
  }

  // 5. termos e marcadores proibidos
  for (const problem of checkForbiddenContent(html)) {
    failures.push(problem);
  }

  // 6. (ruling) scripts js/whatsapp.js e js/site.js, nessa ordem
  const scriptTags = [];
  const scriptRe = /<script\b([^>]*)>/gi;
  let sMatch;
  while ((sMatch = scriptRe.exec(html)) !== null) {
    const src = extractAttr(sMatch[1], 'src');
    if (src === undefined) continue;
    const cleaned = stripQueryHash(src);
    const resolvedFromRoot = toPosix(path.relative(rootDir, path.resolve(pageDir, cleaned)));
    scriptTags.push({ src, resolvedFromRoot, index: sMatch.index });
  }
  const whatsappIdx = scriptTags.findIndex((s) => s.resolvedFromRoot === 'js/whatsapp.js');
  const siteIdx = scriptTags.findIndex((s) => s.resolvedFromRoot === 'js/site.js');
  if (whatsappIdx === -1) {
    failures.push('falta <script src=".../js/whatsapp.js">');
  }
  if (siteIdx === -1) {
    failures.push('falta <script src=".../js/site.js">');
  }
  if (whatsappIdx !== -1 && siteIdx !== -1 && whatsappIdx > siteIdx) {
    failures.push('js/whatsapp.js deve vir antes de js/site.js (ordem incorreta)');
  }

  return failures;
}

/** Verifica a NAV extraída de js/site.js. Não deve lançar exceção mesmo se
 *  js/site.js não existir; nesse caso reporta "NAV source missing". */
function checkNav(rootDir) {
  const siteJsPath = path.join(rootDir, 'js', 'site.js');
  const label = 'js/site.js';
  if (!fs.existsSync(siteJsPath)) {
    return [{ file: label, reason: 'NAV source missing (js/site.js não encontrado)' }];
  }
  let content;
  try {
    content = fs.readFileSync(siteJsPath, 'utf8');
  } catch (err) {
    return [{ file: label, reason: `NAV source missing (erro ao ler js/site.js: ${err.message})` }];
  }
  const failures = [];
  const navRe = /href:\s*'([^']+)'/g;
  const hrefs = new Set();
  let match;
  while ((match = navRe.exec(content)) !== null) {
    hrefs.add(match[1]);
  }
  for (const href of hrefs) {
    if (isIgnorableRef(href)) continue;
    const cleaned = stripQueryHash(href);
    if (cleaned === '') continue;
    const target = path.resolve(rootDir, cleaned);
    if (!fs.existsSync(target)) {
      failures.push({ file: label, reason: `NAV href não encontrado em disco: "${href}"` });
    }
  }
  return failures;
}

function main() {
  const arg = process.argv[2];
  const rootDir = arg ? path.resolve(arg) : path.resolve(__dirname, '..');

  const allFailures = [];

  for (const { file, reason } of checkNav(rootDir)) {
    allFailures.push({ file, reason });
  }

  const pages = findHtmlFiles(rootDir);
  for (const absPath of pages) {
    const relPath = toPosix(path.relative(rootDir, absPath));
    const failures = checkPage(absPath, rootDir);
    for (const reason of failures) {
      allFailures.push({ file: relPath, reason });
    }
  }

  if (allFailures.length > 0) {
    for (const { file, reason } of allFailures) {
      console.log(`${file}: ${reason}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`${pages.length} páginas ok`);
  process.exitCode = 0;
}

main();
