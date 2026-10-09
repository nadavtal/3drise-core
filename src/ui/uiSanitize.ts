// =============================================================================
// Sanitizer for UI layers
// =============================================================================
//
// Agent-written HTML/CSS runs on 3drise.ai and on other people's sites, so it is
// reduced to a closed, script-free subset before it is stored and again before it is
// rendered (the viewer never trusts what it is handed). Browser only: it needs
// DOMParser and constructable stylesheets.
//
// HTML:  tag + attribute allow-lists. Scripts, styles, forms, frames, `on*`,
//        `javascript:` links and non-https / non-image sources are removed.
// CSS:   parsed by the browser (CSSOM), so escapes cannot hide anything; rules are
//        re-serialised from what the browser understood. @import, @font-face and
//        other at-rules are dropped (system fonts only); a rule with a `url()` that
//        is not https: / data:image / #fragment is dropped. External https images are
//        allowed — that is the one thing a layer can fetch.
//

export interface SanitizeResult {
    out: string;
    /** What was removed or changed, for the agent / the studio to show. */
    removed: string[];
}

const HTML_TAGS = new Set([
    'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'button', 'a', 'label', 'input', 'select', 'option',
    'ul', 'ol', 'li', 'img', 'small', 'strong', 'em', 'b', 'i', 'u', 'br', 'hr', 'section', 'header', 'footer', 'nav',
    'article', 'aside', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'td', 'th', 'dl', 'dt', 'dd', 'sub', 'sup', 'kbd', 'code', 'pre',
]);
const SVG_TAGS = new Set([
    'svg', 'g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon', 'defs', 'lineargradient', 'radialgradient',
    'stop', 'title', 'desc', 'text', 'tspan', 'clippath', 'mask',
]);
/** Removed with their whole content (not unwrapped). */
const DROP_TAGS = new Set([
    'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet', 'link', 'meta', 'base', 'template', 'noscript',
    'form', 'textarea', 'video', 'audio', 'source', 'track', 'canvas', 'portal', 'dialog',
    'use', 'foreignobject', 'animate', 'animatetransform', 'animatemotion', 'set', 'image', 'filter', 'pattern', 'symbol', 'marker',
]);

const GLOBAL_ATTRS = new Set([
    'class', 'id', 'style', 'title', 'role', 'hidden', 'lang', 'dir', 'draggable',
]);
const HTML_ATTRS = new Set([
    'href', 'src', 'alt', 'width', 'height', 'type', 'min', 'max', 'step', 'value', 'placeholder', 'checked', 'disabled',
    'for', 'tabindex', 'target', 'rel', 'colspan', 'rowspan', 'selected', 'readonly', 'maxlength', 'inputmode',
]);
const SVG_ATTRS = new Set([
    'viewbox', 'd', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'fill-opacity',
    'opacity', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'points', 'transform',
    'offset', 'stop-color', 'stop-opacity', 'gradientunits', 'gradienttransform', 'fill-rule', 'clip-rule',
    'preserveaspectratio', 'xmlns', 'font-size', 'text-anchor', 'dominant-baseline', 'stroke-dasharray', 'stroke-dashoffset',
    'clip-path', 'mask', 'vector-effect',
]);
const INPUT_TYPES = new Set(['range', 'text', 'number', 'checkbox', 'radio', 'search', 'color']);

const IMG_DATA = /^data:image\/(png|jpe?g|gif|webp|avif|svg\+xml)[;,]/i;
const isHttps = (u: string) => /^https:\/\//i.test(u);

