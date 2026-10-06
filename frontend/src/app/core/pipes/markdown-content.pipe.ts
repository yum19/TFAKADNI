import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'richContent', standalone: true })
export class RichContentPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(raw: string): SafeHtml {
    if (!raw) return '';
    return this.sanitizer.bypassSecurityTrustHtml(parseRichContent(raw));
  }
}

// ─────────────────────────────────────────────────────────
// MAIN PARSER
// ─────────────────────────────────────────────────────────
function parseRichContent(raw: string): string {
  const lines = raw.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // ── H2 ──────────────────────────────────────────────
    if (line.startsWith('## ')) {
      out.push(`<div class="md-h2 anim anim-d1">${esc(line.slice(3))}</div>`);
      i++; continue;
    }

    // ── H3 (with optional leading emoji) ────────────────
    if (line.startsWith('### ')) {
      const text       = line.slice(4);
      const emojiMatch = text.match(/^([\u{1F000}-\u{1FFFF}]|[\u2600-\u27FF])\s*/u);
      const icon       = emojiMatch ? emojiMatch[0].trim() : '';
      const label      = emojiMatch ? text.slice(emojiMatch[0].length) : text;
      out.push(`<div class="md-h3 anim anim-d1">
        ${icon ? `<div class="md-h3-icon">${icon}</div>` : ''}
        <span>${esc(label)}</span>
        <span></span>
      </div>`);
      i++; continue;
    }

    // ── Horizontal rule ─────────────────────────────────
    if (line === '---' || line === '***') {
      out.push(`<div class="md-divider">
        <div class="md-divider-line"></div>
        <div class="md-divider-dot"></div>
        <div class="md-divider-line"></div>
      </div>`);
      i++; continue;
    }

    // ── Callout / blockquote ────────────────────────────
    if (line.startsWith('> ') || /^(tip|note|remember):/i.test(line)) {
      const text = line.startsWith('> ') ? line.slice(2) : line;
      out.push(`<div class="callout-box anim anim-d2">
        <div class="callout-icon">💡</div>
        <div class="callout-text">${inline(text)}</div>
      </div>`);
      i++; continue;
    }

    // ── Numbered list ────────────────────────────────────
    if (isNumberedItem(line)) {
      const items: string[] = [];
      while (i < lines.length && isNumberedItem(lines[i].trim())) {
        items.push(lines[i].trim());
        i++;
      }
      out.push(buildSteps(items));
      continue;
    }

    // ── Bullet list ──────────────────────────────────────
    if (line.startsWith('- ')) {
      const bullets: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        bullets.push(lines[i].trim().slice(2));
        i++;
      }
      out.push(buildBullets(bullets));
      continue;
    }

    // ── Normal paragraph ─────────────────────────────────
    if (line.length > 0) {
      out.push(`<p class="md-p anim anim-d1">${inline(line)}</p>`);
    }

    i++;
  }

  return out.join('\n');
}

// ─────────────────────────────────────────────────────────
// Numbered item detection
// ─────────────────────────────────────────────────────────
function isNumberedItem(line: string): boolean {
  return /^\*\*\d+[.)]\s+/.test(line) || /^\d+[.)]\s+\*\*/.test(line) || /^\d+[.)]\s+\S/.test(line);
}

// ─────────────────────────────────────────────────────────
// Numbered steps — uses existing step-like styling via
// a simple ordered list rendered as custom cards
// ─────────────────────────────────────────────────────────
function buildSteps(items: string[]): string {
  const rows = items.map((item, idx) => {
    const m1 = item.match(/^\*\*(\d+)[.)]\s+([^*]+)\*\*\s*(.*)/);
    const m2 = item.match(/^(\d+)[.)]\s+\*\*([^*]+)\*\*\s*(.*)/);
    const m3 = item.match(/^(\d+)[.)]\s+(.*)/);
    const m  = m1 || m2;
    const delay = `anim-d${Math.min(idx + 1, 6)}`;

    if (m) {
      const [, num, title, rest] = m;
      return `<div class="rc-step ${delay} anim">
        <div class="rc-step-num">${esc(num)}</div>
        <div class="rc-step-body"><strong>${esc(title.trim())}</strong>${rest ? ' — ' + inline(rest.trim()) : ''}</div>
      </div>`;
    }

    if (m3) {
      const [, num, body] = m3;
      return `<div class="rc-step ${delay} anim">
        <div class="rc-step-num">${esc(num)}</div>
        <div class="rc-step-body">${inline(body)}</div>
      </div>`;
    }

    return `<div class="rc-step ${delay} anim">
      <div class="rc-step-num">${idx + 1}</div>
      <div class="rc-step-body">${inline(item)}</div>
    </div>`;
  }).join('');

  return `<div class="rc-steps">${rows}</div>`;
}

// ─────────────────────────────────────────────────────────
// Bullets → feature cards OR pitfall cards
// Uses the exact .feature-card / .pitfall-card class names
// already defined in the component SCSS
// ─────────────────────────────────────────────────────────
const FC_COLORS = ['fc-rose', 'fc-gold', 'fc-sage', 'fc-sky', 'fc-peach'];

function buildBullets(bullets: string[]): string {
  const isFeature = bullets.length > 0 && bullets.every(b => /^\*\*[^*]+\*\*:/.test(b));

  if (isFeature) {
    const cards = bullets.map((b, idx) => {
      const m = b.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
      if (!m) return '';
      const [, title, body] = m;
      const color = FC_COLORS[idx % FC_COLORS.length];
      const delay = `anim-d${Math.min(idx + 1, 6)}`;
      return `<div class="feature-card ${color} anim ${delay}">
        <div class="fc-label">${esc(title.trim())}</div>
        <div class="fc-title">${esc(title.trim())}</div>
        <div class="fc-body">${inline(body)}</div>
      </div>`;
    }).join('');
    return `<div class="feature-grid">${cards}</div>`;
  }

  // Pitfall / plain bullets
  const cards = bullets.map((b, idx) => {
    const m = b.match(/^\*\*([^*]+)\*\*:\s*(.*)/);
    const delay = `anim-d${Math.min(idx + 1, 6)}`;
    if (m) {
      const [, title, body] = m;
      return `<div class="pitfall-card anim ${delay}">
        <div class="pitfall-icon">⚠️</div>
        <div class="pitfall-title">${esc(title)}</div>
        <div class="pitfall-body">${inline(body)}</div>
      </div>`;
    }
    // Plain bullet with no bold label — render as a simple paragraph bullet
    return `<div class="pitfall-card anim ${delay}">
      <div class="pitfall-body">${inline(b)}</div>
    </div>`;
  }).join('');
  return `<div class="pitfall-grid">${cards}</div>`;
}

// ─────────────────────────────────────────────────────────
// Inline markdown (bold, italic, code, links)
// ─────────────────────────────────────────────────────────
function inline(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g,     '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:rgba(245,232,220,0.9);padding:2px 6px;border-radius:5px;font-size:0.84em;color:var(--rose);">$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--sky);text-decoration:underline;font-weight:500;">$1</a>');
}

// HTML escape
function esc(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}