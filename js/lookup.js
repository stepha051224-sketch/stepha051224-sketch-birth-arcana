/* 생일(월·일) → 별자리 → 카드. 데이터 파일만 읽고 화면은 건드리지 않는다. */
(function (root) {
  function key(m, d) { return m * 100 + d; }

  function isValidMonthDay(m, d) {
    if (!Number.isInteger(m) || !Number.isInteger(d)) return false;
    if (m < 1 || m > 12 || d < 1) return false;
    return d <= root.BYEOL_DAYS_IN_MONTH[m - 1];
  }

  function inRange(m, d, r) {
    var k = key(m, d), s = key(r.start[0], r.start[1]), e = key(r.end[0], r.end[1]);
    return s <= e ? (k >= s && k <= e) : (k >= s || k <= e); // 해를 넘기는 구간
  }

  function findZodiac(m, d) {
    if (!isValidMonthDay(m, d)) return null;
    var list = root.BYEOL_ZODIAC_RANGES;
    for (var i = 0; i < list.length; i++) if (inRange(m, d, list[i])) return list[i];
    return null;
  }

  /* 구간의 첫날·마지막날이면 경계일로 본다. */
  function isBoundaryDay(m, d, z) {
    return (z.start[0] === m && z.start[1] === d) || (z.end[0] === m && z.end[1] === d);
  }

  function lookup(m, d) {
    var z = findZodiac(m, d);
    if (!z) return null;
    var card = root.BYEOL_CARD_MAP[z.id];
    var content = root.BYEOL_CARD_CONTENT[card.num] || null;
    return { month: m, day: d, zodiac: z, card: card, content: content, boundary: isBoundaryDay(m, d, z) };
  }

  root.ByeolLookup = { isValidMonthDay: isValidMonthDay, findZodiac: findZodiac, lookup: lookup };
})(typeof window !== "undefined" ? window : globalThis);
