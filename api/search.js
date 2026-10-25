/**
 * XingDeng Search API
 * 
 * Dual-mode search system:
 *   MODE A: LOCATE - Find things (exact match, no AI reasoning)
 *   MODE B: ANALYZE - Understand things (RAG over internal knowledge)
 * 
 * Intent Detection:
 *   Short keywords → LOCATE
 *   Question words (為什麼/如何/比較/分析) → ANALYZE
 * 
 * Rules:
 *   - Internal data only
 *   - No external links
 *   - No forums/YouTube/Reddit
 *   - No AI reasoning in LOCATE mode
 */

const fs = require('fs');
const path = require('path');

// Load index
let searchIndex = [];
try {
  const indexPath = path.join(__dirname, '..', 'data', 'search-index.json');
  searchIndex = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
} catch (e) {
  console.error('Failed to load search index:', e.message);
}

// Intent keywords for ANALYZE mode
const ANALYZE_KEYWORDS = [
  '為什麼', '如何', '怎麼', '怎樣', '推薦', '建議', '比較', '分析',
  '規劃', '差異', '區別', '優缺點', '適合', '應該', '可以', '能不能',
  '為什麼', '怎麼做', '如何做', '有哪些', '什麼是', '是不是',
  'why', 'how', 'recommend', 'compare', 'analyze', 'suggest', 'which'
];

// Detect search mode
function detectMode(query) {
  const q = query.trim().toLowerCase();
  
  // Check for question/analysis intent
  for (const keyword of ANALYZE_KEYWORDS) {
    if (q.includes(keyword.toLowerCase())) {
      return 'ANALYZE';
    }
  }
  
  // Check for question marks
  if (q.includes('？') || q.includes('?')) {
    return 'ANALYZE';
  }
  
  // Default to LOCATE for short queries
  return 'LOCATE';
}

// LOCATE mode: exact search, no AI reasoning
function locateSearch(query) {
  const q = query.trim().toLowerCase();
  const terms = q.split(/\s+/).filter(t => t.length > 0);
  
  if (terms.length === 0) return [];
  
  const results = [];
  
  for (const entry of searchIndex) {
    let score = 0;
    let matchedTerms = [];
    
    // Title match (highest weight)
    const titleLower = (entry.title || '').toLowerCase();
    for (const term of terms) {
      if (titleLower.includes(term)) {
        score += 10;
        matchedTerms.push(term);
      }
    }
    
    // H1 match
    const h1Lower = (entry.h1 || '').toLowerCase();
    for (const term of terms) {
      if (h1Lower.includes(term)) {
        score += 8;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }
    
    // Description match
    const descLower = (entry.description || '').toLowerCase();
    for (const term of terms) {
      if (descLower.includes(term)) {
        score += 5;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }
    
    // Body match (lower weight)
    const bodyLower = (entry.body || '').toLowerCase();
    for (const term of terms) {
      if (bodyLower.includes(term)) {
        score += 2;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }
    
    // Section title match
    if (entry.sections) {
      for (const section of entry.sections) {
        const sectionTitleLower = (section.title || '').toLowerCase();
        for (const term of terms) {
          if (sectionTitleLower.includes(term)) {
            score += 6;
            if (!matchedTerms.includes(term)) matchedTerms.push(term);
          }
        }
      }
    }
    
    // Path match
    const pathLower = (entry.path || '').toLowerCase();
    for (const term of terms) {
      if (pathLower.includes(term)) {
        score += 3;
        if (!matchedTerms.includes(term)) matchedTerms.push(term);
      }
    }
    
    if (score > 0) {
      // Extract summary snippet
      let summary = entry.description || '';
      if (!summary && entry.body) {
        // Find first occurrence and extract context
        const firstTerm = matchedTerms[0];
        const idx = entry.body.toLowerCase().indexOf(firstTerm);
        if (idx >= 0) {
          const start = Math.max(0, idx - 50);
          const end = Math.min(entry.body.length, idx + 150);
          summary = (start > 0 ? '...' : '') + entry.body.substring(start, end) + (end < entry.body.length ? '...' : '');
        } else {
          summary = entry.body.substring(0, 200);
        }
      }
      
      results.push({
        title: entry.title,
        summary: summary.substring(0, 200),
        path: entry.path,
        category: entry.category,
        lastUpdated: entry.lastUpdated,
        score,
        matchedTerms,
      });
    }
  }
  
  // Sort by score descending
  results.sort((a, b) => b.score - a.score);
  
  return results.slice(0, 10); // Top 10 results
}

// ANALYZE mode: RAG over internal knowledge
function analyzeSearch(query) {
  const q = query.trim().toLowerCase();
  
  // Gather relevant content from index
  const relevantEntries = [];
  
  for (const entry of searchIndex) {
    let relevance = 0;
    
    // Check title
    if ((entry.title || '').toLowerCase().includes(q.substring(0, 20))) {
      relevance += 5;
    }
    
    // Check body for keywords
    const bodyLower = (entry.body || '').toLowerCase();
    const queryWords = q.split(/\s+/).filter(w => w.length > 1);
    for (const word of queryWords) {
      if (bodyLower.includes(word)) {
        relevance += 1;
      }
    }
    
    if (relevance > 0) {
      relevantEntries.push({
        path: entry.path,
        title: entry.title,
        category: entry.category,
        content: entry.body ? entry.body.substring(0, 500) : '',
        sections: entry.sections || [],
        relevance,
      });
    }
  }
  
  // Sort by relevance
  relevantEntries.sort((a, b) => b.relevance - a.relevance);
  
  // Build analysis response
  const topEntries = relevantEntries.slice(0, 5);
  
  // Generate summary from top entries
  let analysis = '';
  
  if (topEntries.length === 0) {
    analysis = '站內未找到相關內容。請嘗試其他關鍵詞，或瀏覽我們的產品頁面了解更多。';
  } else {
    // Build context-aware response
    const categories = [...new Set(topEntries.map(e => e.category))];
    
    if (categories.includes('product')) {
      analysis = '根據站內產品資訊：\n\n';
    } else if (categories.includes('article')) {
      analysis = '根據站內文章內容：\n\n';
    } else if (categories.includes('pricing')) {
      analysis = '根據站內定價資訊：\n\n';
    } else if (categories.includes('faq')) {
      analysis = '根據常見問題：\n\n';
    } else {
      analysis = '根據站內內容分析：\n\n';
    }
    
    // Add summaries from top entries
    for (let i = 0; i < Math.min(3, topEntries.length); i++) {
      const entry = topEntries[i];
      analysis += `**${entry.title}** (${entry.path})\n`;
      
      // Extract relevant snippet
      if (entry.content) {
        const snippet = entry.content.substring(0, 150).trim();
        analysis += `${snippet}...\n\n`;
      }
    }
    
    analysis += '---\n以上資訊來自站內內容。如需更詳細說明，請查看相關頁面或聯繫我們。';
  }
  
  return {
    mode: 'ANALYZE',
    query,
    analysis,
    sources: topEntries.map(e => ({
      title: e.title,
      path: e.path,
      category: e.category,
    })),
  };
}

module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { query, mode } = req.method === 'POST' ? req.body : req.query;
  
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return res.status(400).json({
      error: 'Missing query parameter',
      message: '請輸入搜尋內容',
    });
  }
  
  // Determine mode
  const searchMode = mode || detectMode(query);
  
  if (searchMode === 'LOCATE') {
    const results = locateSearch(query);
    return res.status(200).json({
      mode: 'LOCATE',
      query,
      results,
      count: results.length,
    });
  } else {
    const analysis = analyzeSearch(query);
    return res.status(200).json(analysis);
  }
};
