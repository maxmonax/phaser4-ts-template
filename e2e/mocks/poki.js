// A stand-in for the Poki SDK: records the calls in window.__sdkCalls.
(function () {
  const calls = (window.__sdkCalls = []);
  const log = (name) => calls.push(name);
  const later = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 300));

  window.PokiSDK = {
    init() {
      log('init');
      return Promise.resolve();
    },
    gameLoadingFinished: () => log('gameLoadingFinished'),
    gameplayStart: () => log('gameplayStart'),
    gameplayStop: () => log('gameplayStop'),
    commercialBreak(onStart) {
      log('commercialBreak');
      onStart?.();
      return later();
    },
    rewardedBreak(onStart) {
      log('rewardedBreak');
      onStart?.();
      return later(true);
    },
    getLanguage: () => 'ru',
    measure: (category, what, action) => log(`measure:${category}:${what}:${action}`),
  };
})();
