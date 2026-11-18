// A stand-in for the CrazyGames SDK: records the calls in window.__sdkCalls.
(function () {
  const calls = (window.__sdkCalls = []);
  const log = (name) => calls.push(name);
  const store = {};

  window.CrazyGames = {
    SDK: {
      environment: 'crazygames',
      init() {
        log('init');
        return Promise.resolve();
      },
      game: {
        loadingStart: () => log('loadingStart'),
        loadingStop: () => log('loadingStop'),
        gameplayStart: () => log('gameplayStart'),
        gameplayStop: () => log('gameplayStop'),
        settings: { muteAudio: false, disableChat: false },
        addSettingsChangeListener: () => log('addSettingsChangeListener'),
      },
      ad: {
        requestAd(type, callbacks) {
          log(`requestAd:${type}`);
          setTimeout(() => {
            callbacks.adStarted?.();
            callbacks.adFinished?.();
          }, 300);
        },
      },
      data: {
        getItem: (key) => (key in store ? store[key] : null),
        setItem(key, value) {
          log('data.setItem');
          store[key] = value;
        },
        removeItem() {},
        clear() {},
      },
      user: { systemInfo: { locale: 'ru-RU', countryCode: 'RU' } },
    },
  };
})();
