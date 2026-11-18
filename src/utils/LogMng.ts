type LogLevel = 'DEBUG' | 'INFO' | 'NETWORK' | 'WARNING' | 'ERROR';
type LogMode = typeof LogMng.MODE_DEBUG | typeof LogMng.MODE_RELEASE;
type ProblemListener = (level: 'WARNING' | 'ERROR', message: unknown, data?: unknown) => void;

const BADGE_CSS: Record<LogLevel, string> = {
  DEBUG: 'background: #ADADAD; color: #fff; padding: 1px 4px',
  INFO: 'background: #308AE4; color: #fff; padding: 1px 4px',
  NETWORK: 'background: #7D2998; color: #fff; padding: 1px 4px',
  WARNING: 'background: #f7a148; color: #fff; padding: 1px 4px',
  ERROR: 'background: #DB5252; color: #fff; padding: 1px 4px',
};

/**
 * Console logger.
 *
 * - `warn()` and `error()` are always printed, in every build and mode.
 * - `debug()`, `info()`, `net()` and `system()` are printed only in dev builds
 *   and only in `MODE_DEBUG`. In production builds these calls are compiled out.
 */
export class LogMng {
  static readonly MODE_DEBUG = 'MODE_DEBUG';
  static readonly MODE_RELEASE = 'MODE_RELEASE';

  private static mode: LogMode = LogMng.MODE_DEBUG;
  private static problemListeners: ProblemListener[] = [];

  public static setMode(aMode: LogMode): void {
    LogMng.mode = aMode;
  }

  public static getMode(): LogMode {
    return LogMng.mode;
  }

  private static isVerbose(): boolean {
    return import.meta.env.DEV && LogMng.mode === LogMng.MODE_DEBUG;
  }

  private static print(
    aPrinter: (...args: unknown[]) => void,
    aLevel: LogLevel,
    aMsg: unknown,
    aData?: unknown
  ): void {
    if (aData === undefined) aPrinter('%c%s', BADGE_CSS[aLevel], aLevel, aMsg);
    else aPrinter('%c%s', BADGE_CSS[aLevel], aLevel, aMsg, aData);
  }

  private static getCSS(bgColor: string): string {
    return `background: ${bgColor}; color: #1df9a8; line-height: 16px; padding: 1px 0; margin: 0;`;
  }

  /** Banner-style message, e.g. for the app version at startup. */
  public static system(aMsg: unknown, aLink: string = ''): void {
    if (!LogMng.isVerbose()) return;
    console.log(
      '%c %c %c %s %c %c %c%s',
      LogMng.getCSS('#5C6166'),
      LogMng.getCSS('#4F5357'),
      LogMng.getCSS('#313335'),
      aMsg,
      LogMng.getCSS('#4F5357'),
      LogMng.getCSS('#5C6166'),
      'font-size: 12px; color: #446d96; line-height: 14px',
      aLink
    );
  }

  /** @returns `true` if the message was printed. */
  public static debug(aMsg: unknown, aData?: unknown): boolean {
    if (!LogMng.isVerbose()) return false;
    LogMng.print(console.log, 'DEBUG', aMsg, aData);
    return true;
  }

  /** @returns `true` if the message was printed. */
  public static info(aMsg: unknown, aData?: unknown): boolean {
    if (!LogMng.isVerbose()) return false;
    LogMng.print(console.log, 'INFO', aMsg, aData);
    return true;
  }

  /** @returns `true` if the message was printed. */
  public static net(aMsg: unknown, aData?: unknown): boolean {
    if (!LogMng.isVerbose()) return false;
    LogMng.print(console.log, 'NETWORK', aMsg, aData);
    return true;
  }

  public static warn(aMsg: unknown, aData?: unknown): boolean {
    LogMng.print(console.warn, 'WARNING', aMsg, aData);
    LogMng.problemListeners.forEach((listener) => listener('WARNING', aMsg, aData));
    return true;
  }

  public static error(aMsg: unknown, aData?: unknown): boolean {
    LogMng.print(console.error, 'ERROR', aMsg, aData);
    LogMng.problemListeners.forEach((listener) => listener('ERROR', aMsg, aData));
    return true;
  }

  /**
   * Calls `listener` for every warning and error, e.g. to show them on screen
   * (`ErrorOverlay`) or to send them to an error tracker.
   * @returns a function that removes the listener
   */
  public static onProblem(listener: ProblemListener): () => void {
    LogMng.problemListeners.push(listener);
    return () => {
      LogMng.problemListeners = LogMng.problemListeners.filter((item) => item !== listener);
    };
  }
}
