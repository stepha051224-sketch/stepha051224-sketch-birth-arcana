// 휴대폰 화면 확인: 첫 화면 → 월·일 휠 → 카드 앞면 → 뒤집기 → 카드 해석 → 이미지 저장 → 다른 생일로 보기
// 사용법: NODE_PATH=$(npm root -g) node tools/check-mobile.js <스크린샷 폴더> [주소]
const { chromium, devices } = require("playwright");
const fs = require("fs");
const OUT = process.argv[2] || "shots";
const URL = process.argv[3] || "http://localhost:8765/";

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  let fails = 0; const ok = (c, m) => { console.log(c ? "PASS" : "FAIL", m); if (!c) fails++; };
  const cdp = await ctx.newCDPSession(page);

  const wheelVal = sel => page.$eval(sel, el => +el.getAttribute("aria-valuenow"));
  const selectedText = sel => page.$eval(sel, el => (el.querySelector(".wheel-item.is-selected") || {}).textContent);
  const settle = () => page.waitForTimeout(650);
  const press = async (sel, key, n = 1) => { await page.focus(sel); for (let i = 0; i < n; i++) { await page.keyboard.press(key); await page.waitForTimeout(60); } await settle(); };
  const setWheels = async (m, d) => {
    await press("#month-wheel", "Home"); await press("#month-wheel", "ArrowDown", m - 1);
    await press("#day-wheel", "Home"); await press("#day-wheel", "ArrowDown", d - 1);
  };
  const face = () => page.evaluate(() => { const m = getComputedStyle(document.getElementById("card-inner")).transform; return m === "none" ? "front" : (new DOMMatrix(m).m11 < 0 ? "back" : "front"); });
  const waitRevealed = () => page.waitForFunction(() => !document.getElementById("actions").hidden, null, { timeout: 6000 });

  // 01 첫 화면
  await page.goto(URL); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/01-home.png` });
  ok((await page.textContent("#intro")).includes("열두 별자리와 타로를 연결하는 상징 체계"), "첫 화면: 서비스 소개 문구");
  ok(!(await page.$eval("#faq", el => el.open)), "첫 화면: ‘카드는 어떻게 정해지나요?’는 접혀 있음");
  await page.click("#faq summary");
  const faq = await page.textContent("#faq .faq-body");
  ok(await page.$eval("#faq", el => el.open) && faq.includes("크롤리") && faq.includes("XVIII(18) · 달") && faq.includes("새로 풀어 쓴 해석"), "첫 화면: 누르면 설명이 펼쳐짐");
  await page.screenshot({ path: `${OUT}/01b-home-faq.png`, fullPage: true });

  // 02 휠 피커
  await page.click("#start");
  ok(await page.isVisible("#input"), "첫 화면 → 생일 입력");
  await settle();
  ok(await wheelVal("#month-wheel") === 1 && await wheelVal("#day-wheel") === 1, "휠 처음 값 1월 1일");
  await press("#day-wheel", "End");
  ok(await wheelVal("#day-wheel") === 31, "키보드 End → 31일");
  await press("#month-wheel", "ArrowDown", 3);
  ok(await wheelVal("#month-wheel") === 4 && await wheelVal("#day-wheel") === 30, "1월 31일에서 4월로 → 4월 30일로 맞춤");
  ok(await page.$$eval("#day-wheel .wheel-item", e => e.length) === 30, "4월은 30일까지만 고를 수 있음");
  await press("#month-wheel", "ArrowUp", 2);
  ok(await wheelVal("#month-wheel") === 2 && await wheelVal("#day-wheel") === 29, "2월로 → 2월 29일까지 (연도 없음)");
  await page.screenshot({ path: `${OUT}/02-wheel.png` });

  // 손가락으로 밀기: 일 휠을 위로 두 칸쯤
  await press("#day-wheel", "Home");
  const box = await page.locator("#day-wheel").boundingBox();
  { const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
    for (let i = 1; i <= 8; i++) { await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - i * 10 }] }); await page.waitForTimeout(16); }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] }); }
  await page.waitForTimeout(1100);
  const swiped = await wheelVal("#day-wheel");
  const centered = await page.$eval("#day-wheel", el => { const h = el.querySelector(".wheel-item").offsetHeight; return Math.abs(el.scrollTop - Math.round(el.scrollTop / h) * h) < 2; });
  ok(swiped > 1 && centered, `손가락으로 밀면 값이 바뀌고 가운데 칸에 멈춤 (1일 → ${swiped}일)`);
  ok((await selectedText("#day-wheel")) === swiped + "일", "가운데 숫자만 진하게 표시");
  const look = await page.$eval("#day-wheel", el => { const s = el.querySelector(".is-selected"), n = s.nextElementSibling; return [getComputedStyle(s).fontWeight, +getComputedStyle(s).opacity, +getComputedStyle(n).opacity]; });
  ok(+look[0] >= 700 && look[1] > look[2], `선택 숫자는 진하고 위아래는 옅음 (굵기 ${look[0]}, 불투명도 ${look[1]} > ${look[2]})`);

  // 03 카드: 3월 7일 → 물고기자리 → XVIII 달
  await setWheels(3, 7);
  ok((await page.textContent("#picked")).trim() === "3월 7일", "휠로 3월 7일 선택");
  await page.click("#find"); await page.waitForTimeout(1200);
  ok(await face() === "front" && await page.$$eval("#face-front img", e => e.length) === 1, "내 카드 찾기 → 카드 앞면부터 등장");
  const before = await page.evaluate(() => ({ r: document.getElementById("b-result").textContent, body: document.body.innerText,
    reading: document.getElementById("reading").hidden, actions: document.getElementById("actions").hidden }));
  ok(before.r === "" && !before.body.includes("기회") && before.reading && before.actions, "탭 전에는 결과·해석·버튼이 없음");
  await page.screenshot({ path: `${OUT}/03-front.png` });
  await page.tap("#card", { force: true });
  await page.waitForTimeout(560); await page.screenshot({ path: `${OUT}/03b-midflip.png` });
  await waitRevealed();
  ok(await face() === "back", "탭하면 빙글 뒤집혀 뒷면");
  ok((await page.textContent(".b-name")) === "The Moon" && (await page.textContent(".b-sign")).includes("XVIII") && (await page.textContent(".b-sign")).includes("물고기자리"),
    "뒷면: 이름·번호·별자리");
  ok((await page.textContent("#b-result")).replace(/[\s ]+/g, " ").trim() === "익숙한 선택지 밖을 살펴볼 때, 새 기회가 보여.", "뒷면: 한 줄 결과");
  await page.screenshot({ path: `${OUT}/04-back.png` });
  const rd = await page.textContent("#reading-text");
  ok(await page.isVisible("#reading") && rd.startsWith("달빛이 비치는 물길은 두 탑 사이로 이어져요."), "카드 해석 표시");
  const btns = await page.evaluate(() => ["save", "again"].map(id => { const b = document.getElementById(id), r = b.getBoundingClientRect(), cs = getComputedStyle(b); return { t: b.textContent.trim(), top: Math.round(r.top), bg: cs.backgroundColor, border: cs.borderTopWidth }; }));
  ok(btns[0].t === "이미지 저장" && btns[1].t === "다른 생일로 보기" && btns[0].top === btns[1].top, "버튼 두 개가 나란히");
  ok(btns[0].bg === "rgb(12, 11, 16)" && btns[1].bg === "rgba(0, 0, 0, 0)" && btns[1].border === "1px", "이미지 저장은 검정, 다른 생일로 보기는 얇은 테두리");
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.screenshot({ path: `${OUT}/05-reading.png` });

  const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
  const file = `${OUT}/card-XVIII.png`; await dl.saveAs(file);
  const buf = fs.readFileSync(file);
  ok(buf.readUInt32BE(16) === 1080 && buf.readUInt32BE(20) === 1920, `이미지 저장: 세로 PNG ${dl.suggestedFilename()} (${Math.round(buf.length / 1024)}KB)`);

  // 다른 생일로 보기 → 휠에 직전 값 → 바꿔서 다시
  await page.click("#again"); await settle();
  ok(await page.isVisible("#input") && await wheelVal("#month-wheel") === 3 && await wheelVal("#day-wheel") === 7, "다른 생일로 보기 → 휠에 3월 7일이 남아 있음");
  await page.screenshot({ path: `${OUT}/06-again.png` });
  await press("#month-wheel", "ArrowDown", 1);
  ok((await page.textContent("#picked")).trim() === "4월 7일", "날짜를 4월 7일로 바꿈");
  await page.click("#find"); await page.waitForTimeout(1200);
  ok(await face() === "front" && (await page.textContent("#b-result")) === "" && await page.$eval("#face-front img", e => e.getAttribute("src").includes("emperor")),
    "새 카드(IV 황제)의 앞면부터 다시 보임");
  await page.tap("#card", { force: true }); await waitRevealed();
  ok((await page.textContent(".b-name")) === "The Emperor", "새 카드 뒤집기");

  // 12장 모두: 이름·번호·별자리·한 줄 결과·해석 3~4문장
  const all = [[3,21,"IV","The Emperor","양자리"],[4,20,"V","The Hierophant","황소자리"],[5,21,"VI","The Lovers","쌍둥이자리"],[6,22,"VII","The Chariot","게자리"],
    [7,23,"VIII","Strength","사자자리"],[8,23,"IX","The Hermit","처녀자리"],[9,23,"XI","Justice","천칭자리"],[10,23,"XIII","Death","전갈자리"],
    [11,23,"XIV","Temperance","사수자리"],[12,22,"XV","The Devil","염소자리"],[1,20,"XVII","The Star","물병자리"],[2,19,"XVIII","The Moon","물고기자리"]];
  const results = new Set();
  for (const [m, d, roman, en, sign] of all) {
    await page.click("#again"); await settle();
    await setWheels(m, d);
    await page.click("#find"); await page.waitForTimeout(1100);
    await page.tap("#card", { force: true }); await waitRevealed();
    const r = (await page.textContent("#b-result")).replace(/[\s ]+/g, " ").trim();
    const t = await page.textContent("#reading-text");
    const n = t.split(/(?<=요\.)\s/).length;
    results.add(r);
    ok((await page.textContent(".b-name")) === en && (await page.textContent(".b-sign")).includes(roman) && (await page.textContent(".b-sign")).includes(sign)
      && r.includes(",") && r.endsWith(".") && n >= 3 && n <= 4,
      `${m}월 ${d}일: ${roman} ${en} · ${sign} → "${r}" / 해석 ${n}문장`);
    if (m === 10) await page.screenshot({ path: `${OUT}/07-death.png` });
  }
  ok(results.size === 12, "한 줄 결과가 카드마다 다름");
  ok(/경계일/.test(await page.textContent("#reading-meta")), "경계일(2월 19일)에는 간이 기준 안내가 붙음");

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow, "가로 스크롤 없음");

  // 데스크톱: 마우스 휠과 방향키
  const desk = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  desk.on("pageerror", e => errors.push(e.message));
  await desk.goto(URL); await desk.click("#start"); await desk.waitForTimeout(500);
  const mb = await desk.locator("#month-wheel").boundingBox();
  await desk.mouse.move(mb.x + mb.width / 2, mb.y + mb.height / 2);
  for (let i = 0; i < 2; i++) { await desk.mouse.wheel(0, 100); await desk.waitForTimeout(250); }
  await desk.waitForTimeout(600);
  ok(+(await desk.$eval("#month-wheel", el => el.getAttribute("aria-valuenow"))) === 3, "데스크톱: 마우스 휠 두 번 → 3월");
  await desk.focus("#day-wheel"); await desk.keyboard.press("ArrowDown"); await desk.keyboard.press("ArrowDown"); await desk.waitForTimeout(600);
  ok(+(await desk.$eval("#day-wheel", el => el.getAttribute("aria-valuenow"))) === 3, "데스크톱: 방향키 두 번 → 3일");
  await desk.screenshot({ path: `${OUT}/08-desktop.png` });

  ok(errors.length === 0, "콘솔 오류 없음 " + errors.join(" | "));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : "all mobile checks passed");
  process.exit(fails ? 1 : 0);
})();
