(function () {
  "use strict";
  var Art = window.ByeolArt, L = window.ByeolLookup;
  var $ = function (id) { return document.getElementById(id); };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var monthSel = $("month"), daySel = $("day"), msg = $("form-msg");
  var intro = $("intro"), stage = $("stage");
  var card = $("card"), inner = $("card-inner"), front = $("face-front"), back = $("face-back");
  var hint = $("hint"), actions = $("actions"), explain = $("explain"), burst = $("burst"), announce = $("announce");

  var state = { info: null, flipped: false, busy: false };
  var uidSeq = 0;

  /* 뷰어의 파일 저장 기능 (claude.ai 안에서만 있다) */
  var downloadsP = (window.claude && typeof window.claude.use === "function")
    ? Promise.resolve(window.claude.use("downloads")).catch(function () { return null; })
    : Promise.resolve(null);

  /* ---------- 입력 ---------- */
  for (var m = 1; m <= 12; m++) monthSel.add(new Option(String(m), String(m)));
  function fillDays(keepDay) {
    var mm = parseInt(monthSel.value, 10);
    var max = mm ? window.BYEOL_DAYS_IN_MONTH[mm - 1] : 31;
    var prev = keepDay != null ? keepDay : parseInt(daySel.value, 10);
    daySel.length = 1;
    for (var d = 1; d <= max; d++) daySel.add(new Option(String(d), String(d)));
    if (prev && prev <= max) daySel.value = String(prev);
    else if (prev) {
      daySel.value = "";
      setMsg(mm + "월은 " + max + "일까지 있어. 날짜를 다시 골라줘.");
    }
    syncEmpty();
  }
  function syncEmpty() {
    monthSel.classList.toggle("empty", !monthSel.value);
    daySel.classList.toggle("empty", !daySel.value);
  }
  function setMsg(t) { msg.textContent = t || ""; }
  fillDays();
  monthSel.addEventListener("change", function () { setMsg(""); fillDays(); });
  daySel.addEventListener("change", function () { setMsg(""); syncEmpty(); });

  Array.prototype.forEach.call(document.querySelectorAll(".chip"), function (b) {
    b.addEventListener("click", function () {
      monthSel.value = b.dataset.m;
      fillDays(parseInt(b.dataset.d, 10));
      setMsg("");
    });
  });

  $("birth-form").addEventListener("submit", function (e) {
    e.preventDefault();
    var mm = parseInt(monthSel.value, 10), dd = parseInt(daySel.value, 10);
    if (!mm || !dd) { setMsg("월과 일을 모두 골라줘."); return; }
    if (!L.isValidMonthDay(mm, dd)) { setMsg("그런 날짜는 없어. 다시 골라줘."); return; }
    var info = L.lookup(mm, dd);
    if (!info) { setMsg("별자리를 찾지 못했어. 날짜를 다시 확인해줘."); return; }
    showCard(info);
  });

  $("back").addEventListener("click", function () {
    stage.hidden = true; stage.classList.remove("shown");
    intro.hidden = false;
    state.info = null;
    $("find").focus();
  });

  /* ---------- 미니 카드 부채 (첫 화면 장식) ---------- */
  (function () {
    var tints = [["#a6d9c8", "#e2f3ed"], ["#b7adcd", "#ece7f4"], ["#9ecbe7", "#e3f1f9"]];
    $("fan").innerHTML = tints.map(function (t) {
      return '<div class="mini">' + Art.frameSVG({ uid: "fan" + (uidSeq++), accent: t[0], pale: t[1], backDeco: true }) + "</div>";
    }).join("");
  })();

  /* ---------- 카드 만들기 ---------- */
  function palette(info) {
    return info.content ? info.content.palette : { accent: "#cfc6de", pale: "#f1edf6" };
  }

  /* 일러스트: 이미지 파일 > 직접 그린 그림 > 준비 중 그림 */
  function hasArt(info) { return !!(info.content && (info.content.image || Art.has(info.content.art))); }
  function artMarkup(info, imageHref) {
    var p = palette(info), ct = info.content;
    if (ct && ct.image) {
      return '<rect width="224" height="356" fill="#f6f3f9"/><image href="' + (imageHref || ct.image) +
        '" x="0" y="0" width="224" height="356" preserveAspectRatio="xMidYMid slice"/>';
    }
    return Art.art(ct ? ct.art : null, p.accent);
  }
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

  function buildFront(info) {
    var p = palette(info), c = info.card;
    var art = artMarkup(info);
    var html = Art.frameSVG({ uid: "f" + (uidSeq++), accent: p.accent, pale: p.pale, art: art, glyph: info.zodiac.id });
    html += '<span class="f-num">' + c.roman + "</span>";
    if (!hasArt(info)) {
      html += '<span class="f-pending"><span class="p-num">' + c.roman + '</span><span class="p-name">' + c.name +
        '</span><span class="p-tag">일러스트 준비 중</span></span>';
    }
    front.innerHTML = html;
  }

  function buildBack(info) {
    var p = palette(info), c = info.card;
    var html = Art.frameSVG({ uid: "b" + (uidSeq++), accent: p.accent, pale: p.pale, backDeco: true, glyph: info.zodiac.id, seal: false, mirror: true });
    html += '<span class="b-content">' +
      '<span class="b-head"><span class="b-num">' + c.roman + '</span><span class="b-name">' + c.name + "</span></span>" +
      '<span class="b-sign">' + Art.glyphSVG(info.zodiac.id, "#4b4068", 20, 1.7) + "<span>" + info.zodiac.name + "</span></span>" +
      '<svg class="b-div" viewBox="0 0 100 12" aria-hidden="true"><path d="M0 6H40M60 6H100" stroke="currentColor" stroke-width="0.8"/>' +
      Art.sparkle(50, 6, 5.5, "#fffbea", "currentColor", 0.8) + "</svg>" +
      '<span class="b-label">내 운이 열리는 순간</span>' +
      '<span class="b-result" id="b-result"></span>' +
      "</span>" +
      '<span class="b-foot">별의 서고</span>';
    back.innerHTML = html;
  }

  function showCard(info) {
    state.info = info; state.flipped = false; state.revealed = false; state.busy = false;
    intro.hidden = true; stage.hidden = false;
    window.scrollTo(0, 0);

    card.style.setProperty("--accent", palette(info).accent);
    card.className = "card";
    inner.getAnimations && inner.getAnimations().forEach(function (a) { a.cancel(); });
    inner.style.transform = "";
    burst.innerHTML = "";
    $("toast").classList.remove("show");
    actions.hidden = true;
    explain.hidden = true;
    announce.textContent = "";

    buildFront(info);
    buildBack(info);

    var c = info.card;
    $("chain-mini").textContent = info.month + "월 " + info.day + "일 · " + info.zodiac.name;
    card.setAttribute("aria-label", info.content ? c.roman + " " + c.name + " 카드. 눌러서 뒤집기" : c.roman + " " + c.name + " 카드, 준비 중");

    if (info.content) {
      hint.textContent = "카드를 톡 눌러봐";
      hint.className = "hint";
    } else {
      hint.textContent = c.roman + " " + c.name + " 카드는 아직 그리는 중이야";
      hint.className = "hint";
      renderExplain(info);
      explain.hidden = false;
    }

    // 등장
    void card.offsetWidth;
    requestAnimationFrame(function () {
      stage.classList.add("shown");
      card.classList.add("enter");
      setTimeout(function () {
        if (state.info !== info) return;
        card.classList.remove("enter");
        if (!state.flipped) card.classList.add("float");
        if (info.content && !state.flipped) hint.classList.add("pulse");
      }, reduceMotion ? 0 : 1000);
    });
  }

  /* ---------- 뒤집기 ---------- */
  card.addEventListener("click", function () {
    var info = state.info;
    if (!info || state.busy) return;
    if (!info.content) {
      card.classList.remove("nudge"); void card.offsetWidth; card.classList.add("nudge");
      return;
    }
    if (!state.revealed) flip(info);
    else turn(info, !state.flipped);
  });

  function fillResult(info) {
    var box = $("b-result");
    box.innerHTML = "";
    var el = document.createElement("span");
    el.className = "b-text";
    box.appendChild(el);
    info.content.result.split(" ").forEach(function (word, i, arr) {
      var s = document.createElement("span");
      s.className = "w"; s.style.setProperty("--i", i);
      s.textContent = word;
      el.appendChild(s);
      if (i < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return box;
  }

  function flip(info) {
    state.busy = true; state.flipped = true;
    hint.classList.remove("pulse");
    hint.style.opacity = "0";
    card.classList.remove("float", "enter");
    var resultEl = fillResult(info);   // 결과 문장은 탭한 뒤에야 문서에 들어간다

    if (reduceMotion) {
      inner.style.transform = "rotateY(180deg)";
      card.querySelectorAll(".rs").forEach(function (r) { r.classList.add("on"); });
      return done();
    }

    card.classList.add("flipping", "lighting");
    var anim = inner.animate([
      { transform: "translateY(0) rotateY(0deg) scale(1)", easing: "cubic-bezier(.3,.7,.4,1)" },
      { transform: "translateY(-30px) rotateY(-10deg) scale(1.045)", offset: 0.2, easing: "cubic-bezier(.55,0,.25,1)" },
      { transform: "translateY(-16px) rotateY(192deg) scale(1.04)", offset: 0.72, easing: "cubic-bezier(.3,0,.3,1)" },
      { transform: "translateY(-3px) rotateY(176deg) scale(1.01)", offset: 0.86, easing: "ease-in-out" },
      { transform: "translateY(0) rotateY(180deg) scale(1)" }
    ], { duration: 1250, fill: "forwards" });

    anim.onfinish = function () {
      inner.style.transform = "rotateY(180deg)";
      anim.cancel();
      card.classList.remove("flipping");
      card.classList.add("pop");
      popStars();
      setTimeout(done, 140);
    };

    function done() {
      resultEl.classList.add("shown");
      announce.textContent = info.content.result;
      setTimeout(function () {
        state.busy = false;
        card.classList.remove("pop");
        state.revealed = true;
        hint.textContent = "다시 누르면 앞면을 볼 수 있어";
        hint.style.opacity = "";
        renderExplain(info);
        explain.hidden = false;
        actions.hidden = false;
        card.setAttribute("aria-label", info.card.roman + " " + info.card.name + " 카드 뒷면. " + info.content.result);
        card.classList.add("float");
      }, reduceMotion ? 0 : 900);
    }
  }

  /* 결과를 연 뒤: 누를 때마다 앞면 ↔ 뒷면 */
  function turn(info, toBack) {
    state.busy = true;
    card.classList.remove("float", "pop");
    var from = toBack ? 0 : 180, to = toBack ? 180 : 360;
    function end() {
      state.flipped = toBack;
      inner.style.transform = toBack ? "rotateY(180deg)" : "";
      hint.textContent = toBack ? "다시 누르면 앞면을 볼 수 있어" : "다시 누르면 뒷면을 볼 수 있어";
      card.setAttribute("aria-label", info.card.roman + " " + info.card.name + (toBack ? " 카드 뒷면. " + info.content.result : " 카드 앞면. 눌러서 뒷면 보기"));
      card.classList.add("float");
      state.busy = false;
    }
    if (reduceMotion) return end();
    var anim = inner.animate([
      { transform: "translateY(0) rotateY(" + from + "deg) scale(1)", easing: "cubic-bezier(.3,.7,.4,1)" },
      { transform: "translateY(-18px) rotateY(" + (from + 90) + "deg) scale(1.03)", offset: 0.45, easing: "cubic-bezier(.3,0,.3,1)" },
      { transform: "translateY(-4px) rotateY(" + (to + 6) + "deg) scale(1.01)", offset: 0.8, easing: "ease-in-out" },
      { transform: "translateY(0) rotateY(" + to + "deg) scale(1)" }
    ], { duration: 720, fill: "forwards" });
    anim.onfinish = function () { end(); anim.cancel(); };
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

    // 빛 테
    var wave = add("wave", cx, cy, r.width, r.height);
    wave.style.borderRadius = (r.width * 0.057) + "px";
    wave.animate([{ transform: "scale(1)", opacity: 0.9 }, { transform: "scale(1.16, 1.1)", opacity: 0 }],
      { duration: 700, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });

    // 작은 별 세 개
    var three = [
      { ax: -0.55, ay: -1, dx: -54, dy: -44, size: 30, fill: "#cdeee2", rot: -40 },
      { ax: 0.08, ay: -1.04, dx: 6, dy: -64, size: 24, fill: "#fffbea", rot: 30 },
      { ax: 0.62, ay: -0.94, dx: 58, dy: -36, size: 34, fill: "#cfe6f5", rot: 55 }
    ];
    three.forEach(function (s, i) {
      var x = cx + s.ax * hw, y = cy + s.ay * hh;
      var el = add("star", x, y, s.size, s.size,
        '<svg viewBox="-12 -12 24 24">' + Art.sparkle(0, 0, 11, s.fill, "#7a6aa8", 1.1) + '<circle r="2" fill="#ffffff"/></svg>');
      el.animate([
        { transform: "translate(0,0) scale(0) rotate(0deg)", opacity: 1 },
        { transform: "translate(" + s.dx * 0.6 + "px," + s.dy * 0.6 + "px) scale(1.25) rotate(" + s.rot * 0.6 + "deg)", opacity: 1, offset: 0.35 },
        { transform: "translate(" + s.dx + "px," + s.dy + "px) scale(0.9) rotate(" + s.rot + "deg)", opacity: 1, offset: 0.7 },
        { transform: "translate(" + s.dx * 1.08 + "px," + (s.dy * 1.08 + 10) + "px) scale(0.2) rotate(" + s.rot * 1.2 + "deg)", opacity: 0 }
      ], { duration: 1150, delay: i * 60, easing: "cubic-bezier(.15,.8,.3,1)", fill: "both" });
    });

    // 빛 알갱이: 카드 가장자리에서 바깥으로
    var n = 16;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2 + (i % 2 ? 0.12 : -0.08);
      var ex = Math.sin(a), ey = -Math.cos(a);
      var k = 1 / Math.max(Math.abs(ex) / hw, Math.abs(ey) / hh);   // 카드 사각형과 만나는 거리
      var x = cx + ex * k * 0.96, y = cy + ey * k * 0.96;
      var size = i % 3 === 0 ? 7 : 4;
      var dist = 26 + (i % 4) * 9;
      var el = add(i % 3 === 0 ? "star" : "dot", x, y, size * (i % 3 === 0 ? 2 : 1), size * (i % 3 === 0 ? 2 : 1),
        i % 3 === 0 ? '<svg viewBox="-12 -12 24 24">' + Art.sparkle(0, 0, 11, "#ffffff", "#7a6aa8", 1.2) + "</svg>" : "");
      el.animate([
        { transform: "translate(0,0) scale(.3)", opacity: 0 },
        { transform: "translate(" + ex * dist * 0.5 + "px," + ey * dist * 0.5 + "px) scale(1.2)", opacity: 1, offset: 0.25 },
        { transform: "translate(" + ex * dist + "px," + ey * dist + "px) scale(.4)", opacity: 0 }
      ], { duration: 820 + (i % 5) * 60, delay: 30 + (i % 4) * 25, easing: "cubic-bezier(.2,.8,.3,1)", fill: "both" });
    }
    setTimeout(function () { burst.innerHTML = ""; }, 1500);
  }

  /* ---------- 카드 아래 설명 박스 ---------- */
  function fmt(md) { return md[0] + "월 " + md[1] + "일"; }
  function renderExplain(info) {
    var z = info.zodiac, c = info.card;
    $("why-chain").innerHTML =
      '<li><span class="node">' + info.month + "월 " + info.day + "일</span></li>" +
      '<li><span class="arrow" aria-hidden="true">→</span><span class="node">' + Art.glyphSVG(z.id, "#4b4068", 16, 1.8) + z.name + "</span></li>" +
      '<li><span class="arrow" aria-hidden="true">→</span><span class="node"><span class="rn">' + c.roman + "</span>" + c.name + "</span></li>";
    $("why-chain").setAttribute("aria-label", info.month + "월 " + info.day + "일, " + z.name + ", " + c.roman + " " + c.name);
    $("why-range").textContent = z.name + " 구간: " + fmt(z.start) + " ~ " + fmt(z.end);
    var notes = [];
    if (info.boundary) {
      notes.push('<li class="warn">' + info.month + "월 " + info.day + "일은 " + z.name + "가 시작되거나 끝나는 경계일이에요. 실제 별자리는 태어난 해와 시각에 따라 이웃 별자리일 수도 있어요.</li>");
    }
    notes.push("<li>별자리 날짜는 프로토타입용 간이 기준이에요. 실제 경계일은 해마다 하루쯤 달라질 수 있어요.</li>");
    notes.push("<li>별자리와 카드의 짝은 알레이스터 크롤리의 <cite>《A Treatise on Astrology》</cite>에 실린 대응을 따랐어요. 번호와 이름은 라이더–웨이트–스미스 덱 기준이에요.</li>");
    notes.push(info.content
      ? "<li>결과 문장은 별의 서고가 카드의 상징을 바탕으로 쓴 창작 해석이에요.</li>"
      : "<li>" + c.name + " 카드의 그림과 결과 문장은 아직 준비 중이에요.</li>");
    $("why-notes").innerHTML = notes.join("");
  }

  /* ---------- 카드 저장 (세로 PNG) ---------- */
  var toastTimer;
  function toast(t) {
    var el = $("toast"); el.textContent = t; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
  }

  function loadImage(svg) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

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

  function makePNG(info) {
    var c = info.card, p = info.content.palette, Wc = 1080, Hc = 1920;
    var fontsReady = Promise.all([
      document.fonts.load('700 60px "Gowun Batang"', info.content.result + c.name + "내 운이 열리는 순간별의 서고"),
      document.fonts.load('400 34px "Gowun Dodum"', info.zodiac.name + "창작 해석"),
      document.fonts.load('600 52px "Cormorant Garamond"', c.roman)
    ]).catch(function () {});
    var artP = info.content.image ? imageDataURL(info.content.image).then(function (d) { return artMarkup(info, d); }) : Promise.resolve(artMarkup(info));
    var backSvg = Art.frameSVG({ uid: "pb", accent: p.accent, pale: p.pale, backDeco: true, glyph: info.zodiac.id, seal: false, lit: true, width: 960, height: 1680 });
    var glyph = Art.glyphSVG(info.zodiac.id, "#7a6aa8", 96, 1.6);

    var frontP = artP.then(function (art) {
      return loadImage(Art.frameSVG({ uid: "pf", accent: p.accent, pale: p.pale, art: art, glyph: info.zodiac.id, lit: true, width: 960, height: 1680 }));
    });
    return Promise.all([fontsReady, frontP, loadImage(backSvg), loadImage(glyph)]).then(function (r) {
      var frontImg = r[1], backImg = r[2], glyphImg = r[3];
      var cv = document.createElement("canvas"); cv.width = Wc; cv.height = Hc;
      var ctx = cv.getContext("2d");

      // 바탕: 흐린 라일락 + 작은 별
      var g = ctx.createLinearGradient(0, 0, 0, Hc);
      g.addColorStop(0, "#f6f3fa"); g.addColorStop(0.5, "#efeaf6"); g.addColorStop(1, "#f8f6fb");
      ctx.fillStyle = g; ctx.fillRect(0, 0, Wc, Hc);
      var rg = ctx.createRadialGradient(540, 700, 40, 540, 700, 620);
      rg.addColorStop(0, "rgba(255,255,255,0.95)"); rg.addColorStop(0.5, "rgba(207,230,245,0.35)"); rg.addColorStop(1, "rgba(240,236,246,0)");
      ctx.fillStyle = rg; ctx.fillRect(0, 0, Wc, Hc);
      var seed = 11;
      function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
      for (var i = 0; i < 70; i++) {
        ctx.globalAlpha = 0.35 + rnd() * 0.5; ctx.fillStyle = i % 4 ? "#ffffff" : "#c9bfdc";
        ctx.beginPath(); ctx.arc(rnd() * Wc, rnd() * Hc, 1 + rnd() * 2.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#7a6aa8";
      ctx.font = '700 32px "Gowun Batang", serif';
      setSpacing(ctx, "6px");
      ctx.fillText("별의 서고", 540, 108);
      setSpacing(ctx, "0px");

      // 앞면과 뒷면을 나란히
      var cw = 480, ch = 840, cy = 160, fx = 40, bx = 560;
      [fx, bx].forEach(function (x) {
        ctx.save();
        ctx.shadowColor = "rgba(90,76,130,0.22)"; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
        roundRect(ctx, x + 2, cy + 2, cw - 4, ch - 4, 27); ctx.fillStyle = "#fcf9f4"; ctx.fill();
        ctx.restore();
      });
      ctx.drawImage(frontImg, fx, cy, cw, ch);
      ctx.drawImage(backImg, bx, cy, cw, ch);
      var k = cw / 280;
      // 앞면 명판의 번호
      ctx.fillStyle = "#4b4068"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.font = "600 " + (15.7 * k) + 'px "Cormorant Garamond", Georgia, serif';
      setSpacing(ctx, (2.8 * k) + "px");
      ctx.fillText(c.roman, fx + cw / 2 + 1.4 * k, cy + 452 * k + 1);
      setSpacing(ctx, "0px");
      if (!hasArt(info)) {
        ctx.fillStyle = "#7a6aa8"; ctx.font = "600 " + (16.8 * k) + 'px "Cormorant Garamond", Georgia, serif';
        ctx.textBaseline = "alphabetic";
        setSpacing(ctx, (2.2 * k) + "px");
        ctx.fillText(c.roman, fx + cw / 2, cy + 152 * k);
        setSpacing(ctx, "0px");
        ctx.fillStyle = "#4b4068"; ctx.font = "700 " + (22.4 * k) + 'px "Gowun Batang", serif';
        ctx.fillText(c.name, fx + cw / 2, cy + 182 * k);
      }
      drawBackText(ctx, info, bx, cy, k, glyphImg);
      ctx.textBaseline = "alphabetic"; ctx.textAlign = "center";
      ctx.fillStyle = "#8f84ad"; ctx.font = '400 24px "Gowun Dodum", sans-serif';
      setSpacing(ctx, "4px");
      ctx.fillText("앞면", fx + cw / 2, cy + ch + 52);
      ctx.fillText("뒷면", bx + cw / 2, cy + ch + 52);
      setSpacing(ctx, "0px");

      // 번호와 이름
      var y = 1190;
      ctx.font = '600 54px "Cormorant Garamond", Georgia, serif';
      var numW = ctx.measureText(c.roman).width;
      ctx.font = '700 54px "Gowun Batang", serif';
      var nameW = ctx.measureText(c.name).width, gap = 22, total = numW + gap + nameW;
      ctx.textAlign = "left";
      ctx.fillStyle = "#7a6aa8"; ctx.font = '600 54px "Cormorant Garamond", Georgia, serif';
      ctx.fillText(c.roman, 540 - total / 2, y);
      ctx.fillStyle = "#4b4068"; ctx.font = '700 54px "Gowun Batang", serif';
      ctx.fillText(c.name, 540 - total / 2 + numW + gap, y);

      // 별자리 문양
      ctx.font = '400 34px "Gowun Dodum", sans-serif';
      var zw = ctx.measureText(info.zodiac.name).width, gs = 46, total2 = gs + 12 + zw;
      ctx.drawImage(glyphImg, 540 - total2 / 2, 1238, gs, gs);
      ctx.fillStyle = "#7a6aa8";
      ctx.fillText(info.zodiac.name, 540 - total2 / 2 + gs + 12, 1273);

      // 구분선
      ctx.strokeStyle = "rgba(122,106,168,0.5)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(400, 1340); ctx.lineTo(520, 1340); ctx.moveTo(560, 1340); ctx.lineTo(680, 1340); ctx.stroke();
      drawSparkle(ctx, 540, 1340, 10);

      // 결과 한 줄
      ctx.textAlign = "center";
      ctx.fillStyle = "#8f84ad"; ctx.font = '400 28px "Gowun Dodum", sans-serif';
      setSpacing(ctx, "4px");
      ctx.fillText("내 운이 열리는 순간", 540, 1410);
      setSpacing(ctx, "0px");
      ctx.fillStyle = "#4b4068"; ctx.font = '700 60px "Gowun Batang", serif';
      balanced(ctx, info.content.result, 880).forEach(function (ln, idx) { ctx.fillText(ln, 540, 1510 + idx * 90); });

      ctx.fillStyle = "rgba(122,106,168,0.7)"; ctx.font = '400 22px "Gowun Dodum", sans-serif';
      ctx.fillText("결과 문장은 별의 서고의 창작 해석이에요", 540, 1880);

      return new Promise(function (res) { cv.toBlob(res, "image/png"); });
    });
  }
  function balanced(ctx, text, maxW) {
    var lines = wrapLines(ctx, text, maxW), w = maxW;
    while (w > 40 && wrapLines(ctx, text, w - 4).length === lines.length) w -= 4;
    return wrapLines(ctx, text, w);
  }

  /* PNG 뒷면 글자: 화면 뒷면과 같은 배치 (카드 280 × 490 좌표 × k) */
  function drawBackText(ctx, info, x, y, k, glyphImg) {
    var c = info.card, cx = x + 140 * k;
    ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
    ctx.font = "600 " + (17.4 * k) + 'px "Cormorant Garamond", Georgia, serif';
    setSpacing(ctx, (2.4 * k) + "px");
    var nw = ctx.measureText(c.roman).width;
    setSpacing(ctx, "0px");
    ctx.font = "700 " + (17.4 * k) + 'px "Gowun Batang", serif';
    var mw = ctx.measureText(c.name).width, g = 6.7 * k, tw = nw + g + mw;
    ctx.fillStyle = "#7a6aa8"; ctx.font = "600 " + (17.4 * k) + 'px "Cormorant Garamond", Georgia, serif';
    setSpacing(ctx, (2.4 * k) + "px");
    ctx.fillText(c.roman, cx - tw / 2, y + 104 * k);
    setSpacing(ctx, "0px");
    ctx.fillStyle = "#4b4068"; ctx.font = "700 " + (17.4 * k) + 'px "Gowun Batang", serif';
    ctx.fillText(c.name, cx - tw / 2 + nw + g, y + 104 * k);

    ctx.font = "400 " + (11.5 * k) + 'px "Gowun Dodum", sans-serif';
    var zw = ctx.measureText(info.zodiac.name).width, gs = 15.7 * k, t2 = gs + 4 * k + zw;
    ctx.drawImage(glyphImg, cx - t2 / 2, y + 113 * k, gs, gs);
    ctx.fillStyle = "#7a6aa8";
    ctx.fillText(info.zodiac.name, cx - t2 / 2 + gs + 4 * k, y + 125 * k);

    ctx.strokeStyle = "rgba(122,106,168,0.7)"; ctx.lineWidth = 0.5 * k;
    ctx.beginPath(); ctx.moveTo(cx - 33 * k, y + 141 * k); ctx.lineTo(cx - 6 * k, y + 141 * k);
    ctx.moveTo(cx + 6 * k, y + 141 * k); ctx.lineTo(cx + 33 * k, y + 141 * k); ctx.stroke();
    drawSparkle(ctx, cx, y + 141 * k, 3.6 * k);

    ctx.textAlign = "center";
    ctx.fillStyle = "#8f84ad"; ctx.font = "400 " + (10.4 * k) + 'px "Gowun Dodum", sans-serif';
    setSpacing(ctx, (1.2 * k) + "px");
    ctx.fillText("내 운이 열리는 순간", cx, y + 166 * k);
    setSpacing(ctx, "0px");

    ctx.fillStyle = "#4b4068"; ctx.font = "700 " + (21.3 * k) + 'px "Gowun Batang", serif';
    var lines = balanced(ctx, info.content.result, 196 * k), lh = 32.4 * k;
    var top = y + 272 * k - (lines.length * lh) / 2 + 21.3 * k * 0.8;
    lines.forEach(function (ln, i) { ctx.fillText(ln, cx, top + i * lh); });

    ctx.textBaseline = "middle"; ctx.fillStyle = "#4b4068"; ctx.font = "400 " + (10 * k) + 'px "Gowun Batang", serif';
    setSpacing(ctx, (1.4 * k) + "px");
    ctx.fillText("별의 서고", cx + 0.7 * k, y + 452 * k + 1);
    setSpacing(ctx, "0px");
  }

  function setSpacing(ctx, v) { if ("letterSpacing" in ctx) ctx.letterSpacing = v; }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function drawSparkle(ctx, x, y, r) {
    var k = r * 0.22;
    ctx.beginPath(); ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x + k, y - k, x + r, y); ctx.quadraticCurveTo(x + k, y + k, x, y + r);
    ctx.quadraticCurveTo(x - k, y + k, x - r, y); ctx.quadraticCurveTo(x - k, y - k, x, y - r);
    ctx.fillStyle = "#fffbea"; ctx.fill(); ctx.strokeStyle = "#7a6aa8"; ctx.lineWidth = 1.5; ctx.stroke();
  }

  $("save").addEventListener("click", function () {
    var info = state.info, btn = this;
    if (!info || !info.content || !state.revealed) return;
    btn.disabled = true; btn.textContent = "저장 중…";
    var filename = "byeol-seogo_" + info.card.roman + "_" + info.card.slug + ".png";
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
      toast(res === "declined" ? "저장을 취소했어" : res === "busy" ? "잠시 뒤에 다시 눌러줘" : "이미지를 저장했어");
    }).catch(function () {
      toast("이미지를 만들지 못했어. 다시 눌러줘");
    }).then(function () { btn.disabled = false; btn.textContent = "이미지 저장"; });
  });

  function localSave(blob, filename) {
    var url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = filename; a.rel = "noopener"; a.style.display = "none";
    document.body.appendChild(a); a.click();
    setTimeout(function () { a.remove(); URL.revokeObjectURL(url); }, 4000);
    return "saved";
  }
})();
