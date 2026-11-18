import { LogMng } from '../utils/LogMng';

const MAX_LINES = 12;

function describe(value: unknown): string {
  if (value instanceof Error) return value.stack || value.message;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
}

/**
 * Errors on screen, for the places where there is no console: a phone,
 * a draft on a game portal. Turned on with `#debug` in the URL, in any build.
 *
 * Shows uncaught errors, rejected promises and everything that goes through
 * `LogMng.warn()` and `LogMng.error()`. A tap on the panel clears it.
 */
export class ErrorOverlay {
  private static el: HTMLElement | null = null;
  private static lines: string[] = [];

  /** Call once, as early as possible: errors before the call are not shown. */
  static attach(): void {
    if (ErrorOverlay.el) return;
    const el = document.createElement('div');
    el.className = 'error-overlay';
    el.hidden = true;
    el.addEventListener('click', () => ErrorOverlay.clear());
    document.body.appendChild(el);
    ErrorOverlay.el = el;

    window.addEventListener('error', (e) => {
      const where = e.filename ? ` (${e.filename.split('/').pop()}:${e.lineno})` : '';
      ErrorOverlay.add('ERROR', `${e.message}${where}`);
    });
    window.addEventListener('unhandledrejection', (e) => {
      ErrorOverlay.add('ERROR', `Unhandled rejection: ${describe(e.reason)}`);
    });
    LogMng.onProblem((level, message, data) => {
      const details = data === undefined ? '' : ` ${describe(data)}`;
      ErrorOverlay.add(level, `${describe(message)}${details}`);
    });
  }

  private static add(level: string, text: string): void {
    if (!ErrorOverlay.el) return;
    ErrorOverlay.lines.push(`${level} ${text}`);
    ErrorOverlay.lines = ErrorOverlay.lines.slice(-MAX_LINES);
    ErrorOverlay.el.textContent = ErrorOverlay.lines.join('\n');
    ErrorOverlay.el.hidden = false;
  }

  private static clear(): void {
    if (!ErrorOverlay.el) return;
    ErrorOverlay.lines = [];
    ErrorOverlay.el.hidden = true;
  }
}
