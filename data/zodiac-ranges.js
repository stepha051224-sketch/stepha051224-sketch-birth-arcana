/*
 * 별자리 날짜 구간 (프로토타입용 고정 월·일 구간)
 *
 * 실제 태양 별자리 경계는 태어난 해와 시각에 따라 하루쯤 달라질 수 있다.
 * 이 프로토타입은 흔히 쓰는 고정 구간을 쓰고, 화면에서 "간이 기준"이라고 안내한다.
 * start / end 는 [월, 일] 이고 양 끝을 포함한다. 염소자리는 해를 넘긴다.
 */
window.BYEOL_ZODIAC_RANGES = [
  { id: "aries",       name: "양자리",     start: [3, 21],  end: [4, 19] },
  { id: "taurus",      name: "황소자리",   start: [4, 20],  end: [5, 20] },
  { id: "gemini",      name: "쌍둥이자리", start: [5, 21],  end: [6, 21] },
  { id: "cancer",      name: "게자리",     start: [6, 22],  end: [7, 22] },
  { id: "leo",         name: "사자자리",   start: [7, 23],  end: [8, 22] },
  { id: "virgo",       name: "처녀자리",   start: [8, 23],  end: [9, 22] },
  { id: "libra",       name: "천칭자리",   start: [9, 23],  end: [10, 22] },
  { id: "scorpio",     name: "전갈자리",   start: [10, 23], end: [11, 22] },
  { id: "sagittarius", name: "사수자리",   start: [11, 23], end: [12, 21] },
  { id: "capricorn",   name: "염소자리",   start: [12, 22], end: [1, 19] },
  { id: "aquarius",    name: "물병자리",   start: [1, 20],  end: [2, 18] },
  { id: "pisces",      name: "물고기자리", start: [2, 19],  end: [3, 20] }
];

/* 윤년 기준 월별 일수. 2월 29일은 허용한다. */
window.BYEOL_DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
