// Events sent from game to HTML shell (via ShellBridge.dispatch)
export enum ShellEvent {
  /** The game is loaded and ready for the player, e.g. to hide a splash screen of the page. */
  LOADED = 'LOADED',
  SAVE_DATA = 'SAVE_DATA',
}

// Events sent from HTML shell to game (via ShellBridge.init listener)
export enum ShellInEvent {
  /** Payload: `{ muted?: boolean }`, `muted` defaults to `true`. */
  MUTE = 'MUTE',
}
