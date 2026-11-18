import type { LocaleData } from './LocaleKeys';

export const fr: LocaleData = {
  preloader_start: 'Touchez pour commencer',
  menu_title: 'Modèle Phaser',
  btn_play: 'Jouer',
  btn_resume: 'Reprendre',
  btn_settings: 'Paramètres',
  btn_menu: 'Menu',
  settings_title: 'Paramètres',
  pause_title: 'Pause',
  language_title: 'Langue',
  ad_soon: 'Publicité dans',

  // Plural forms: one|many|other. Two forms are enough here: "many" (a million and more)
  // falls back to the last one. 0 takes the singular in French: "0 bulle".
  demo_subtitle: 'Démo : éclatez un maximum de bulles en {seconds} {seconds|seconde|secondes}',
  demo_best: 'Record : {count} {count|bulle|bulles}',
  demo_result_title: 'Temps écoulé !',
  demo_result_score: '{count} {count|bulle|bulles}',
  demo_result_record: 'Nouveau record !',
  demo_btn_again: 'Rejouer',
  demo_btn_continue: '+{seconds} s avec une pub',
};
