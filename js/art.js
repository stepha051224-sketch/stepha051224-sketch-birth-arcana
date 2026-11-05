/*
 * 카드 그림 (SVG 문자열 생성)
 * - 카드 한 장은 280 × 490 좌표계.
 * - 그림 창은 (28, 62)에서 시작하는 224 × 356 아치 창.
 * - 글자는 SVG 안에 넣지 않는다. PNG로 옮길 때 웹 폰트가 빠지지 않도록
 *   번호·이름은 HTML(화면)과 canvas(PNG)에서 따로 그린다.
 */
(function (root) {
  var W = 280, H = 490;
  var WIN = { x: 28, y: 62, w: 224, h: 356 };
  var INK = "#7a6aa8", INK_DEEP = "#4b4068", PAPER = "#fcf9f4";

  /* ---------- 작은 도구 ---------- */
  function seeded(seed) {
    var s = seed >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function f(n) { return Math.round(n * 100) / 100; }
  function sparkle(cx, cy, r, fill, stroke, sw) {
    var k = r * 0.22;
    var d = "M" + f(cx) + " " + f(cy - r) +
      " Q" + f(cx + k) + " " + f(cy - k) + " " + f(cx + r) + " " + f(cy) +
      " Q" + f(cx + k) + " " + f(cy + k) + " " + f(cx) + " " + f(cy + r) +
      " Q" + f(cx - k) + " " + f(cy + k) + " " + f(cx - r) + " " + f(cy) +
      " Q" + f(cx - k) + " " + f(cy - k) + " " + f(cx) + " " + f(cy - r) + "Z";
    return '<path d="' + d + '" fill="' + fill + '" stroke="' + (stroke || "none") + '" stroke-width="' + (sw || 0) + '" stroke-linejoin="round"/>';
  }
  function star5(cx, cy, R, r, rot) {
    var p = [];
    for (var i = 0; i < 10; i++) {
      var a = (rot || -90) * Math.PI / 180 + i * Math.PI / 5, rr = i % 2 ? r : R;
      p.push(f(cx + Math.cos(a) * rr) + " " + f(cy + Math.sin(a) * rr));
    }
    return "M" + p.join(" L") + "Z";
  }
  function petal(len, wid) {
    return "M0 0 C" + f(wid) + " " + f(-len * 0.28) + " " + f(wid * 0.72) + " " + f(-len * 0.86) + " 0 " + f(-len) +
      " C" + f(-wid * 0.72) + " " + f(-len * 0.86) + " " + f(-wid) + " " + f(-len * 0.28) + " 0 0Z";
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

  /* ---------- 테두리 별 (켜지는 순서용) ---------- */
  var RING = (function () {
    var x0 = 9, y0 = 9, x1 = W - 9, y1 = H - 9;
    var per = 2 * ((x1 - x0) + (y1 - y0)), n = 30, pts = [];
    for (var i = 0; i < n; i++) {
      var s = (i + 0.5) / n * per, x, y;
      // 위쪽 가운데에서 출발해 시계 방향으로 돈다
      var startOff = (x1 - x0) / 2; s = (s + startOff) % per;
      if (s < x1 - x0) { x = x0 + s; y = y0; }
      else if ((s -= x1 - x0) < y1 - y0) { x = x1; y = y0 + s; }
      else if ((s -= y1 - y0) < x1 - x0) { x = x1 - s; y = y1; }
      else { s -= x1 - x0; x = x0; y = y1 - s; }
      if (y === y0 && Math.abs(x - W / 2) < 54) continue;   // 위 크레스트 자리
      if (y === y1 && Math.abs(x - W / 2) < 56) continue;   // 아래 명판 자리
      pts.push({ x: x, y: y, t: i / n, big: i % 3 === 0 });
    }
    return pts;
  })();
  function ringOrder(x, y) {
    // 위쪽 가운데 기준 시계 방향 각도 → 0..1
    var a = Math.atan2(x - W / 2, -(y - H / 2));
    return (a < 0 ? a + Math.PI * 2 : a) / (Math.PI * 2);
  }

  /* ---------- 카드 프레임 ---------- */
  var ARCH = "M28 418V124C28 84 70 62 140 62C210 62 252 84 252 124V418Z";

  function frameSVG(opt) {
    var accent = opt.accent, pale = opt.pale, uid = opt.uid;
    var s = [];
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" width="' + (opt.width || W) + '" height="' + (opt.height || H) + '" class="frame-svg" aria-hidden="true">');
    s.push("<defs><clipPath id=\"win-" + uid + "\"><path d=\"" + ARCH + "\"/></clipPath>" +
      '<radialGradient id="glow-' + uid + '"><stop offset="0" stop-color="#fffbe6" stop-opacity="1"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></radialGradient>' +
      "</defs>");
    // 종이와 띠
    s.push('<rect x="0.6" y="0.6" width="' + (W - 1.2) + '" height="' + (H - 1.2) + '" rx="16" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="1.2"/>');
    s.push('<rect x="6" y="6" width="' + (W - 12) + '" height="' + (H - 12) + '" rx="12" fill="none" stroke="' + accent + '" stroke-width="5" opacity="0.75"/>');
    s.push('<rect x="12.5" y="12.5" width="' + (W - 25) + '" height="' + (H - 25) + '" rx="8" fill="none" stroke="' + INK + '" stroke-width="0.8"/>');
    // 창
    if (opt.art) {
      s.push('<g clip-path="url(#win-' + uid + ')"><g transform="translate(' + WIN.x + " " + WIN.y + ')">' + opt.art + "</g></g>");
    } else {
      s.push('<path d="' + ARCH + '" fill="' + pale + '" opacity="0.55"/>');
      if (opt.backDeco) s.push('<g clip-path="url(#win-' + uid + ')">' + backDeco(accent) + "</g>");
    }
    s.push('<path d="' + ARCH + '" fill="none" stroke="' + INK + '" stroke-width="1.1"/>');
    s.push('<path d="M33 418V125C33 88 73 67 140 67C207 67 247 88 247 125V418" fill="none" stroke="' + INK + '" stroke-width="0.5" opacity="0.6"/>');
    // 위 띠: 반복 별
    [36, 56, 76, 204, 224, 244].forEach(function (x, i) {
      s.push(i % 2 ? sparkle(x, 34, 4, PAPER, INK, 0.8) : '<path d="' + star5(x, 34, 5.5, 2.4) + '" fill="' + pale + '" stroke="' + INK + '" stroke-width="0.8" stroke-linejoin="round"/>');
    });
    // 크레스트: 날개 달린 별
    s.push(crest(pale));
    // 아래 띠: 반복 별과 명판
    [38, 58, 222, 242].forEach(function (x, i) {
      s.push(i % 2 ? '<path d="' + star5(x, 452, 5, 2.2) + '" fill="' + pale + '" stroke="' + INK + '" stroke-width="0.8" stroke-linejoin="round"/>' : sparkle(x, 452, 4, PAPER, INK, 0.8));
    });
    s.push('<path d="M92 440H188L194 452L188 464H92L86 452Z" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="0.9"/>');
    s.push('<path d="M95 443H185L189.5 452L185 461H95L90.5 452Z" fill="none" stroke="' + accent + '" stroke-width="0.8"/>');
    // 봉인
    if (opt.glyph && opt.seal !== false) s.push(seal(236, 410, opt.glyph, pale));
    // 테두리 별 (켜지는 별)
    s.push('<g class="ring">');
    RING.forEach(function (p) {
      var ox = opt.mirror ? W - p.x : p.x;
      var order = ringOrder(ox, p.y);
      var r = p.big ? 4.6 : 3.2;
      s.push('<g class="rs' + (opt.lit ? " on" : "") + '" style="--o:' + order.toFixed(3) + '" transform="translate(' + f(p.x) + " " + f(p.y) + ')">' +
        '<circle class="rs-glow" r="' + (r * 2.4) + '" fill="url(#glow-' + uid + ')"/>' +
        sparkle(0, 0, r, "#fffbea", INK, 0.7).replace("<path", '<path class="rs-star"') + "</g>");
    });
    s.push("</g></svg>");
    return s.join("");
  }

  function crest(pale) {
    var s = [];
    // 날개: 양쪽 깃털 곡선
    [-1, 1].forEach(function (dir) {
      for (var i = 0; i < 3; i++) {
        var y = 30 + i * 6, len = 34 - i * 7;
        s.push('<path d="M' + (140 + dir * 14) + " " + (y - 2) + " C" + (140 + dir * (24 + len * 0.4)) + " " + (y - 12 + i * 2) + " " +
          (140 + dir * (18 + len)) + " " + (y - 6) + " " + (140 + dir * (20 + len)) + " " + (y + 2) +
          " C" + (140 + dir * (12 + len * 0.7)) + " " + (y - 1) + " " + (140 + dir * (20 + len * 0.3)) + " " + (y + 4) + " " + (140 + dir * 12) + " " + (y + 3) +
          'Z" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="0.8" stroke-linejoin="round"/>');
      }
    });
    s.push('<circle cx="140" cy="34" r="19" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="0.6" opacity="0.9"/>');
    s.push('<path d="' + star5(140, 35, 17, 7.2) + '" fill="' + pale + '" stroke="' + INK + '" stroke-width="1.1" stroke-linejoin="round"/>');
    s.push('<path d="' + star5(140, 35, 9, 3.8) + '" fill="#fffdf6" stroke="' + INK + '" stroke-width="0.6" stroke-linejoin="round"/>');
    s.push('<circle cx="140" cy="58" r="2.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="0.7"/>');
    return s.join("");
  }

  function seal(cx, cy, glyphId, pale) {
    var s = [], n = 18, R = 18, bump = 1.6, pts = [];
    for (var i = 0; i <= n * 2; i++) {
      var a = i / (n * 2) * Math.PI * 2, r = i % 2 ? R + bump : R - 0.2;
      pts.push(f(cx + Math.cos(a) * r) + " " + f(cy + Math.sin(a) * r));
    }
    s.push('<path d="M' + pts.join(" L") + 'Z" fill="' + pale + '" stroke="' + INK + '" stroke-width="0.9" stroke-linejoin="round"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="13.2" fill="' + PAPER + '" stroke="' + INK + '" stroke-width="0.8"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="11.2" fill="none" stroke="' + INK + '" stroke-width="0.4" stroke-dasharray="1 1.6"/>');
    s.push('<g transform="translate(' + (cx - 8.4) + " " + (cy - 8.4) + ') scale(0.7)"><path d="' + GLYPHS[glyphId] + '" fill="none" stroke="' + INK_DEEP + '" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></g>');
    return s.join("");
  }

  function backDeco(accent) {
    // 뒷면 창 안의 옅은 마법진
    var s = [], cx = 140, cy = 250;
    s.push('<g opacity="0.55" fill="none" stroke="' + accent + '">');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="104" stroke-width="0.8"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="96" stroke-width="0.5" stroke-dasharray="2 4"/>');
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="70" stroke-width="0.6"/>');
    s.push('<path d="' + star5(cx, cy, 96, 37) + '" stroke-width="0.5"/>');
    s.push("</g>");
    var rnd = seeded(7);
    for (var i = 0; i < 18; i++) s.push('<circle cx="' + f(40 + rnd() * 200) + '" cy="' + f(80 + rnd() * 330) + '" r="' + f(0.6 + rnd()) + '" fill="' + INK + '" opacity="0.25"/>');
    return s.join("");
  }

  /* ---------- 일러스트: XIII 죽음 ---------- */
  function artDeath() {
    var s = [], w = WIN.w, h = WIN.h, cx = 112, cy = 214;
    s.push('<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e6e1ef"/><stop offset="0.55" stop-color="#f3f0f7"/><stop offset="1" stop-color="#fbf9f5"/></linearGradient></defs>');
    s.push('<rect width="' + w + '" height="' + h + '" fill="url(#dg)"/>');
    // 꽃에서 퍼지는 빛줄기
    for (var i = 0; i < 36; i++) {
      var a = i / 36 * Math.PI * 2, r1 = 50, r2 = i % 2 ? 150 : 250;
      s.push('<line x1="' + f(cx + Math.cos(a) * r1) + '" y1="' + f(cy + Math.sin(a) * r1) + '" x2="' + f(cx + Math.cos(a) * r2) + '" y2="' + f(cy + Math.sin(a) * r2) + '" stroke="#b9afcf" stroke-width="0.5" opacity="0.5"/>');
    }
    s.push('<circle cx="' + cx + '" cy="' + cy + '" r="82" fill="#ffffff" opacity="0.55"/>');
    // 검은 리본: 매듭이 풀리며 양쪽으로 흘러내린다
    var RB = "#2f2a3c", RH = "#7d7396";
    var ribbons = [
      "M108 96C94 130 50 138 44 180C38 222 76 238 62 272C52 298 28 306 18 340",
      "M118 96C134 128 188 132 192 170C196 206 160 214 172 246C182 272 212 272 214 306",
      "M112 92C90 66 58 68 60 88C62 108 94 106 112 92",
      "M112 92C138 60 176 66 172 86C168 104 146 100 130 96"
    ];
    ribbons.forEach(function (d, i) {
      s.push('<path d="' + d + '" fill="none" stroke="' + RB + '" stroke-width="' + (i < 2 ? 8.5 : 7) + '" stroke-linecap="round" stroke-linejoin="round"/>');
      s.push('<path d="' + d + '" fill="none" stroke="' + RH + '" stroke-width="0.9" transform="translate(-1.6 -1.4)" opacity="0.9"/>');
    });
    // 풀린 리본 조각
    s.push('<path d="M176 120C190 112 204 118 206 130C208 140 198 146 190 140" fill="none" stroke="' + RB + '" stroke-width="5" stroke-linecap="round"/>');
    s.push('<path d="M28 132C18 126 10 132 12 142" fill="none" stroke="' + RB + '" stroke-width="4" stroke-linecap="round"/>');
    s.push('<ellipse cx="112" cy="93" rx="7" ry="5.6" fill="' + RB + '"/>');
    s.push('<path d="M108 91Q112 88 116 91" stroke="' + RH + '" stroke-width="0.8" fill="none"/>');
    // 줄기와 잎
    s.push('<path d="M112 250C110 284 104 312 96 356M110 290C124 300 132 316 134 340" fill="none" stroke="' + INK + '" stroke-width="1"/>');
    [[100, 300, -128, 34, 12], [126, 316, 140, 30, 10], [92, 336, -150, 26, 9], [140, 262, 112, 26, 9]].forEach(function (l) {
      s.push('<g transform="translate(' + l[0] + " " + l[1] + ") rotate(" + l[2] + ')"><path d="' + petal(l[3], l[4]) + '" fill="#d6efe6" stroke="' + INK + '" stroke-width="0.9"/><path d="M0 0L0 ' + (-l[3] * 0.9) + '" stroke="' + INK + '" stroke-width="0.5"/></g>');
    });
    // 작은 꽃들
    function bloom(x, y, sc, rot) {
      var g = ['<g transform="translate(' + x + " " + y + ") scale(" + sc + ") rotate(" + (rot || 0) + ')">'];
      for (var k = 0; k < 6; k++) g.push('<path d="' + petal(58, 25) + '" transform="rotate(' + (k * 60) + ')" fill="#fffefb" stroke="' + INK + '" stroke-width="' + f(1.1 / sc) + '" stroke-linejoin="round"/>');
      for (var k2 = 0; k2 < 6; k2++) {
        g.push('<path d="' + petal(40, 17) + '" transform="rotate(' + (k2 * 60 + 30) + ')" fill="#ffffff" stroke="' + INK + '" stroke-width="' + f(1 / sc) + '"/>');
        g.push('<path d="M0 -6Q2 -20 0 -34" transform="rotate(' + (k2 * 60 + 30) + ')" fill="none" stroke="#b7adcd" stroke-width="' + f(0.7 / sc) + '"/>');
      }
      for (var k3 = 0; k3 < 6; k3++) {
        var aa = (k3 * 60 + 10) * Math.PI / 180, ex = Math.cos(aa) * 20, ey = Math.sin(aa) * 20;
        g.push('<path d="M0 0Q' + f(ex * 0.4) + " " + f(ey * 0.7) + " " + f(ex) + " " + f(ey) + '" fill="none" stroke="' + INK + '" stroke-width="' + f(0.8 / sc) + '"/><circle cx="' + f(ex) + '" cy="' + f(ey) + '" r="2.4" fill="#d6efe6" stroke="' + INK + '" stroke-width="' + f(0.6 / sc) + '"/>');
      }
      g.push('<circle r="5" fill="#ebe6f3" stroke="' + INK + '" stroke-width="' + f(0.8 / sc) + '"/></g>');
      return g.join("");
    }
    s.push(bloom(48, 270, 0.42, 12));
    s.push(bloom(176, 186, 0.36, -8));
    s.push(bloom(cx, cy, 1, 0));
    // 봉오리
    [[160, 304, 18], [64, 214, -24]].forEach(function (b) {
      s.push('<g transform="translate(' + b[0] + " " + b[1] + ") rotate(" + b[2] + ')"><path d="M0 0C0 14 -2 22 -3 30" stroke="' + INK + '" stroke-width="0.9" fill="none"/><path d="' + petal(22, 9) + '" fill="#fffefb" stroke="' + INK + '" stroke-width="0.9"/><path d="M0 -2C-3 -10 -2 -16 0 -21" stroke="#b7adcd" stroke-width="0.6" fill="none"/></g>');
    });
    // 날리는 꽃잎과 반짝임
    [[40, 120, 30], [190, 250, -40], [150, 60, 70], [24, 222, 120], [80, 330, -20]].forEach(function (p) {
      s.push('<path d="' + petal(11, 5) + '" transform="translate(' + p[0] + " " + p[1] + ") rotate(" + p[2] + ')" fill="#ffffff" stroke="' + INK + '" stroke-width="0.7"/>');
    });
    [[30, 40, 6], [196, 40, 5], [184, 214, 4], [36, 168, 3.5], [140, 140, 3], [200, 340, 5]].forEach(function (p) {
      s.push(sparkle(p[0], p[1], p[2], "#ffffff", INK, 0.7));
    });
    return s.join("");
  }

  /* ---------- 일러스트: XVII 별 ---------- */
  function artStar() {
    var s = [], w = WIN.w, h = WIN.h, sx = 150, sy = 96;
    s.push('<defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7d1ec"/><stop offset="0.5" stop-color="#cfe6f5"/><stop offset="1" stop-color="#f2f8fb"/></linearGradient>' +
      '<radialGradient id="sglow"><stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0.45"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs>');
    s.push('<rect width="' + w + '" height="' + h + '" fill="url(#sg)"/>');
    var rnd = seeded(17);
    for (var i = 0; i < 46; i++) s.push('<circle cx="' + f(rnd() * w) + '" cy="' + f(rnd() * h * 0.8) + '" r="' + f(0.5 + rnd() * 1.1) + '" fill="#ffffff" opacity="' + f(0.6 + rnd() * 0.4) + '"/>');
    // 빛의 꼬리: 별에서 왼쪽 아래로 길게 흐른다
    function bez(p0, p1, p2, p3, t) {
      var u = 1 - t;
      return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
              u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
    }
    var trails = [];
    for (var k = 0; k < 9; k++) {
      var o = (k - 4) * 7;
      trails.push([[sx, sy], [sx - 40 + o, sy + 60 - o * 0.4], [70 + o * 1.6, 200 + o], [-10 + o * 0.8, 300 + o * 2.2]]);
    }
    trails.forEach(function (c, k) {
      var d = "M" + c[0].join(" ") + "C" + c[1].join(" ") + " " + c[2].join(" ") + " " + c[3].join(" ");
      var mid = Math.abs(k - 4);
      s.push('<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="' + f(4.2 - mid * 0.8) + '" stroke-linecap="round" opacity="' + f(0.9 - mid * 0.14) + '"/>');
      if (k % 2 === 0) s.push('<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="0.5" opacity="0.55"/>');
    });
    // 꼬리 위의 빛 알갱이
    for (var j = 0; j < 22; j++) {
      var t = 0.12 + j / 22 * 0.86, c = trails[(j * 3) % 9], p = bez(c[0], c[1], c[2], c[3], t);
      s.push(j % 4 === 0 ? sparkle(p[0], p[1], 3.2, "#ffffff", INK, 0.6) : '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + f(1 + (j % 3) * 0.4) + '" fill="#ffffff"/>');
    }
    // 주인공 별
    s.push('<circle cx="' + sx + '" cy="' + sy + '" r="62" fill="url(#sglow)"/>');
    s.push('<circle cx="' + sx + '" cy="' + sy + '" r="30" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.9"/>');
    s.push('<circle cx="' + sx + '" cy="' + sy + '" r="38" fill="none" stroke="' + INK + '" stroke-width="0.4" stroke-dasharray="1.5 3" opacity="0.7"/>');
    var pts = [];
    for (var q = 0; q < 16; q++) {
      var a = -Math.PI / 2 + q * Math.PI / 8, r = q % 2 ? 6.5 : (q % 4 === 0 ? 40 : 17);
      pts.push(f(sx + Math.cos(a) * r) + " " + f(sy + Math.sin(a) * r));
    }
    s.push('<path d="M' + pts.join(" L") + 'Z" fill="#fffef4" stroke="' + INK + '" stroke-width="1" stroke-linejoin="round"/>');
    s.push('<path d="M' + sx + " " + (sy - 34) + "L" + sx + " " + (sy + 34) + "M" + (sx - 34) + " " + sy + "L" + (sx + 34) + " " + sy + '" stroke="#b9d9ee" stroke-width="0.7"/>');
    s.push('<circle cx="' + sx + '" cy="' + sy + '" r="4.5" fill="#ffffff" stroke="' + INK + '" stroke-width="0.8"/>');
    // 작은 동반 별들
    [[60, 52, 9], [196, 186, 7], [34, 120, 5], [118, 30, 4]].forEach(function (p) {
      s.push('<path d="' + star5(p[0], p[1], p[2], p[2] * 0.42) + '" fill="#fffef4" stroke="' + INK + '" stroke-width="0.8" stroke-linejoin="round"/>');
    });
    // 아래 구름
    function cloud(x, y, sc) {
      return '<path transform="translate(' + x + " " + y + ") scale(" + sc + ')" d="M0 30C-14 30 -16 12 -2 10C-2 -4 18 -8 24 4C30 -10 54 -8 56 8C70 6 74 26 60 30Z" fill="#ffffff" stroke="' + INK + '" stroke-width="' + f(0.9 / sc) + '" stroke-linejoin="round"/>';
    }
    s.push('<path d="M0 ' + (h - 34) + "C40 " + (h - 46) + " 80 " + (h - 30) + " 120 " + (h - 40) + "C160 " + (h - 50) + " 200 " + (h - 34) + " " + w + " " + (h - 40) + "V" + h + "H0Z" + '" fill="#ffffff" opacity="0.85"/>');
    s.push(cloud(120, 300, 1.2));
    s.push(cloud(14, 316, 0.9));
    s.push(cloud(180, 322, 0.8));
    return s.join("");
  }

  /* ---------- 일러스트: XVIII 달 ---------- */
  function artMoon() {
    var s = [], w = WIN.w, h = WIN.h, mx = 112, my = 92;
    s.push('<defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8cdee"/><stop offset="0.5" stop-color="#e9e3f4"/><stop offset="1" stop-color="#f7f4fa"/></linearGradient></defs>');
    s.push('<rect width="' + w + '" height="' + h + '" fill="url(#mg)"/>');
    var rnd = seeded(18);
    for (var i = 0; i < 30; i++) s.push('<circle cx="' + f(rnd() * w) + '" cy="' + f(rnd() * 160) + '" r="' + f(0.5 + rnd()) + '" fill="#ffffff" opacity="0.9"/>');
    // 달빛 살
    for (var k = 0; k < 40; k++) {
      var a = k / 40 * Math.PI * 2, r2 = k % 2 ? 56 : 72;
      s.push('<line x1="' + f(mx + Math.cos(a) * 46) + '" y1="' + f(my + Math.sin(a) * 46) + '" x2="' + f(mx + Math.cos(a) * r2) + '" y2="' + f(my + Math.sin(a) * r2) + '" stroke="' + INK + '" stroke-width="0.55" opacity="0.5"/>');
    }
    s.push('<circle cx="' + mx + '" cy="' + my + '" r="42" fill="#ffffff" opacity="0.5"/>');
    s.push('<circle cx="' + mx + '" cy="' + my + '" r="36" fill="#f3eefb" stroke="' + INK + '" stroke-width="1"/>');
    // 초승달 (라일락)
    s.push('<path d="M' + (mx - 6) + " " + (my - 35.5) + "A36 36 0 1 0 " + (mx - 6) + " " + (my + 35.5) + "A30 30 0 1 1 " + (mx - 6) + " " + (my - 35.5) + 'Z" fill="#d3c4ef" stroke="' + INK + '" stroke-width="0.9"/>');
    [[-20, -10, 3], [-24, 12, 2.2], [-12, 22, 1.6]].forEach(function (c) {
      s.push('<circle cx="' + (mx + c[0]) + '" cy="' + (my + c[1]) + '" r="' + c[2] + '" fill="none" stroke="' + INK + '" stroke-width="0.5" opacity="0.7"/>');
    });
    // 떨어지는 빛방울
    [[70, 150], [92, 168], [112, 146], [134, 166], [154, 150], [82, 186], [142, 188]].forEach(function (p, i) {
      s.push('<path transform="translate(' + p[0] + " " + p[1] + ") scale(" + (i % 2 ? 0.8 : 1) + ')" d="M0 -7C2 -3 4 0 4 2.6A4 4 0 0 1 -4 2.6C-4 0 -2 -3 0 -7Z" fill="#e7def7" stroke="' + INK + '" stroke-width="0.7"/>');
    });
    // 먼 산
    s.push('<path d="M0 214C26 196 44 202 62 206C80 190 96 196 112 206C130 192 150 196 166 206C186 194 206 200 224 210V236H0Z" fill="#e3dcf1" stroke="' + INK + '" stroke-width="0.7"/>');
    // 연못
    s.push('<path d="M0 316C40 308 70 322 112 318C154 314 190 306 224 316V356H0Z" fill="#d2efe4" stroke="' + INK + '" stroke-width="0.8"/>');
    for (var r = 0; r < 6; r++) s.push('<path d="M' + (14 + r * 34) + " " + (330 + (r % 2) * 10) + "q8 -3 16 0" + '" stroke="' + INK + '" stroke-width="0.6" fill="none" opacity="0.7"/>');
    // 땅
    s.push('<path d="M0 232C60 226 164 226 224 232V318C190 308 154 316 112 320C70 322 40 310 0 318Z" fill="#f4f0e8"/>');
    // 길: 연못가에서 지평선까지 굽이친다
    s.push('<path d="M74 322C92 296 142 290 124 266C110 248 104 232 110 210L116 210C120 232 128 248 138 266C160 290 152 300 150 322Z" fill="#fbf8f2" stroke="' + INK + '" stroke-width="0.9" stroke-linejoin="round"/>');
    s.push('<path d="M112 314C122 296 140 290 128 270C118 254 114 236 113 214" fill="none" stroke="#b9afcf" stroke-width="0.8" stroke-dasharray="3 4"/>');
    // 풀과 꽃
    [[60, 300], [170, 302], [44, 268], [186, 264], [88, 246], [146, 246]].forEach(function (p, i) {
      s.push('<path d="M' + p[0] + " " + p[1] + "l-3 -9M" + p[0] + " " + p[1] + "l0 -11M" + p[0] + " " + p[1] + 'l3 -9" stroke="' + INK + '" stroke-width="0.7" fill="none"/>');
      if (i % 2 === 0) s.push(sparkle(p[0], p[1] - 13, 3, "#ffffff", INK, 0.5));
    });
    // 두 탑
    function tower(x, flip) {
      var g = ['<g transform="translate(' + x + ' 0)' + (flip ? " scale(-1 1)" : "") + '">'];
      g.push('<path d="M-17 304L-14 156H14L17 304Z" fill="#fcf9f4" stroke="' + INK + '" stroke-width="1"/>');
      g.push('<path d="M-20 158L0 112L20 158Z" fill="#d3c4ef" stroke="' + INK + '" stroke-width="1" stroke-linejoin="round"/>');
      g.push('<path d="M0 112V100" stroke="' + INK + '" stroke-width="0.9"/>' + sparkle(0, 96, 4, "#fffef4", INK, 0.7));
      g.push('<path d="M-18 162H18M-18 166H18" stroke="' + INK + '" stroke-width="0.6"/>');
      g.push('<path d="M-6 200V188A6 6 0 0 1 6 188V200Z" fill="#e7def7" stroke="' + INK + '" stroke-width="0.8"/>');
      g.push('<path d="M-4 250V242A4 4 0 0 1 4 242V250Z" fill="#e7def7" stroke="' + INK + '" stroke-width="0.7"/>');
      for (var b = 0; b < 7; b++) g.push('<path d="M' + (b % 2 ? -14 : -8) + " " + (214 + b * 12) + "h" + (b % 2 ? 10 : 12) + '" stroke="' + INK + '" stroke-width="0.4" opacity="0.6"/>');
      g.push('<path d="M-22 304H22V312H-22Z" fill="#ebe6f3" stroke="' + INK + '" stroke-width="0.8"/>');
      g.push("</g>");
      return g.join("");
    }
    s.push(tower(32, false));
    s.push(tower(192, true));
    [[20, 40, 5], [204, 52, 4], [186, 128, 3], [40, 128, 3]].forEach(function (p) {
      s.push(sparkle(p[0], p[1], p[2], "#ffffff", INK, 0.6));
    });
    return s.join("");
  }

  /* ---------- 준비 중 카드 ---------- */
  function artPending(accent) {
    var s = [], w = WIN.w, h = WIN.h;
    s.push('<rect width="' + w + '" height="' + h + '" fill="#f6f3f9"/>');
    s.push('<g fill="none" stroke="' + accent + '" stroke-width="0.8" stroke-dasharray="3 5"><circle cx="112" cy="170" r="70"/><circle cx="112" cy="170" r="50"/></g>');
    s.push(sparkle(112, 170, 14, "#ffffff", INK, 0.8));
    [[40, 60, 4], [186, 80, 5], [60, 300, 4], [176, 290, 3]].forEach(function (p) { s.push(sparkle(p[0], p[1], p[2], "#ffffff", INK, 0.6)); });
    return s.join("");
  }

  var ARTS = { death: artDeath, star: artStar, moon: artMoon };

  root.ByeolArt = {
    W: W, H: H, INK: INK, INK_DEEP: INK_DEEP, PAPER: PAPER,
    glyphSVG: glyphSVG, frameSVG: frameSVG, sparkle: sparkle,
    has: function (name) { return !!ARTS[name]; },
    art: function (name, accent) { return ARTS[name] ? ARTS[name]() : artPending(accent); }
  };
})(window);
