export enum FrontEvent {
  /** The visible area has changed: the window was resized or rotated. `Viewport` is up to date. */
  WINDOW_RESIZE = 'WINDOW_RESIZE',
  /** The assets are loaded and the first screen is shown (`PreloaderScene`). Emitted once. */
  GAME_LOADED = 'GAME_LOADED',
}
