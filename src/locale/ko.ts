import type { LocaleData } from './LocaleKeys';

// Korean has no plural forms: numbers take a counter word instead (개).
export const ko: LocaleData = {
  preloader_start: '탭하여 시작',
  menu_title: 'Phaser 템플릿',
  btn_play: '플레이',
  btn_resume: '계속하기',
  btn_settings: '설정',
  btn_menu: '메뉴',
  settings_title: '설정',
  pause_title: '일시 정지',
  language_title: '언어',
  ad_soon: '광고 시작까지',

  demo_subtitle: '데모: {seconds}초 안에 최대한 많은 버블을 터뜨리세요',
  demo_best: '최고 기록: {count}개',
  demo_result_title: '시간 종료!',
  demo_result_score: '버블 {count}개',
  demo_result_record: '신기록!',
  demo_btn_again: '다시 하기',
  demo_btn_continue: '광고 보고 +{seconds}초',
};
