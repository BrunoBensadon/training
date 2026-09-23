/**
 * The site index at /training/.
 *
 * The list comes from tools.config.json, which is also where each tool's
 * deploy path comes from — adding a tool means adding an entry there, not
 * editing this page. See docs/ADDING-A-TOOL.md.
 */
import '@training/ui/styles/index.css';
import '@training/ui/fonts';
import './home.css';

import { el, langToggle, siteFooter, siteHeader, skipLink, clear } from '@training/ui';
import {
  buildBundles,
  createTranslator,
  readLegacyLang,
  resolveLocale,
  writeLegacyLang,
  type Messages,
} from '@training/i18n';

import toolsConfig from '../../../tools.config.json';

interface ToolEntry {
  id: string;
  status: string;
  name: Record<string, string>;
  summary: Record<string, string>;
  meta: Record<string, string>;
}

const files = import.meta.glob('../locales/*/*.json', {
  eager: true,
  import: 'default',
}) as Record<string, Messages>;

// Interface copy lives in ui.json; lift it so lookups read `meta.title`
// rather than `ui.meta.title`. See apps/elc-placement/src/locales.ts.
const bundles = Object.fromEntries(
  Object.entries(buildBundles(files)).map(([locale, bundle]) => [
    locale,
    { ...((bundle.ui ?? {}) as Messages) },
  ]),
);
const DEFAULT_LOCALE = 'en';
const SUPPORTED = Object.keys(bundles).sort((a, b) =>
  a === DEFAULT_LOCALE ? -1 : b === DEFAULT_LOCALE ? 1 : a.localeCompare(b),
);

const tools = (toolsConfig.tools ?? []) as ToolEntry[];

function textFor(values: Record<string, string>, locale: string): string {
  return values[locale] ?? values[DEFAULT_LOCALE] ?? '';
}

function render(root: HTMLElement, locale: string): void {
  const t = createTranslator(locale, bundles[locale] ?? bundles[DEFAULT_LOCALE]!, {
    fallback: bundles[DEFAULT_LOCALE],
  });
  document.title = t.t('meta.title');
  document.documentElement.lang = locale;
  clear(root);

  const list = el('div', { class: 'index-list' });
  if (tools.length === 0) {
    list.append(el('p', { class: 'prose-note', text: t.t('index.empty') }));
  }
  tools.forEach((tool, position) => {
    list.append(
      el(
        'a',
        { class: 'index-row', attrs: { href: `./${tool.id}/#/?lang=${locale}` } },
        el('span', { class: 'ix-no', text: String(position + 1).padStart(2, '0') }),
        el(
          'span',
          {},
          el('span', { class: 'ix-title', text: textFor(tool.name, locale) }),
          el('span', { class: 'ix-desc', text: textFor(tool.summary, locale) }),
        ),
        el(
          'span',
          { class: 'ix-meta' },
          el('span', { class: 'tag live', text: tool.status }),
          el('span', { text: textFor(tool.meta, locale) }),
          el('span', { class: 'arrow', attrs: { 'aria-hidden': 'true' }, text: '→' }),
        ),
      ),
    );
  });

  root.append(
    skipLink('main', t.t('nav.skip')),
    siteHeader({
      brand: t.t('meta.brand'),
      brandHref: './',
      right: [
        langToggle({
          options: SUPPORTED.map((code) => {
            const meta = bundles[code]?.meta as Messages | undefined;
            return {
              code,
              label: String(meta?.langLabel ?? code.toUpperCase()),
              name: String(meta?.langName ?? code),
            };
          }),
          current: locale,
          groupLabel: t.t('nav.langGroup'),
          onChange: (next) => {
            writeLegacyLang(next);
            const url = new URL(window.location.href);
            url.searchParams.set('lang', next);
            window.history.replaceState(null, '', url.toString());
            render(root, next);
          },
        }),
      ],
    }),
    el(
      'main',
      { class: 'container', id: 'main', attrs: { tabindex: '-1' } },
      el(
        'section',
        { class: 'section' },
        el('p', { class: 'kicker', text: t.t('index.kicker') }),
        el('h1', { text: t.t('index.title') }),
        el('p', { class: 'lead', text: t.t('index.lead') }),
        el('p', { class: 'note', text: t.t('index.note') }),
      ),
      el(
        'section',
        { class: 'section' },
        el('h2', { class: 'visually-hidden', text: t.t('index.toolsTitle') }),
        list,
      ),
    ),
    siteFooter(
      t.t('footer.notOfficial'),
      t.t('footer.licence'),
      el('a', {
        text: t.t('footer.source'),
        attrs: { href: toolsConfig.repositoryUrl, rel: 'noopener noreferrer' },
      }),
    ),
  );
}

const root = document.getElementById('app');
if (root) {
  const locale = resolveLocale({
    supported: SUPPORTED,
    defaultLocale: DEFAULT_LOCALE,
    url: window.location.href,
    storageValue: readLegacyLang(),
    navigatorLanguages: navigator.languages,
  }).locale;
  render(root, locale);
}
