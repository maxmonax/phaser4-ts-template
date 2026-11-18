/** Reference locale: its keys are the list of all translation keys (see `LocaleKey`). */
export const en = {
  preloader_start: 'Tap to start',
  menu_title: 'Phaser Template',
  btn_play: 'Play',
  btn_resume: 'Resume',
  btn_settings: 'Settings',
  btn_menu: 'Menu',
  settings_title: 'Settings',
  pause_title: 'Pause',
  language_title: 'Language',
  ad_soon: 'Ad in',

  // Demo round (src/demo). `{count|orb|orbs}` picks a plural form, see LocaleMng.t().
  demo_subtitle: 'Demo: pop as many orbs as you can in {seconds} {seconds|second|seconds}',
  demo_best: 'Best: {count} {count|orb|orbs}',
  demo_result_title: "Time's up!",
  demo_result_score: '{count} {count|orb|orbs}',
  demo_result_record: 'New record!',
  demo_btn_again: 'Play again',
  demo_btn_continue: '+{seconds} s for an ad',
} satisfies Record<string, string>;
