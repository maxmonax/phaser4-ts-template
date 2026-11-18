interface ImportMetaEnv {
  /** Platform of the build, set by vite.config.ts from `--mode`. */
  readonly VITE_PLATFORM: import('./platform/platforms').PlatformId;
}
