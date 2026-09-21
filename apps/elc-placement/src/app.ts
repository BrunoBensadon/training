/**
 * The shell: chrome, routing and the one piece of mutable state.
 *
 * Answers live here, in memory, and nowhere else. They are not written to
 * localStorage, sessionStorage or the URL while you are answering. That
 * costs you your answers if you reload mid-way, which is a real cost for
 * something taking eight minutes on a phone — and it is the right trade,
 * because this is often run on a shared training-room device and partial
 * answers in browser history are somebody else's answers in browser
 * history. Only the finished result goes into the fragment, and only when
 * you have finished. See docs/DECISIONS.md.
 */
import {
  clear,
  createAnnouncer,
  el,
  langToggle,
  siteFooter,
  siteHeader,
  skipLink,
} from '@training/ui';
import { writeLegacyLang } from '@training/i18n';

import toolsConfig from '../../../tools.config.json';

import { detectLocale, languageOptions, translatorFor } from './locales.ts';
import { instrumentFrom, shuffledQuadrants, type Instrument } from './instrument.ts';
import { buildHash, parseHash, ROUTES, setNumberFrom } from './router.ts';
import { isComplete, type PartialRanking } from './model.ts';
import { scoreResponses } from './scoring.ts';
import { decodeResponses, encodeResponses } from './share.ts';
import type { ScreenContext, SessionState } from './screens/context.ts';
import { introScreen } from './screens/intro.ts';
import { rankingScreen } from './screens/ranking.ts';
import { badLinkScreen, resultScreen } from './screens/result.ts';
import { aboutScreen } from './screens/about.ts';
import { facilitatorScreen } from './screens/facilitator.ts';

function freshState(setCount: number): SessionState {
  return {
    responses: Array.from({ length: setCount }, () => ({}) as PartialRanking),
    displayOrder: Array.from({ length: setCount }, () => shuffledQuadrants()),
  };
}