/** Normalised CSS text is checked, never the raw text: the browser has already resolved escapes. */
const BAD_CSS = /expression\s*\(|javascript:|vbscript:|-moz-binding|behavior\s*:|image-set\s*\(|\bsrc\s*\(|@import/i;
const URL_RE = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi;

function cssTextIsSafe(text: string): boolean {
    if (BAD_CSS.test(text)) return false;
    URL_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = URL_RE.exec(text))) {
        const u = (m[1] ?? m[2] ?? m[3] ?? '').trim();
        if (!(isHttps(u) || IMG_DATA.test(u) || u.startsWith('#'))) return false;
    }
    return true;
}

function newSheet(): CSSStyleSheet | null {
    try { return new CSSStyleSheet(); } catch { return null; }
}

const GROUPING = /^@(media|supports|container|layer)\b/i;

function serializeRule(rule: CSSRule, removed: string[]): string {
    const text = rule.cssText;
    if (rule instanceof CSSStyleRule) {
        const own = rule.style.cssText;
        if (!cssTextIsSafe(own) || !cssTextIsSafe(rule.selectorText)) { removed.push(`rule ${rule.selectorText}`); return ''; }
        const nested = Array.from((rule as CSSStyleRule & { cssRules?: CSSRuleList }).cssRules ?? []).map(r => serializeRule(r, removed)).join('');
        return `${rule.selectorText}{${own}${nested ? ';' + nested : ''}}`;
    }
    if (rule instanceof CSSKeyframesRule) {
        const frames = Array.from(rule.cssRules).map(f => {
            const k = f as CSSKeyframeRule;
            return cssTextIsSafe(k.style.cssText) ? `${k.keyText}{${k.style.cssText}}` : '';
        }).join('');
        return `@keyframes ${rule.name}{${frames}}`;
    }
    if (GROUPING.test(text) && 'cssRules' in rule) {
        const header = text.slice(0, text.indexOf('{')).trim();
        if (!cssTextIsSafe(header)) { removed.push(header); return ''; }
        const inner = Array.from((rule as CSSGroupingRule).cssRules).map(r => serializeRule(r, removed)).join('');
        return `${header}{${inner}}`;
    }
    removed.push(text.slice(0, 40).replace(/\s+/g, ' '));
    return '';
}

/** Keep the rules the browser understood and that are safe; drop the rest. */
export function sanitizeUiCss(css: string): SanitizeResult {
    const removed: string[] = [];
    const sheet = newSheet();
    if (!sheet) return { out: '', removed: ['this browser cannot sanitize CSS (no constructable stylesheets); the CSS was not applied'] };
    try { sheet.replaceSync(css ?? ''); } catch { return { out: '', removed: ['the CSS could not be parsed'] }; }
    const out = Array.from(sheet.cssRules).map(r => serializeRule(r, removed)).join('\n');
    if (/@import/i.test(css ?? '')) removed.push('@import');
    return { out, removed };
}

/** An inline `style="…"` value, normalised, or '' when unsafe. */
function sanitizeStyleAttr(value: string, removed: string[]): string {
    const sheet = newSheet();
    if (!sheet) { removed.push('style attribute'); return ''; }
    try { sheet.replaceSync(`x{${value}}`); } catch { return ''; }
    const rule = sheet.cssRules[0];
    const text = rule instanceof CSSStyleRule ? rule.style.cssText : '';
    if (!cssTextIsSafe(text)) { removed.push('style attribute (unsafe url or function)'); return ''; }
    return text;
}

const describe = (el: Element) => `<${el.localName}>`;

function cleanElement(el: Element, removed: string[]): void {
    const tag = el.localName.toLowerCase();
    const isSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
    const allowedAttrs = isSvg ? SVG_ATTRS : HTML_ATTRS;

    for (const attr of Array.from(el.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value;
        let keep = false;
        if (name.startsWith('data-') || name.startsWith('aria-')) keep = true;
        else if (GLOBAL_ATTRS.has(name)) keep = true;
        else if (allowedAttrs.has(name)) keep = true;
        if (!keep) { removed.push(`${describe(el)} ${name}`); el.removeAttribute(attr.name); continue; }

        if (name === 'style') {
            const clean = sanitizeStyleAttr(value, removed);
            if (clean) el.setAttribute('style', clean); else el.removeAttribute('style');
        } else if (name === 'href') {
            if (!(isHttps(value) || /^mailto:/i.test(value) || value.startsWith('#'))) { removed.push(`${describe(el)} href`); el.removeAttribute(attr.name); }
        } else if (name === 'src') {
            if (!(isHttps(value) || IMG_DATA.test(value))) { removed.push(`${describe(el)} src`); el.removeAttribute(attr.name); }
        } else if (name === 'target') {
            if (value !== '_blank') el.removeAttribute(attr.name);
        } else if (name === 'tabindex') {
            if (value !== '0' && value !== '-1') el.removeAttribute(attr.name);
        } else if (name === 'type') {
            if (tag === 'input' && !INPUT_TYPES.has(value.toLowerCase())) { removed.push(`input type=${value}`); el.setAttribute('type', 'text'); }
            if (tag === 'button') el.setAttribute('type', 'button');
        } else if (isSvg && (name === 'fill' || name === 'stroke' || name === 'clip-path' || name === 'mask')) {
            if (!cssTextIsSafe(value)) { removed.push(`${describe(el)} ${name}`); el.removeAttribute(attr.name); }
        }
    }
    if (tag === 'button' && !el.hasAttribute('type')) el.setAttribute('type', 'button');
    if (tag === 'a') { el.setAttribute('rel', 'noopener noreferrer'); }
}

function cleanChildren(parent: Node, removed: string[]): void {
    for (const child of Array.from(parent.childNodes)) {
        if (child.nodeType === 1) {
            const el = child as Element;
            const tag = el.localName.toLowerCase();
            const isSvg = el.namespaceURI === 'http://www.w3.org/2000/svg';
            if (DROP_TAGS.has(tag)) { removed.push(`<${tag}>`); parent.removeChild(el); continue; }
            if (!(isSvg ? SVG_TAGS : HTML_TAGS).has(tag)) {
                // Unknown tag: keep its content, drop the tag.
                removed.push(`<${tag}>`);
                while (el.firstChild) parent.insertBefore(el.firstChild, el);
                parent.removeChild(el);
                // The moved children are before `el`'s old position; re-clean the parent's new children.
                cleanChildren(parent, removed);
                return;
            }
            cleanElement(el, removed);
            cleanChildren(el, removed);
        } else if (child.nodeType !== 3) {
            parent.removeChild(child); // comments, processing instructions
        }
    }
}

/** Parse, clean and serialise a layer's HTML. Always returns something safe to assign to innerHTML. */
export function sanitizeUiHtml(html: string): SanitizeResult {
    const removed: string[] = [];
    const doc = new DOMParser().parseFromString(`<!doctype html><body>${html ?? ''}`, 'text/html');
    cleanChildren(doc.body, removed);
    return { out: doc.body.innerHTML, removed: Array.from(new Set(removed)) };
}

/** Both fields of a layer. */
export function sanitizeUiLayer<T extends { html: string; css: string }>(layer: T): { layer: T; removed: string[] } {
    const h = sanitizeUiHtml(layer.html);
    const c = sanitizeUiCss(layer.css);
    return { layer: { ...layer, html: h.out, css: c.out }, removed: [...h.removed, ...c.removed] };
}
