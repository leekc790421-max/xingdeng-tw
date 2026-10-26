#!/usr/bin/env node
/**
 * XingDeng Search Index Builder
 * Scans HTML files and builds a structured search index.
 * 
 * Index scope (per governance):
 *   /pricing, /products/*, /services, /articles/*,
 *   /templates/*, /faq, /domains
 * 
 * Excluded:
 *   /admin, /contracts/*, /snt-support
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const INCLUDE = [
  { pattern: 'pricing.html', path: '/pricing', category: 'pricing' },
  { pattern: 'solutions.html', path: '/solutions', category: 'services' },
  { pattern: 'faq.html', path: '/faq', category: 'faq' },
  { pattern: 'knowledge.html', path: '/knowledge', category: 'faq' },
  { pattern: 'what-is-xingdeng.html', path: '/what-is-xingdeng', category: 'article' },
  { pattern: 'contact.html', path: '/contact', category: 'contact' },
  { pattern: 'index.html', path: '/', category: 'home' },
];

const INCLUDE_DIRS = [
  { dir: 'products', pathPrefix: '/products', category: 'product' },
  { dir: 'articles', pathPrefix: '/articles', category: 'article' },
  { dir: 'templates', pathPrefix: '/templates', category: 'template' },
];

const EXCLUDE_DIRS = ['admin', 'contracts', 'snt-support', 'api', 'scripts', 'data', 'node_modules', '.git'];

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMeta(html, filepath) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  return {
    title: titleMatch ? stripHtml(titleMatch[1]).substring(0, 120) : path.basename(filepath, '.html'),
    description: descMatch ? descMatch[1].substring(0, 200) : '',
    h1: h1Match ? stripHtml(h1Match[1]).substring(0, 120) : '',
  };
}

function extractSections(html) {
  const sections = [];
  const h2regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let match;
  while ((match = h2regex.exec(html)) !== null) {
    const title = stripHtml(match[1]).substring(0, 100);
    const after = html.substring(match.index + match[0].length, match.index + match[0].length + 500);
    const text = stripHtml(after).substring(0, 200);
    if (title && title.length > 1) {
      sections.push({ title, text });
    }
  }
  return sections;
}

function buildIndex() {
  const entries = [];
  const now = new Date().toISOString();

  // Single files
  for (const item of INCLUDE) {
    const filepath = path.join(ROOT, item.pattern);
    if (!fs.existsSync(filepath)) continue;
    const html = fs.readFileSync(filepath, 'utf-8');
    const meta = extractMeta(html, filepath);
    const bodyText = stripHtml(html).substring(0, 2000);
    const sections = extractSections(html);

    entries.push({
      path: item.path,
      title: meta.title,
      h1: meta.h1,
      description: meta.description,
      body: bodyText,
      sections,
      category: item.category,
      lastUpdated: now,
    });
  }

  // Directory scans
  for (const dirConfig of INCLUDE_DIRS) {
    const dirPath = path.join(ROOT, dirConfig.dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html')).sort();
    for (const file of files) {
      const filepath = path.join(dirPath, file);
      const html = fs.readFileSync(filepath, 'utf-8');
      const meta = extractMeta(html, filepath);
      const bodyText = stripHtml(html).substring(0, 2000);
      const sections = extractSections(html);
      const slug = path.basename(file, '.html');
      const stat = fs.statSync(filepath);

      entries.push({
        path: `${dirConfig.pathPrefix}/${slug}`,
        title: meta.title,
        h1: meta.h1,
        description: meta.description,
        body: bodyText,
        sections,
        category: dirConfig.category,
        lastUpdated: stat.mtime.toISOString(),
      });
    }
  }

  // Check domains.html if exists
  const domainsPath = path.join(ROOT, 'domains.html');
  if (fs.existsSync(domainsPath)) {
    const html = fs.readFileSync(domainsPath, 'utf-8');
    const meta = extractMeta(html, domainsPath);
    entries.push({
      path: '/domains',
      title: meta.title || '網域分租',
      h1: meta.h1,
      description: meta.description,
      body: stripHtml(html).substring(0, 2000),
      sections: extractSections(html),
      category: 'domain',
      lastUpdated: now,
    });
  }

  return entries;
}

// Build and write
const index = buildIndex();
const outputPath = path.join(ROOT, 'data', 'search-index.json');

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(index, null, 2), 'utf-8');

console.log(`Search index built: ${index.length} entries -> ${outputPath}`);
index.forEach(e => console.log(`  ${e.category.padEnd(10)} ${e.path.padEnd(40)} ${e.title.substring(0, 40)}`));
