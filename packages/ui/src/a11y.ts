/**
 * A single polite live region per page.
 *
 * The ranking control changes two things at once (the statement you just
 * ranked, and the statement that was displaced), and neither change is
 * announced by the browser on its own, so the app says it out loud.
 */
import { el } from './dom.ts';

export interface Announcer {
  readonly node: HTMLElement;
  announce(message: string): void;
}

export function createAnnouncer(): Announcer {
  const node = el('div', {
    class: 'visually-hidden',
    attrs: { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' },
  });

  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    node,
    announce(message: string): void {
      // Re-setting identical text is not treated as a change by every
      // screen reader, so clear first and set on the next tick.
      if (timer !== undefined) clearTimeout(timer);
      node.textContent = '';
      timer = setTimeout(() => {
        node.textContent = message;
      }, 60);
    },
  };
}
