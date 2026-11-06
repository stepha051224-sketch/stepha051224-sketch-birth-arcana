/*
 * 그림 도구 (SVG 문자열 생성)
 * - 별자리 문양
 * - 앞면 이미지가 없는 카드의 "일러스트 준비 중" 앞면 (220 × 500)
 * - 뒷면 이미지가 없는 카드의 라벤더 빛 무늬 (254 × 394)
 * 글자는 SVG 안에 넣지 않는다. PNG로 옮길 때 웹 폰트가 빠지지 않도록
 * 이름은 HTML(화면)과 canvas(PNG)에서 따로 쓴다.
 */
(function (root) {
  var CREAM = "#f4ede2", CREAM_LINE = "#e9dfcf", INK = "#3d3357";

  function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function f(n) { return Math.round(n * 100) / 100; }
  function sparklePath(cx, cy, r, k) {
    k = r * (k || 0.22);
    return "M" + f(cx) + " " + f(cy - r) +
      " Q" + f(cx + k) + " " + f(cy - k) + " " + f(cx + r) + " " + f(cy) +
      " Q" + f(cx + k) + " " + f(cy + k) + " " + f(cx) + " " + f(cy + r) +
      " Q" + f(cx - k) + " " + f(cy + k) + " " + f(cx - r) + " " + f(cy) +
      " Q" + f(cx - k) + " " + f(cy - k) + " " + f(cx) + " " + f(cy - r) + "Z";
  }
  function sparkle(cx, cy, r, fill, stroke, sw) {
    return '<path d="' + sparklePath(cx, cy, r) + '" fill="' + fill + '" stroke="' + (stroke || "none") + '" stroke-width="' + (sw || 0) + '" stroke-linejoin="round"/>';
  }

  /* ---------- 별자리 문양 (24 × 24, 선) ---------- */
  var GLYPHS = {
    aries: "M12 20V10C12 5.5 9 3.5 6.5 4.3C4.2 5 4 8.2 5.6 9.6M12 10C12 5.5 15 3.5 17.5 4.3C19.8 5 20 8.2 18.4 9.6",
    taurus: "M4 4.5C6 9.5 18 9.5 20 4.5M17 14.5A5 5 0 1 1 7 14.5A5 5 0 1 1 17 14.5Z",
    gemini: "M5 4.5Q12 7.5 19 4.5M5 19.5Q12 16.5 19 19.5M9 6.2V17.8M15 6.2V17.8",
    cancer: "M9.6 9A2.6 2.6 0 1 1 4.4 9A2.6 2.6 0 1 1 9.6 9ZM7 6.4C11 4.2 16.6 4.6 20 8M19.6 15A2.6 2.6 0 1 1 14.4 15A2.6 2.6 0 1 1 19.6 15ZM17 17.6C13 19.8 7.4 19.4 4 16",
    leo: "M10 15.5A3 3 0 1 1 4 15.5A3 3 0 1 1 10 15.5ZM10 15.5C10.5 11 8 9 8.6 6.5C9.4 3.4 14.8 3 16.1 6.2C17.4 9.4 13 13 13.6 16.8C14 19.4 17 20.6 19.5 19",
    virgo: "M4 7V18M4 9.5C4 6 8 6 8 9.5V18M8 9.5C8 6 12 6 12 9.5V17C12 20 15 20.6 17.5 18.6M12 13C14 10.4 18.4 10.4 18.4 13.6C18.4 16.4 15 18.6 12.6 21",
    libra: "M4 19.5H20M4 15.5H8.6C7 14 6.8 10.2 8.8 8.2C10.6 6.4 13.4 6.4 15.2 8.2C17.2 10.2 17 14 15.4 15.5H20",
    scorpio: "M3.5 7V17M3.5 9.5C3.5 6 7.5 6 7.5 9.5V17M7.5 9.5C7.5 6 11.5 6 11.5 9.5V16C11.5 19.4 14.6 20 19.5 17M16.6 16.4L19.5 17L18.8 19.9",
    sagittarius: "M5 19L19 5M12.5 5H19V11.5M8 10L14 16",
    capricorn: "M3.5 6L6.8 17L10 6.5C10.8 4.4 13.4 4.4 13.4 7.6V15.2C13.4 19 18 20.4 19.6 17C20.8 14.4 17.8 12 15.6 13.8C13.6 15.6 12.4 19.4 8.6 20",
    aquarius: "M3 10.5L6 7.5L9 10.5L12 7.5L15 10.5L18 7.5L21 10.5M3 16.5L6 13.5L9 16.5L12 13.5L15 16.5L18 13.5L21 16.5",
    pisces: "M6.5 4C10.5 8 10.5 16 6.5 20M17.5 4C13.5 8 13.5 16 17.5 20M5 12H19"
  };
  function glyphSVG(id, color, size, sw) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<path d="' + GLYPHS[id] + '" fill="none" stroke="' + color + '" stroke-width="' + (sw || 1.6) + '" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function glyphAt(id, cx, cy, size, color, sw) {
    var s = size / 24;
    return '<g transform="translate(' + f(cx - size / 2) + " " + f(cy - size / 2) + ") scale(" + f(s) + ')"><path d="' + GLYPHS[id] +
      '" fill="none" stroke="' + color + '" stroke-width="' + f((sw || 1.6) / s * s) + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }

  /* 위쪽 가운데의 별자리 메달 */
  function medallion(cx, cy, r, glyph) {
    return '<path d="M' + f(cx - r * 1.05) + " " + f(cy - r * 0.2) + " Q" + f(cx) + " " + f(cy - r * 1.6) + " " + f(cx + r * 1.05) + " " + f(cy - r * 0.2) +
      " L" + f(cx + r * 0.9) + " " + f(cy + r * 0.55) + " Q" + f(cx) + " " + f(cy + r * 1.55) + " " + f(cx - r * 0.9) + " " + f(cy + r * 0.55) + 'Z" fill="' + CREAM +
      '" stroke="' + CREAM_LINE + '" stroke-width="1"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="' + f(r * 0.78) + '" fill="#fbf7f0" stroke="#d8cbb6" stroke-width="0.6"/>' +
      glyphAt(glyph, cx, cy, r * 1.05, INK, 1.7);
  }

  /* ---------- 앞면 이미지가 없을 때: 준비 중 앞면 (220 × 500) ---------- */
  function frontPlaceholder(glyph, seed) {
    var W = 220, H = 500, s = [], rnd = seeded(seed || 7);
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">');
    s.push('<defs><linearGradient id="pf-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2d68"/><stop offset="0.55" stop-color="#4a4790"/><stop offset="1" stop-color="#8d80c4"/></linearGradient>' +
      '<radialGradient id="pf-glow" cx="0.5" cy="0.42" r="0.5"><stop offset="0" stop-color="#fff6e6" stop-opacity="0.55"/><stop offset="1" stop-color="#fff6e6" stop-opacity="0"/></radialGradient></defs>');
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#pf-sky)"/>');
    for (var i = 0; i < 70; i++) {
      s.push('<circle cx="' + f(rnd() * W) + '" cy="' + f(rnd() * H * 0.8) + '" r="' + f(0.4 + rnd() * 1.1) + '" fill="#fff8ec" opacity="' + f(0.4 + rnd() * 0.6) + '"/>');
    }
    s.push('<ellipse cx="110" cy="210" rx="90" ry="110" fill="url(#pf-glow)"/>');
    // 아래 구름
    s.push('<path d="M0 430 C30 410 60 420 80 428 C100 410 140 412 160 426 C180 414 205 418 220 426 V500 H0Z" fill="#b3a5dc" opacity="0.55"/>');
    // 테두리: 바깥 띠와 아치 창
    s.push('<rect x="5" y="5" width="210" height="490" rx="12" fill="none" stroke="' + CREAM + '" stroke-width="2.2"/>');
    s.push('<rect x="10" y="10" width="200" height="480" rx="9" fill="none" stroke="' + CREAM_LINE + '" stroke-width="0.7" opacity="0.8"/>');
    s.push('<path d="M20 470V96C20 58 58 34 110 34C162 34 200 58 200 96V470" fill="none" stroke="' + CREAM + '" stroke-width="1.6"/>');
    s.push('<path d="M25 470V98C25 63 61 40 110 40C159 40 195 63 195 98V470" fill="none" stroke="' + CREAM_LINE + '" stroke-width="0.6" opacity="0.8"/>');
    // 가운데 큰 반짝임
    s.push('<path d="' + sparklePath(110, 210, 30, 0.16) + '" fill="#fff6e6" opacity="0.95"/>');
    s.push(sparkle(150, 160, 6, "#fff6e6"));
    s.push(sparkle(72, 262, 4.5, "#fff6e6"));
    // 아래 리본 (이름은 HTML·canvas 로 쓴다)
    s.push('<path d="M30 452 L48 446 L48 470 L30 476 L38 461Z M190 452 L172 446 L172 470 L190 476 L182 461Z" fill="#d9cdb9"/>');
    s.push('<path d="M44 444 Q110 432 176 444 L176 472 Q110 460 44 472Z" fill="' + CREAM + '" stroke="#d8cbb6" stroke-width="0.8"/>');
    s.push(medallion(110, 20, 15, glyph));
    s.push("</svg>");
    return s.join("");
  }

  /* ---------- 뒷면 이미지가 없을 때: 라벤더 빛 무늬 (254 × 394) ---------- */
  function backPlaceholder(glyph) {
    var W = 254, H = 394, s = [];
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden="true">');
    s.push('<defs><linearGradient id="pb-sky" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8f93d8"/><stop offset="0.5" stop-color="#a9a3e2"/><stop offset="1" stop-color="#c8b8ea"/></linearGradient>' +
      '<filter id="pb-blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>' +
      '<filter id="pb-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3"/></filter></defs>');
    s.push('<rect width="' + W + '" height="' + H + '" fill="url(#pb-sky)"/>');
    s.push('<g filter="url(#pb-blur)"><circle cx="127" cy="205" r="92" fill="none" stroke="#fff3e3" stroke-width="30" opacity="0.75"/>' +
      '<circle cx="138" cy="214" r="70" fill="#8e89d2" opacity="0.7"/>' +
      '<circle cx="74" cy="160" r="34" fill="#fff6ea" opacity="0.7"/>' +
      '<circle cx="190" cy="270" r="26" fill="#f4d6ef" opacity="0.6"/></g>');
    s.push('<g filter="url(#pb-soft)" opacity="0.8"><circle cx="127" cy="205" r="96" fill="none" stroke="#ffffff" stroke-width="3"/></g>');
    // 위쪽 아치 테두리
    s.push('<path d="M0 0H254V96C254 44 196 22 127 22C58 22 0 44 0 96Z" fill="#6f6cb8" opacity="0.55"/>');
    s.push('<path d="M0 98C0 46 58 24 127 24C196 24 254 46 254 98" fill="none" stroke="' + CREAM + '" stroke-width="2"/>');
    s.push('<path d="M0 108C0 56 58 32 127 32C196 32 254 56 254 108" fill="none" stroke="' + CREAM_LINE + '" stroke-width="0.8"/>');
    s.push(medallion(127, 22, 17, glyph));
    s.push("</svg>");
    return s.join("");
  }

  root.ByeolArt = {
    INK: INK, CREAM: CREAM,
    glyphSVG: glyphSVG, sparkle: sparkle, sparklePath: sparklePath,
    frontPlaceholder: frontPlaceholder, backPlaceholder: backPlaceholder
  };
})(window);