export function createApp(root: HTMLElement): void {
  let locale = detectLocale(window.location.href);
  let t = translatorFor(locale);
  let instrument: Instrument = instrumentFrom(t);
  let state = freshState(instrument.sets.length);
  let hasNavigated = false;
  let renderedHash = '';

  const announcer = createAnnouncer();
  const main = el('main', { class: 'container reading', id: 'main', attrs: { tabindex: '-1' } });

  const href = (path: string, params: Record<string, string | number | undefined> = {}): string =>
    buildHash(path, { ...params, lang: locale });

  /**
   * Navigation renders synchronously.
   *
   * Assigning to `window.location.hash` fires `hashchange` on a later
   * tick, which leaves the screen you just left on the page — and still
   * interactive — for that tick. A quick tap after "Next set" then landed
   * on the previous set and silently changed an answer already given.
   * pushState plus an immediate render closes that window; the
   * hashchange listener is left for the browser's own back and forward.
   */
  const navigate = (hash: string, options: { replace?: boolean } = {}): void => {
    hasNavigated = true;
    const url = `${window.location.pathname}${window.location.search}${hash}`;
    if (options.replace) {
      window.history.replaceState(null, '', url);
    } else if (window.location.hash !== hash) {
      window.history.pushState(null, '', url);
    }
    render();
  };

  const restart = (): void => {
    state = freshState(instrument.sets.length);
    navigate(href(ROUTES.intro));
  };

  const context = (): ScreenContext => ({
    t,
    instrument,
    locale,
    state,
    announce: (message) => announcer.announce(message),
    navigate,
    href,
  });

  const setLocale = (next: string): void => {
    if (next === locale) return;
    locale = next;
    t = translatorFor(locale);
    instrument = instrumentFrom(t);
    writeLegacyLang(locale);
    document.documentElement.lang = locale;
    // Keep the language in the address, so the link someone shares carries it.
    const route = parseHash(window.location.hash);
    const params = Object.fromEntries(route.params.entries());
    window.history.replaceState(null, '', buildHash(route.path, { ...params, lang: locale }));
    renderChrome();
    render();
  };

  const header = el('div');
  const footer = el('div');

  function renderChrome(): void {
    clear(header);
    clear(footer);

    header.append(
      siteHeader({
        brand: t.t('meta.brand'),
        brandHref: '../',
        right: [
          el(
            'nav',
            { class: 'tool-nav', attrs: { 'aria-label': t.t('meta.toolName') } },
            el('a', { text: t.t('nav.about'), attrs: { href: href(ROUTES.about) } }),
            el('a', { text: t.t('nav.facilitator'), attrs: { href: href(ROUTES.facilitator) } }),
          ),
          langToggle({
            options: languageOptions(),
            current: locale,
            groupLabel: t.t('nav.langGroup'),
            onChange: setLocale,
          }),
        ],
      }),
    );

    footer.append(
      siteFooter(
        t.t('footer.notOfficial'),
        t.t('footer.licence'),
        // A tool that claims it transmits nothing should be checkable.
        el('a', {
          text: t.t('footer.source'),
          attrs: { href: toolsConfig.repositoryUrl, rel: 'noopener noreferrer' },
        }),
      ),
    );

    const skip = root.querySelector('.skip-link');
    if (skip) skip.textContent = t.t('nav.skip');
  }

  function screenFor(): HTMLElement {
    const route = parseHash(window.location.hash);

    if (route.path === ROUTES.about) return aboutScreen(context());
    if (route.path === ROUTES.facilitator) return facilitatorScreen(context());

    const setNumber = setNumberFrom(route.path);
    if (setNumber !== null) {
      if (setNumber > instrument.sets.length) {
        navigate(href(ROUTES.set(1)), { replace: true });
        return el('div');
      }
      return rankingScreen(context(), {
        setNumber,
        onComplete: () => {
          const answers = state.responses;
          if (!answers.every(isComplete)) {
            navigate(href(ROUTES.set(answers.findIndex((entry) => !isComplete(entry)) + 1)));
            return;
          }
          navigate(
            href(ROUTES.result, { r: encodeResponses(answers, instrument.version) }),
          );
        },
      });
    }

    if (route.path === ROUTES.result) {
      const encoded = route.params.get('r');
      if (encoded) {
        const decoded = decodeResponses(encoded);
        if (!decoded.ok) return badLinkScreen(context(), restart);
        try {
          return resultScreen(context(), {
            result: scoreResponses(decoded.responses, instrument.sets.length),
            savedItemsVersion: decoded.itemsVersion,
            onRestart: restart,
          });
        } catch {
          return badLinkScreen(context(), restart);
        }
      }
      navigate(href(ROUTES.intro), { replace: true });
      return el('div');
    }

    if (route.path !== ROUTES.intro) {
      return el(
        'section',
        { class: 'section' },
        el('h1', { text: t.t('errors.unknownRoute') }),
        el(
          'div',
          { class: 'btn-row' },
          el('a', {
            class: 'btn accent',
            text: t.t('errors.goHome'),
            attrs: { href: href(ROUTES.intro) },
          }),
        ),
      );
    }

    return introScreen(context());
  }

  function render(): void {
    renderedHash = window.location.hash;
    const screen = screenFor();
    clear(main);
    main.append(screen);

    document.title = t.t('meta.title');
    document.documentElement.lang = locale;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', t.t('meta.description'));

    // Route changes in a single page do not move focus on their own, so a
    // screen-reader user would stay where they were and hear nothing.
    if (hasNavigated) {
      const heading = main.querySelector('h1');
      if (heading instanceof HTMLElement) {
        heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      } else {
        main.focus({ preventScroll: true });
      }
      window.scrollTo({ top: 0 });
    }
  }

  root.append(
    skipLink('main', t.t('nav.skip')),
    header,
    main,
    footer,
    announcer.node,
  );

  // Back and forward. pushState does not fire hashchange, so this only
  // runs for the browser's own history navigation; the guard covers the
  // browsers that fire both hashchange and popstate for one step back.
  const onHistoryNavigation = (): void => {
    if (window.location.hash === renderedHash) return;
    hasNavigated = true;
    render();
  };
  window.addEventListener('hashchange', onHistoryNavigation);
  window.addEventListener('popstate', onHistoryNavigation);

  renderChrome();
  render();
}
