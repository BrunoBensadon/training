/**
 * A very small DOM helper. The tools are static pages with a handful of
 * screens each, so they do not carry a runtime framework; this is the
 * amount of abstraction that turned out to be worth having.
 *
 * Nothing here uses innerHTML: everything the user sees is built from text
 * nodes, so a locale file can never inject markup.
 */

export type Child = Node | string | number | null | undefined | false;

export interface ElProps {
  class?: string;
  id?: string;
  text?: string;
  /** Attributes, including aria-* and data-*. `false`/`null` removes. */
  attrs?: Record<string, string | number | boolean | null | undefined>;
  on?: Partial<Record<keyof HTMLElementEventMap, EventListener>> &
    Record<string, EventListener | undefined>;
}

function applyProps(node: Element, props: ElProps): void {
  if (props.class) node.setAttribute('class', props.class);
  if (props.id) node.setAttribute('id', props.id);
  if (props.text !== undefined) node.textContent = props.text;
  if (props.attrs) {
    for (const [key, value] of Object.entries(props.attrs)) {
      if (value === null || value === undefined || value === false) continue;
      node.setAttribute(key, String(value));
    }
  }
  if (props.on) {
    for (const [type, handler] of Object.entries(props.on)) {
      if (handler) node.addEventListener(type, handler);
    }
  }
}

function appendChildren(node: Element, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  applyProps(node, props);
  appendChildren(node, children);
  return node;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

export function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  props: ElProps = {},
  ...children: Child[]
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  applyProps(node, props);
  appendChildren(node, children);
  return node;
}

export function clear(node: Element): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/**
 * Renders the tiny inline syntax allowed in locale strings: `**strong**`,
 * `*emphasis*` and `[label](https://example.org)`.
 *
 * Translators need to be able to emphasise a clause or carry a citation
 * link without writing HTML, and we need to render that without innerHTML.
 * Anything that is not one of those three forms is literal text. Only
 * http(s) and mailto links are produced; anything else renders as its
 * label, so a locale file cannot introduce a javascript: URL.
 */
export function richText(source: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      fragment.append(document.createTextNode(source.slice(lastIndex, match.index)));
    }
    const [, strong, emphasis, label, href] = match;
    if (strong !== undefined) {
      fragment.append(el('strong', { text: strong }));
    } else if (emphasis !== undefined) {
      fragment.append(el('em', { text: emphasis }));
    } else if (label !== undefined && href !== undefined) {
      fragment.append(safeLink(label, href));
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < source.length) {
    fragment.append(document.createTextNode(source.slice(lastIndex)));
  }
  return fragment;
}

function safeLink(label: string, href: string): Node {
  const allowed = /^(https?:|mailto:)/i.test(href);
  if (!allowed) return document.createTextNode(label);
  return el('a', {
    text: label,
    attrs: { href, rel: 'noopener noreferrer' },
  });
}

/** Replaces a node's contents with rich text. */
export function setRichText(node: Element, source: string): void {
  clear(node);
  node.append(richText(source));
}
