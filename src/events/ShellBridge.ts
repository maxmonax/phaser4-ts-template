import { LogMng } from '../utils/LogMng';
import { EventBus } from './EventBus';
import { ShellEvent, ShellInEvent } from './ShellEvent';

const IN_EVENTS = new Set<string>(Object.values(ShellInEvent));

// Bridge between the game and the outer HTML shell.
// Game → Shell: call static methods (they dispatch a 'gameEvent' CustomEvent on window).
// Shell → Game: call ShellBridge.init() once at startup; the shell dispatches 'shellEvent',
//               the game listens on EventBus with ShellInEvent keys.
//
// HTML usage (outgoing):
//   window.addEventListener('gameEvent', (e) => { console.log(e.detail.type); });
//
// HTML usage (incoming):
//   window.dispatchEvent(new CustomEvent('shellEvent', { detail: { type: 'MUTE', muted: true } }));
export class ShellBridge {
  /**
   * Call once at startup. Listens for 'shellEvent' from HTML and re-emits it on EventBus.
   * Only events listed in ShellInEvent pass through: the shell must not be able
   * to trigger the game's internal events.
   */
  static init(): void {
    window.addEventListener('shellEvent', (e: Event) => {
      const detail: unknown = (e as CustomEvent).detail;
      if (typeof detail !== 'object' || detail === null) return;

      const { type, ...payload } = detail as Record<string, unknown>;
      if (typeof type !== 'string' || !IN_EVENTS.has(type)) {
        LogMng.warn(`ShellBridge: unknown shell event "${String(type)}" ignored`);
        return;
      }

      EventBus.emit(type, payload);
    });
  }

  private static dispatch(type: ShellEvent, payload?: Record<string, unknown>): void {
    window.dispatchEvent(new CustomEvent('gameEvent', { detail: { type, ...payload } }));
  }

  /** Tell the shell that the game is loaded. */
  static loaded(): void {
    ShellBridge.dispatch(ShellEvent.LOADED);
  }

  /** Notify the shell to persist game data. */
  static saveData(payload?: Record<string, unknown>): void {
    ShellBridge.dispatch(ShellEvent.SAVE_DATA, payload);
  }
}
