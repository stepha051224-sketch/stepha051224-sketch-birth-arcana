(function () {
  "use strict";
  var Art = window.ByeolArt, L = window.ByeolLookup;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var home = $("home"), input = $("input"), stage = $("stage");
  var picked = $("picked");
  var card = $("card"), bob = $("card-bob"), inner = $("card-inner"), front = $("face-front"), back = $("face-back");
  var hint = $("hint"), actions = $("actions"), reading = $("reading"), burst = $("burst"), announce = $("announce");

  var state = { info: null, flipped: false, revealed: false, busy: false };

  /* 뷰어의 파일 저장 기능 (claude.ai 안에서만 있다) */
  var downloadsP = (window.claude && typeof window.claude.use === "function")
    ? Promise.resolve(window.claude.use("downloads")).catch(function () { return null; })
    : Promise.resolve(null);

  /* ---------- 생일 입력: 월·일 휠 ---------- */
  function range(n, unit) { var a = []; for (var i = 1; i <= n; i++) a.push({ value: i, label: i + unit }); return a; }
  function daysIn(m) { return window.BYEOL_DAYS_IN_MONTH[m - 1]; }   // 연도를 받지 않으므로 2월은 29일까지

  var dayWheel;
  var wantDay = 1;   // 사용자가 직접 고른 일. 달을 굴리며 2월을 지나가도 기억해 둔다
  var monthWheel = ByeolWheel($("month-wheel"), {
    items: range(12, "월"), value: 1, label: "태어난 달",
    onChange: function (m) {
      // 달이 바뀌면 일의 범위를 맞춘다. 1월 31일 → 4월이면 4월 30일
      var max = daysIn(m);
      dayWheel.setItems(range(max, "일"), Math.min(wantDay, max));
      showPicked();
    }
  });
  dayWheel = ByeolWheel($("day-wheel"), {
    items: range(31, "일"), value: 1, label: "태어난 날",
    onChange: function (d) { wantDay = d; showPicked(); }
  });

  function showPicked() { picked.textContent = monthWheel.value() + "월 " + dayWheel.value() + "일"; }
  function setDate(m, d, smooth) {
    wantDay = d;
    monthWheel.set(m, smooth);
    dayWheel.setItems(range(daysIn(m), "일"), Math.min(d, daysIn(m)));
    showPicked();
  }
  showPicked();

  Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (b) {
    b.addEventListener("click", function () { setDate(+b.dataset.m, +b.dataset.d, true); });
  });

  $("birth-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var m = monthWheel.value(), d = dayWheel.value();
    var info = L.isValidMonthDay(m, d) && L.lookup(m, d);
    if (!info) { picked.textContent = "날짜를 다시 골라 주세요."; return; }
    showCard(info);
  });

  /* ---------- 화면 전환 ---------- */
  function show(screen) {
    [home, input, stage].forEach(function (s) { s.hidden = s !== screen; });
    window.scrollTo(0, 0);
    if (screen === input) { monthWheel.refresh(); dayWheel.refresh(); }   // 숨어 있던 휠의 위치를 다시 맞춘다
  }
  function toInput() {
    $("toast").classList.remove("show");
    stage.classList.remove("shown");
    state.info = null;
    show(input);                     // 휠에는 직전에 고른 값이 남아 있다
    $("month-wheel").focus({ preventScroll: true });
  }
  $("start").addEventListener("click", function () { show(input); });
  $("input-back").addEventListener("click", function () { show(home); });
  $("back").addEventListener("click", toInput);
  $("again").addEventListener("click", toInput);

  /* ---------- 카드 만들기 ---------- */
  function hasFront(info) { return !!(info.content && info.content.front); }

  function ringMarkup(mirror) {
    // 카드 가장자리를 따라 위쪽 가운데에서 시계 방향으로 켜지는 별
    var pts = [], n = 22, inset = 3.2, aspect = 340.158 / 198.425;
    var w = 100 - inset * 2, h = (100 - inset * 2) * aspect, per = 2 * (w + h);
    for (var i = 0; i < n; i++) {
      var s = ((i + 0.5) / n * per + w / 2) % per, x, y;
      if (s < w) { x = inset + s; y = 0; }
      else if ((s -= w) < h) { x = 100 - inset; y = s; }
      else if ((s -= h) < w) { x = 100 - inset - s; y = h; }
      else { s -= w; x = inset; y = h - s; }
      var top = (inset * aspect + y) / (100 * aspect) * 100;
      var ox = mirror ? 100 - x : x;   // 뒷면은 좌우가 뒤집혀 보이므로 순서를 거울로
      var ang = Math.atan2(ox - 50, -(top - 50) * aspect);
      var o = ((ang < 0 ? ang + Math.PI * 2 : ang) / (Math.PI * 2)).toFixed(3);
      pts.push('<i style="left:' + x.toFixed(2) + "%;top:" + top.toFixed(2) + "%;--o:" + o + '"></i>');
    }
    return '<span class="ring" aria-hidden="true">' + pts.join("") + "</span>";
  }

  function buildFront(info) {
    var c = info.card, ct = info.content;
    var html;
    if (hasFront(info)) {
      html = '<img src="' + ct.front + '" alt="' + c.en + ' 카드 앞면" draggable="false">';
    } else {
      html = Art.frontPlaceholder(info.zodiac.id, c.num) +
        '<span class="f-pending">일러스트 준비 중</span>' +
        '<span class="f-banner">' + c.en + "</span>";
    }
    front.innerHTML = html + ringMarkup(false);
  }

  function buildBack(info) {
    var c = info.card, ct = info.content;
    var img = ct.back ? '<img src="' + ct.back + '" alt="" draggable="false">' : Art.backPlaceholder(info.zodiac.id);
    back.innerHTML =
      '<div class="b-img">' + img + "</div>" +
      '<div class="b-name">' + c.en + "</div>" +
      '<div class="b-sign"><span class="rn">' + c.roman + "</span>" + info.zodiac.name + "</div>" +
      '<p class="b-result" id="b-result"></p>' +
      ringMarkup(true);
  }

  function showCard(info) {
    state.info = info; state.flipped = false; state.revealed = false; state.busy = false;
    show(stage);

    card.className = "card";
    [inner, bob].forEach(function (el) { el.getAnimations && el.getAnimations().forEach(function (a) { if (a.id === "spin" || a.id === "lift") a.cancel(); }); });
    inner.style.transform = "";
    burst.innerHTML = "";
    $("toast").classList.remove("show");
    reading.hidden = true;
    actions.hidden = true;
    announce.textContent = "";

    buildFront(info);
    buildBack(info);

    card.setAttribute("aria-label", info.card.en + " 카드. 눌러서 뒤집기");
    hint.textContent = "카드를 눌러 보세요";
    hint.className = "hint";
    hint.style.opacity = "";

    void card.offsetWidth;
    requestAnimationFrame(function () {
      stage.classList.add("shown");
      card.classList.add("enter");
      setTimeout(function () {
        if (state.info !== info) return;
        card.classList.remove("enter");
        if (!state.revealed) hint.classList.add("pulse");
      }, reduceMotion ? 0 : 1000);
    });
  }

  /* ---------- 뒤집기 ---------- */
  function onCardActivate() {
    var info = state.info;
    if (!info || state.busy) return;
    if (!state.revealed) flip(info);
    else turn(info, !state.flipped);
  }
  card.addEventListener("click", onCardActivate);
  card.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCardActivate(); }
  });

  /* "때"처럼 앞말에 붙어 읽히는 말이 줄 첫머리로 떨어지지 않게 붙임표 없는 공백으로 묶는다 */
  function keepTogether(text) { return text.replace(/ (때|수|것)(?= |$)/g, "\u00a0$1"); }

  /* 한 줄 결과를 쉼표 기준 구절로 나눈다: "익숙한 선택지 밖을 살펴볼 때," / "새 기회가 보여." */
  function clauses(text) { return keepTogether(text).split(/(?<=,) /); }

  function fillResult(info) {
    var box = $("b-result");
    box.innerHTML = "";
    var el = document.createElement("span");
    el.className = "b-text";
    box.appendChild(el);
    var i = 0;
    clauses(info.content.result).forEach(function (part, ci, parts) {
      var c = document.createElement("span");
      c.className = "clause";
      part.split(" ").forEach(function (word, wi, words) {
        var s = document.createElement("span");
        s.className = "w"; s.style.setProperty("--i", i++);
        s.textContent = word;
        c.appendChild(s);
        if (wi < words.length - 1) c.appendChild(document.createTextNode(" "));
      });
      el.appendChild(c);
      if (ci < parts.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return box;
  }

  /*
   * 회전 한 번: 카드를 들어 올리는 움직임(bob)과 세로축 회전(inner)을
   * 따로 움직여 각자 한 곡선으로 부드럽게 흐르게 한다.
   */
  function spin(from, to, o) {
    var rot = inner.animate([
      { transform: "rotateY(" + from + "deg)" },
      { transform: "rotateY(" + to + "deg)" }
    ], { id: "spin", duration: o.duration, delay: o.delay, easing: o.easing, fill: "both" });
    bob.animate([
      { transform: "translateY(0) scale(1)", easing: "cubic-bezier(.33,0,.2,1)" },
      { transform: "translateY(" + (-o.lift) + "px) scale(" + o.scale + ")", offset: 0.42, easing: "cubic-bezier(.45,0,.35,1)" },
      { transform: "translateY(0) scale(1)" }
    ], { id: "lift", duration: o.delay + o.duration + 120 });
    return rot.finished.then(function () {
      var end = ((to % 360) + 360) % 360;
      inner.style.transform = end ? "rotateY(" + end + "deg)" : "";
      rot.cancel();
    });
  }

  function flip(info) {
    state.busy = true; state.flipped = true;
    hint.classList.remove("pulse");
    hint.style.opacity = "0";
    card.classList.remove("enter");
    var resultEl = fillResult(info);   // 결과 문장은 탭한 뒤에야 문서에 들어간다

    if (reduceMotion) { inner.style.transform = "rotateY(180deg)"; return done(); }

    card.classList.add("flipping", "lighting");
    spin(0, 180, { duration: 1150, delay: 110, easing: "cubic-bezier(.62,0,.28,1.08)", lift: 24, scale: 1.04 }).then(function () {
      card.classList.remove("flipping");
      card.classList.add("pop");
      popStars();
      setTimeout(done, 140);
    });

    function done() {
      resultEl.classList.add("shown");
      announce.textContent = info.content.result;
      state.revealed = true;
      card.classList.add("revealed");
      setTimeout(function () {
        state.busy = false;
        card.classList.remove("pop", "lighting");
        hint.textContent = "다시 누르면 앞면을 볼 수 있어요";
        hint.style.opacity = "";
        renderReading(info);
        reading.hidden = false;
        actions.hidden = false;
        card.setAttribute("aria-label", info.card.en + " 카드 뒷면. " + info.content.result + ". 눌러서 앞면 보기");
      }, reduceMotion ? 0 : 900);
    }
  }

  /* 결과를 연 뒤: 누를 때마다 앞면 ↔ 뒷면 */
  function turn(info, toBack) {
    state.busy = true;
    card.classList.remove("pop");
    var from = toBack ? 0 : 180, to = toBack ? 180 : 360;
    function end() {
      state.flipped = toBack;
      if (reduceMotion) inner.style.transform = toBack ? "rotateY(180deg)" : "";
      hint.textContent = toBack ? "다시 누르면 앞면을 볼 수 있어요" : "다시 누르면 뒷면을 볼 수 있어요";
      card.setAttribute("aria-label", info.card.en + (toBack ? " 카드 뒷면. " + info.content.result + ". 눌러서 앞면 보기" : " 카드 앞면. 눌러서 뒷면 보기"));
      state.busy = false;
    }
    if (reduceMotion) return end();
    spin(from, to, { duration: 820, delay: 50, easing: "cubic-bezier(.55,0,.25,1.06)", lift: 14, scale: 1.02 }).then(end);
  }

  /* 뒤집힘이 끝나는 순간: 작은 별 세 개 + 빛 알갱이 + 빛 테 */
  function popStars() {
    var area = $("card-area").getBoundingClientRect(), r = card.getBoundingClientRect();
    var cx = r.left - area.left + r.width / 2, cy = r.top - area.top + r.height / 2;
    var hw = r.width / 2, hh = r.height / 2;

    function add(cls, x, y, w, h, html) {
      var el = document.createElement("div");
      el.className = "p " + cls;
      el.style.width = w + "px"; el.style.height = h + "px";
      el.style.left = (x - w / 2) + "px"; el.style.top = (y - h / 2) + "px";
      if (html) el.innerHTML = html;
      burst.appendChild(el);
      return el;
    }
    var wave = add("wave", cx, cy, r.width, r.height);
    wave.style.borderRadius = (r.width * 0.045) + "px";
    wave.animate([{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(1.12, 1.06)", opacity: 0 }],
      { duration: 700, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });

    [
      { ax: -0.55, ay: -1, dx: -50, dy: -40, size: 28, fill: "#dcd2f4", rot: -40 },
      { ax: 0.08, ay: -1.03, dx: 6, dy: -58, size: 22, fill: "#fff6e6", rot: 30 },
      { ax: 0.62, ay: -0.95, dx: 54, dy: -34, size: 32, fill: "#c9d9f4", rot: 55 }
    ].forEach(function (s, i) {
      var el = add("star", cx + s.ax * hw, cy + s.ay * hh, s.size, s.size,
        '<svg viewBox="-12 -12 24 24">' + Art.sparkle(0, 0, 11, s.fill, "#8d7bbd", 1) + '<circle r="2" fill="#ffffff"/></svg>');
      el.animate([
        { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + s.dx * 0.6 + "px," + s.dy * 0.6 + "px) scale(1.25) rotate(" + s.rot * 0.6 + "deg)", opacity: 1, offset: 0.35 },
        { transform: "translate(" + s.dx + "px," + s.dy + "px) scale(0.9) rotate(" + s.rot + "deg)", opacity: 1, offset: 0.7 },
        { transform: "translate(" + s.dx * 1.08 + "px," + (s.dy * 1.08 + 10) + "px) scale(0.2) rotate(" + s.rot * 1.2 + "deg)", opacity: 0 }
      ], { duration: 1150, delay: i * 60, easing: "cubic-bezier(.15,.8,.3,1)", fill: "both" });
    });

    var n = 16;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
      var ex = Math.sin(a), ey = -Math.cos(a);
      var k = 1 / Math.max(Math.abs(ex) / hw, Math.abs(ey) / hh);
      var x = cx + ex * k * 0.96, y = cy + ey * k * 0.96;
      var big = i % 3 === 0, size = big ? 14 : 4, dist = 24 + (i % 4) * 9;
      var el = add(big ? "star" : "dot", x, y, size, size,
        big ? '<svg viewBox="-12 -12 24 24">' + Art.sparkle(0, 0, 11, "#ffffff", "#8d7bbd", 1.1) + "</svg>" : "");
      el.animate([
        { transform: "translate(0,0) scale(.3)", opacity: 0 },
        { transform: "translate(" + ex * dist * 0.5 + "px," + ey * dist * 0.5 + "px) scale(1.2)", opacity: 1, offset: 0.25 },
        { transform: "translate(" + ex * dist + "px," + ey * dist + "px) scale(.4)", opacity: 0 }
      ], { duration: 820 + (i % 5) * 60, delay: 30 + (i % 4) * 25, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
    }
    setTimeout(function () { burst.innerHTML = ""; }, 1500);
  }

  /* ---------- 카드 해석 ---------- */
  function renderReading(info) {
    var z = info.zodiac, c = info.card;
    $("reading-text").textContent = info.content.reading;
    var meta = info.month + "월 " + info.day + "일 → " + z.name + " → " + c.roman + " · " + c.name + ". 별자리 날짜는 프로토타입용 간이 기준이에요.";
    if (info.boundary) meta += " " + info.month + "월 " + info.day + "일은 " + z.name + "의 경계일이라, 태어난 해와 시각에 따라 이웃 별자리일 수도 있어요.";
    $("reading-meta").textContent = meta;
  }

  /* ---------- 이미지 저장 (앞면 + 뒷면, 세로 PNG) ---------- */
  var toastTimer;
  function toast(t) {
    var el = $("toast"); el.textContent = t; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }
  function svgSrc(svg) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg); }
  var imageCache = {};
  function imageDataURL(path) {
    if (!imageCache[path]) {
      imageCache[path] = fetch(path).then(function (r) {
        if (!r.ok) throw new Error("image " + r.status);
        return r.blob();
      }).then(function (b) {
        return new Promise(function (res, rej) { var fr = new FileReader(); fr.onload = function () { res(fr.result); }; fr.onerror = rej; fr.readAsDataURL(b); });
      });
      imageCache[path].catch(function () { delete imageCache[path]; });
    }
    return imageCache[path];
  }
  function sized(svg, w, h) { return svg.replace('width="100%" height="100%"', 'width="' + w + '" height="' + h + '"'); }

  function wrapLines(ctx, text, maxW) {
    var words = text.split(" "), lines = [], line = "";
    words.forEach(function (w) {
      var t = line ? line + " " + w : w;
      if (ctx.measureText(t).width <= maxW || !line) line = t;
      else { lines.push(line); line = w; }
    });
    if (line) lines.push(line);
    return lines;
  }
  /* 구절마다 한 줄에 들어가면 쉼표에서 줄을 바꾸고, 아니면 고르게 나눈다 */
  function resultLines(ctx, text, maxW) {
    var parts = clauses(text);
    if (parts.length > 1 && parts.every(function (p) { return ctx.measureText(p).width <= maxW; })) return parts;
    return balanced(ctx, keepTogether(text), maxW);
  }
  function balanced(ctx, text, maxW) {
    var lines = wrapLines(ctx, text, maxW), w = maxW;
    while (w > 40 && wrapLines(ctx, text, w - 4).length === lines.length) w -= 4;
    return wrapLines(ctx, text, w);
  }
  function setSpacing(ctx, v) { if ("letterSpacing" in ctx) ctx.letterSpacing = v; }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawCover(ctx, img, x, y, w, h, r, fy) {
    var s = Math.max(w / img.width, h / img.height), iw = img.width * s, ih = img.height * s;
    ctx.save(); roundRect(ctx, x, y, w, h, r); ctx.clip();
    ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) * (fy == null ? 0.5 : fy), iw, ih);
    ctx.restore();
  }
  var FONT_D = '"Mystery Quest", Georgia, serif', FONT_B = '"Noto Sans KR", sans-serif';

  function makePNG(info) {
    var c = info.card, ct = info.content, Wc = 1080, Hc = 1920;
    var cw = 492, ch = Math.round(cw * 340.158 / 198.425), cy = 180, fx = 36, bx = 552;
    var fontsReady = Promise.all([
      document.fonts.load('40px "Mystery Quest"', "BIRTH ARCANA " + c.en.toUpperCase() + c.roman),
      document.fonts.load('500 40px "Noto Sans KR"', ct.result + info.zodiac.name + "창작 해석"),
      document.fonts.load('400 40px "Noto Sans KR"', info.zodiac.name)
    ]).catch(function () {});
    var frontP = hasFront(info)
      ? imageDataURL(ct.front).then(loadImage)
      : loadImage(svgSrc(sized(Art.frontPlaceholder(info.zodiac.id, c.num), cw * 2, ch * 2)));
    var bw = cw - 2 * Math.round(cw * 0.075), bh = Math.round(bw * 9 / 8);
    var backP = ct.back
      ? imageDataURL(ct.back).then(loadImage)
      : loadImage(svgSrc(sized(Art.backPlaceholder(info.zodiac.id), bw * 2, bh * 2)));
    var glyphP = loadImage(svgSrc(Art.glyphSVG(info.zodiac.id, "#6f6590", 96, 1.6)));

    return Promise.all([fontsReady, frontP, backP, glyphP]).then(function (r) {
      var frontImg = r[1], backImg = r[2], glyphImg = r[3];
      var cv = document.createElement("canvas"); cv.width = Wc; cv.height = Hc;
      var ctx = cv.getContext("2d");

      var g = ctx.createLinearGradient(0, 0, 0, Hc);
      g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#f2effb");
      ctx.fillStyle = g; ctx.fillRect(0, 0, Wc, Hc);

      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; ctx.fillStyle = "#3d3357";
      ctx.font = "46px " + FONT_D; setSpacing(ctx, "4px");
      ctx.fillText("BIRTH ARCANA", Wc / 2, 120);
      setSpacing(ctx, "0px");

      // 그림자
      [fx, bx].forEach(function (x) {
        ctx.save();
        ctx.shadowColor = "rgba(61,51,87,0.2)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
        roundRect(ctx, x, cy, cw, ch, 23); ctx.fillStyle = "#ffffff"; ctx.fill();
        ctx.restore();
      });

      // 앞면
      drawCover(ctx, frontImg, fx, cy, cw, ch, 23);
      if (!hasFront(info)) {
        ctx.fillStyle = "#3d3357"; ctx.font = Math.round(cw * 0.064) + "px " + FONT_D;
        ctx.textBaseline = "middle"; setSpacing(ctx, "1px");
        ctx.fillText(c.en.toUpperCase(), fx + cw / 2, cy + ch * 0.914);
        setSpacing(ctx, "0px"); ctx.textBaseline = "alphabetic";
      }

      // 뒷면
      roundRect(ctx, bx + 0.5, cy + 0.5, cw - 1, ch - 1, 23);
      ctx.fillStyle = "#ffffff"; ctx.fill(); ctx.strokeStyle = "#c3b8dc"; ctx.lineWidth = 2; ctx.stroke();
      var px = Math.round(cw * 0.075), ix = bx + px, iy = cy + Math.round(cw * 0.075);
      drawCover(ctx, backImg, ix, iy, bw, bh, Math.round(cw * 0.03), 0.45);
      var u = cw / 100, yy = iy + bh;
      ctx.fillStyle = "#3d3357"; ctx.font = Math.round(9 * u) + "px " + FONT_D; setSpacing(ctx, "1px");
      ctx.fillText(c.en.toUpperCase(), bx + cw / 2, yy + 13.5 * u);
      setSpacing(ctx, "0px");
      ctx.fillStyle = "#6f6590"; ctx.font = "400 " + Math.round(4 * u) + "px " + FONT_B;
      ctx.fillText(c.roman + "  " + info.zodiac.name, bx + cw / 2, yy + 20 * u);
      ctx.fillStyle = "#3d3357"; ctx.font = "500 " + (5.3 * u) + "px " + FONT_B;
      var bl = resultLines(ctx, ct.result, 80 * u), lh = 8.2 * u, mid = yy + 20 * u + (cy + ch - 6 * u - (yy + 20 * u)) / 2;
      bl.forEach(function (ln, i) { ctx.fillText(ln, bx + cw / 2, mid - (bl.length * lh) / 2 + lh * 0.75 + i * lh); });

      // 아래: 이름과 결과를 크게
      var ty = cy + ch + Math.round((Hc - 70 - (cy + ch) - 300) / 2) + 60;   // 카드 아래 남는 공간의 가운데
      ctx.fillStyle = "#3d3357"; ctx.font = "72px " + FONT_D; setSpacing(ctx, "3px");
      ctx.fillText(c.en.toUpperCase(), Wc / 2, ty);
      setSpacing(ctx, "0px");
      ctx.font = "400 32px " + FONT_B;
      var label = c.roman + "  " + info.zodiac.name, lw = ctx.measureText(label).width, gs = 38;
      ctx.drawImage(glyphImg, Wc / 2 - (gs + 10 + lw) / 2, ty + 36, gs, gs);
      ctx.fillStyle = "#6f6590"; ctx.textAlign = "left";
      ctx.fillText(label, Wc / 2 - (gs + 10 + lw) / 2 + gs + 10, ty + 66);
      ctx.textAlign = "center";
      ctx.fillStyle = "#3d3357"; ctx.font = "500 50px " + FONT_B;
      resultLines(ctx, ct.result, 860).forEach(function (ln, i) { ctx.fillText(ln, Wc / 2, ty + 170 + i * 76); });

      ctx.fillStyle = "rgba(111,101,144,0.75)"; ctx.font = "400 22px " + FONT_B;
      ctx.fillText("결과 문장은 카드의 상징을 바탕으로 쓴 창작 해석이에요", Wc / 2, Hc - 48);

      return new Promise(function (res) { cv.toBlob(res, "image/png"); });
    });
  }

  $("save").addEventListener("click", onSave);
  function onSave() {
    var info = state.info, btn = $("save");
    if (!info || !state.revealed) return;
    btn.disabled = true; btn.textContent = "저장 중…";
    var filename = "birth-arcana_" + info.card.roman + "_" + info.card.slug + ".png";
    makePNG(info).then(function (blob) {
      if (!blob) throw new Error("png");
      return downloadsP.then(function (dl) {
        if (dl) {
          return dl.save({ filename: filename, data: blob }).then(function () { return "saved"; }, function (err) {
            if (err && err.code === "declined") return "declined";
            if (err && err.code === "rate_limited") return "busy";
            return localSave(blob, filename);
          });
        }
        return localSave(blob, filename);
      });
    }).then(function (res) {
      toast(res === "declined" ? "저장을 취소했어요" : res === "busy" ? "잠시 후 다시 눌러 주세요" : "이미지를 저장했어요");
    }).catch(function () {
      toast("이미지를 만들지 못했어요. 다시 눌러 주세요");
    }).then(function () { btn.disabled = false; btn.textContent = "이미지 저장"; });
  }

  function localSave(blob, filename) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
    return "saved";
  }
})();
