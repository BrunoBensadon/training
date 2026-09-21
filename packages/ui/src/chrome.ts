/** Header, footer and skip link — the frame every tool shares. */
import { el, type Child } from './dom.ts';

export interface HeaderOptions {
  brand: string;
  brandHref: string;
  /** Controls pinned to the right of the header, e.g. the language toggle. */
  right?: Child[];
}

export function siteHeader(options: HeaderOptions): HTMLElement {
  const brand = el('a', {
    class: 'brand',
    attrs: { href: options.brandHref },
  });
  brand.append(document.createTextNode(options.brand), el('span', { class: 'dot', text: '.' }));

  return el(
    'header',
    { class: 'site-header' },
    el('div', { class: 'container' }, brand, el('div', { class: 'right' }, ...(options.right ?? []))),
  );
}

export function siteFooter(...lines: Child[]): HTMLElement {
  return el(
    'footer',
    { class: 'site-footer' },
    el('div', { class: 'container' }, ...lines.map((line) => el('p', {}, line))),
  );
}

export function skipLink(targetId: string, label: string): HTMLElement {
  return el('a', { class: 'skip-link', text: label, attrs: { href: `#${targetId}` } });
}
