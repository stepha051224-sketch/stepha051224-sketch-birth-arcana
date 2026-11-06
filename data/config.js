/*
 * 배포 설정
 * supabaseUrl / supabaseKey: 카드 열기·이미지 저장을 익명으로 세는 Supabase 프로젝트.
 *   - 공개(publishable) 키라서 화면 코드에 있어도 된다. 테이블은 쓰기만 허용되고 읽기는 막혀 있다.
 *   - 비워 두면 아무것도 보내지 않는다.
 * 보내는 값: event('open' | 'save'), card_num, zodiac. 생일은 보내지 않는다.
 */
window.BYEOL_CONFIG = {
  supabaseUrl: "https://iugrtgexqjkfykfofdow.supabase.co",
  supabaseKey: "sb_publishable_mYVkUPLl7Q88nYgOP-ipVw_1utpF49G"
};
