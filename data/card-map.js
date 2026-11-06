/*
 * 별자리 → 타로 카드 대응
 *
 * 대응: 알레이스터 크롤리, 《A Treatise on Astrology》의 별자리–타로 대응표.
 * 표시: 카드 번호와 이름은 라이더–웨이트–스미스 덱 기준 (8 힘, 11 정의).
 * en  : 카드에 표시하는 영문 이름 (라이더–웨이트–스미스)
 * slug: 저장 파일 이름과 이미지 파일 이름에 쓰는 영문 이름
 */
window.BYEOL_CARD_SOURCE = {
  mapping: "알레이스터 크롤리, 《A Treatise on Astrology》의 별자리–타로 대응표",
  naming: "라이더–웨이트–스미스 덱의 번호와 이름"
};

window.BYEOL_CARD_MAP = {
  aries:       { num: 4,  roman: "IV",    name: "황제", en: "The Emperor",    slug: "emperor" },
  taurus:      { num: 5,  roman: "V",     name: "교황", en: "The Hierophant", slug: "hierophant" },
  gemini:      { num: 6,  roman: "VI",    name: "연인", en: "The Lovers",     slug: "lovers" },
  cancer:      { num: 7,  roman: "VII",   name: "전차", en: "The Chariot",    slug: "chariot" },
  leo:         { num: 8,  roman: "VIII",  name: "힘",   en: "Strength",       slug: "strength" },
  virgo:       { num: 9,  roman: "IX",    name: "은자", en: "The Hermit",     slug: "hermit" },
  libra:       { num: 11, roman: "XI",    name: "정의", en: "Justice",        slug: "justice" },
  scorpio:     { num: 13, roman: "XIII",  name: "죽음", en: "Death",          slug: "death" },
  sagittarius: { num: 14, roman: "XIV",   name: "절제", en: "Temperance",     slug: "temperance" },
  capricorn:   { num: 15, roman: "XV",    name: "악마", en: "The Devil",      slug: "devil" },
  aquarius:    { num: 17, roman: "XVII",  name: "별",   en: "The Star",       slug: "star" },
  pisces:      { num: 18, roman: "XVIII", name: "달",   en: "The Moon",       slug: "moon" }
};
