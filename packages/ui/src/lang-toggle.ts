/**
 * The EN/PT toggle.
 *
 * Deliberately identical in appearance to the toggle on
 * brunobensadon.github.io, because trainees arrive from there and the
 * control should be the one they already recognise. The mechanism is not
 * the same: the site shows and hides parallel `.en`/`.pt` spans, which
 * does not survive a third locale and puts every translation in the
 * markup. Here the toggle swaps a locale bundle (see packages/i18n).
 */
import { el } from './dom.ts';

export interface LangOption {
  /** BCP 47 code used in locale filenames and the URL, e.g. "pt-BR". */
  code: string;
  /** Two-letter label shown in the control, e.g. "PT". */
  label: string;
  /** Full name, in its own language, for assistive technology. */
  name: string;
}

export interface LangToggleOptions {
  options: readonly LangOption[];
  current: string;
  /** Group label. Give it in both languages, as the site does. */
  groupLabel: string;
  onChange: (code: string) => void;
}

export function langToggle(options: LangToggleOptions): HTMLElement {
  const group = el('div', {
    class: 'lang-toggle',
    attrs: { role: 'group', 'aria-label': options.groupLabel },
  });

  for (const option of options.options) {
    const pressed = option.code === options.current;
    group.append(
      el('button', {
        text: option.label,
        attrs: {
          type: 'button',
          lang: option.code,
          'aria-pressed': String(pressed),
          'aria-label': option.name,
          'data-lang': option.code,
        },
        on: {
          click: () => {
            if (option.code !== options.current) options.onChange(option.code);
          },
        },
      }),
    );
  }

  return group;
}
