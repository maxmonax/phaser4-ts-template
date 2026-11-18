// A stand-in for the Yandex Games SDK: records the calls in window.__sdkCalls.
(function () {
  const calls = (window.__sdkCalls = []);
  const log = (name) => calls.push(name);
  const data = {};

  const sdk = {
    environment: { i18n: { lang: 'ru' } },
    features: {
      LoadingAPI: { ready: () => log('LoadingAPI.ready') },
      GameplayAPI: {
        start: () => log('GameplayAPI.start'),
        stop: () => log('GameplayAPI.stop'),
      },
    },
    adv: {
      showFullscreenAdv({ callbacks }) {
        log('showFullscreenAdv');
        setTimeout(() => callbacks.onClose(true), 300);
      },
      showRewardedVideo({ callbacks }) {
        log('showRewardedVideo');
        setTimeout(() => {
          callbacks.onRewarded();
          callbacks.onClose();
        }, 300);
      },
    },
    on(event) {
      log(`on:${event}`);
      return () => {};
    },
    getPlayer() {
      log('getPlayer');
      return Promise.resolve({
        getData(keys) {
          log('getData');
          return Promise.resolve(Object.fromEntries(keys.map((key) => [key, data[key]])));
        },
        setData(values) {
          log('setData');
          Object.assign(data, values);
          return Promise.resolve();
        },
      });
    },
    getStorage: () => Promise.resolve(localStorage),
  };

  window.YaGames = {
    init() {
      log('YaGames.init');
      return Promise.resolve(sdk);
    },
  };
})();
