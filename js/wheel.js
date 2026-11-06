/*
 * 휠 피커 한 열
 * - 휴대폰: 손가락으로 밀면 스크롤되고, 멈추면 가운데 칸에 맞춰 선다 (scroll-snap)
 * - 데스크톱: 마우스 휠 한 칸에 한 칸씩, 마우스로 끌기, 키보드 ↑↓ PageUp/PageDown Home/End
 * - 가운데에 멈춘 값이 선택값. 가운데에서 멀수록 옅고 작게 보인다.
 *
 * var w = ByeolWheel(el, { items: [{ value: 1, label: "1월" }, ...], value: 1, label: "태어난 달", onChange: fn })
 * w.value()          현재 값
 * w.set(v, smooth)   값으로 굴리기
 * w.setItems(items, v)  항목 바꾸기 (일 수가 달라질 때)
 * w.refresh()        화면에 보이게 된 뒤 위치 다시 맞추기
 */
(function (root) {
  var VISIBLE = 5;   // 보이는 줄 수 (가운데 1 + 위아래 2)

  function ByeolWheel(el, opts) {
    var items = opts.items, index = 0, rowH = 44, raf = 0, settleTimer = 0;
    var dragging = null, wheelAcc = 0;
    var seeking = -1;   // 키·휠로 굴리는 중이면 목표 칸. 도착할 때까지 중간 칸을 값으로 읽지 않는다

    el.classList.add("wheel");
    el.innerHTML = '<ul class="wheel-list" aria-hidden="true"></ul>';   // 가운데 띠는 바깥 .wheel-frame 이 그린다
    var list = el.querySelector(".wheel-list");
    el.setAttribute("role", "spinbutton");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-label", opts.label || "");

    function build() {
      list.innerHTML = items.map(function (it, i) {
        return '<li class="wheel-item" data-i="' + i + '">' + it.label + "</li>";
      }).join("");
    }
    function measure() {
      var li = list.firstElementChild;
      if (li && li.offsetHeight) rowH = li.offsetHeight;
      el.style.setProperty("--row", rowH + "px");
    }
    function clamp(i) { return Math.max(0, Math.min(items.length - 1, i)); }
    function indexOfValue(v) {
      for (var i = 0; i < items.length; i++) if (items[i].value === v) return i;
      return -1;
    }
    function aria() {
      el.setAttribute("aria-valuemin", items[0].value);
      el.setAttribute("aria-valuemax", items[items.length - 1].value);
      el.setAttribute("aria-valuenow", items[index].value);
      el.setAttribute("aria-valuetext", items[index].label);
    }
    function paint() {
      raf = 0;
      var pos = el.scrollTop / rowH;
      var kids = list.children;
      for (var i = 0; i < kids.length; i++) {
        var d = i - pos, a = Math.abs(d);
        kids[i].style.opacity = Math.max(0.18, 1 - a * 0.36).toFixed(3);
        kids[i].style.transform = "rotateX(" + (-d * 16).toFixed(2) + "deg) scale(" + Math.max(0.82, 1 - a * 0.07).toFixed(3) + ")";
        kids[i].classList.toggle("is-selected", a < 0.5);
      }
      if (seeking >= 0) {
        if (Math.abs(el.scrollTop - seeking * rowH) < 1) seeking = -1;
        return;
      }
      var i2 = clamp(Math.round(pos));
      if (i2 !== index) { index = i2; aria(); if (opts.onChange) opts.onChange(items[index].value); }
    }
    function schedule() { if (!raf) raf = requestAnimationFrame(paint); }
    // silent: 프로그램이 맞추는 이동(일 수 조정 등)은 onChange 를 부르지 않는다
    function go(i, smooth, silent) {
      i = clamp(i);
      var changed = i !== index;
      index = i; aria();
      seeking = smooth ? i : -1;
      el.scrollTo({ top: i * rowH, behavior: smooth ? "smooth" : "auto" });
      schedule();
      if (changed && !silent && opts.onChange) opts.onChange(items[index].value);
    }
    function userTouch() { seeking = -1; }
    el.addEventListener("touchstart", userTouch, { passive: true });

    el.addEventListener("scroll", function () {
      schedule();
      clearTimeout(settleTimer);
      // 스크롤이 멈추면 가장 가까운 칸에 정확히 맞춘다 (snap을 못 쓰는 환경 대비)
      settleTimer = setTimeout(function () {
        if (dragging) return;
        if (seeking >= 0) { seeking = -1; schedule(); }
        var target = clamp(Math.round(el.scrollTop / rowH)) * rowH;
        if (Math.abs(el.scrollTop - target) > 1) el.scrollTo({ top: target, behavior: "smooth" });
      }, 140);
    }, { passive: true });

    // 마우스 휠: 한 칸씩
    el.addEventListener("wheel", function (e) {
      e.preventDefault();
      wheelAcc += e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(wheelAcc) >= 30) {
        go(index + (wheelAcc > 0 ? 1 : -1), true);
        wheelAcc = 0;
      }
    }, { passive: false });

    // 마우스로 끌기 (손가락은 기본 스크롤을 쓴다)
    el.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      seeking = -1;
      dragging = { y: e.clientY, top: el.scrollTop, moved: false };
      el.classList.add("is-dragging");
      el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var dy = e.clientY - dragging.y;
      if (Math.abs(dy) > 3) dragging.moved = true;
      el.scrollTop = dragging.top - dy;
    });
    function endDrag(e) {
      if (!dragging) return;
      var moved = dragging.moved;
      dragging = null;
      el.classList.remove("is-dragging");
      if (moved) go(Math.round(el.scrollTop / rowH), true);
      else if (e && e.target.closest) {
        var li = e.target.closest(".wheel-item");   // 칸을 누르면 그 값으로
        if (li) go(+li.dataset.i, true);
      }
    }
    el.addEventListener("pointerup", endDrag);
    el.addEventListener("pointercancel", endDrag);

    // 손가락으로 칸을 톡 누르면 그 값으로
    el.addEventListener("click", function (e) {
      var li = e.target.closest && e.target.closest(".wheel-item");
      if (li && e.pointerType !== "mouse") go(+li.dataset.i, true);
    });

    // 키보드
    el.addEventListener("keydown", function (e) {
      var k = e.key, step = { ArrowDown: 1, ArrowUp: -1, PageDown: 5, PageUp: -5 }[k];
      if (step) { e.preventDefault(); go(index + step, true); }
      else if (k === "Home") { e.preventDefault(); go(0, true); }
      else if (k === "End") { e.preventDefault(); go(items.length - 1, true); }
    });

    build();
    var api = {
      value: function () { return items[index].value; },
      set: function (v, smooth) { var i = indexOfValue(v); if (i >= 0) go(i, smooth, true); },
      setItems: function (next, v) {
        items = next;
        build(); measure();
        var i = indexOfValue(v);
        go(i >= 0 ? i : clamp(index), false, true);
      },
      refresh: function () { measure(); go(index, false, true); }
    };
    var start = indexOfValue(opts.value);
    index = start >= 0 ? start : 0;
    aria();
    requestAnimationFrame(function () { api.refresh(); });
    return api;
  }

  ByeolWheel.VISIBLE = VISIBLE;
  root.ByeolWheel = ByeolWheel;
})(window);
