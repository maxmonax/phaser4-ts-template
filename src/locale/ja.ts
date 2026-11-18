import type { LocaleData } from './LocaleKeys';

// Japanese has no plural forms: numbers take a counter word instead (個).
export const ja: LocaleData = {
  preloader_start: 'タップしてスタート',
  menu_title: 'Phaserテンプレート',
  btn_play: 'プレイ',
  btn_resume: '再開',
  btn_settings: '設定',
  btn_menu: 'メニュー',
  settings_title: '設定',
  pause_title: 'ポーズ',
  language_title: '言語',
  ad_soon: 'まもなく広告',

  demo_subtitle: 'デモ：{seconds}秒以内にできるだけ多くのバブルを割ろう',
  demo_best: 'ベスト：{count}個',
  demo_result_title: 'タイムアップ！',
  demo_result_score: 'バブル{count}個',
  demo_result_record: '新記録！',
  demo_btn_again: 'もう一度',
  demo_btn_continue: '広告を見て+{seconds}秒',
};
