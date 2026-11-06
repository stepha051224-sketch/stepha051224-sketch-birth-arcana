// 휴대폰 화면 확인: 메인 → 생일 입력 → 카드 앞면 → 뒷면 → 이미지 저장
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

  await page.goto(URL); await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/01-home.png` });
  ok(await page.isVisible("#home") && (await page.textContent("#home-title")).trim() === "Birth Arcana", "메인: 제목과 카드 그림");
  { const about = await page.textContent("#about");
    ok(about.includes("크롤리") && about.includes("라이더–웨이트–스미스") && about.includes("XVIII") && about.includes("내 운이 열리는 순간"), "메인: 아래 소개글"); }
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.screenshot({ path: `${OUT}/01b-home-about.png` }); await page.evaluate(() => window.scrollTo(0, 0));

  await page.click("#start");
  ok(await page.isVisible("#input"), "메인 → 생일 입력");
  await page.screenshot({ path: `${OUT}/02-input.png` });

  const enter = async (m, d) => { await page.fill("#month", m); await page.fill("#day", d); await page.click("#find"); };
  await enter("04", "31");
  ok(await page.isVisible("#input") && /30일까지/.test(await page.textContent("#form-msg")), "4월 31일은 막고 안내");
  await enter("13", "01");
  ok(await page.isVisible("#input") && /12까지/.test(await page.textContent("#form-msg")), "13월은 막고 안내");
  await page.fill("#month", ""); await page.fill("#day", ""); await page.click("#find");
  ok(/달을 입력/.test(await page.textContent("#form-msg")), "빈칸이면 안내");
  await page.fill("#month", ""); await page.type("#month", "a3");
  ok((await page.inputValue("#month")) === "3", "숫자만 입력됨");
  await enter("02", "29");
  ok(await page.isVisible("#stage") && (await page.textContent(".b-name")) === "The Moon", "2월 29일 허용 → 물고기자리 The Moon");
  await page.click("#back");

  const face = () => page.evaluate(() => { const m = getComputedStyle(document.getElementById("card-inner")).transform; return m === "none" ? "front" : (new DOMMatrix(m).m11 < 0 ? "back" : "front"); });
  const waitRevealed = () => page.waitForFunction(() => !document.getElementById("explain").hidden, null, { timeout: 6000 });

  const cases = [["11월 5일", "전갈자리", "XIII", "Death", "오래 끌던 일을 끝낼 때 새 기회가 들어옵니다", true],
                 ["2월 8일", "물병자리", "XVII", "The Star", "좋아하는 걸 보여 줄 때 취향이 맞는 사람이 먼저 다가옵니다", true],
                 ["3월 7일", "물고기자리", "XVIII", "The Moon", "익숙한 선택지 밖을 살펴볼 때 새 기회가 보입니다", true]];
  for (const [label, sign, roman, en, result, hasImage] of cases) {
    await page.click(`.chip:has-text("${label}")`);
    ok(await page.isVisible("#input"), `${label}: 예시를 누르면 날짜만 채워짐`);
    await page.click("#find");
    await page.waitForTimeout(1200);
    ok((await page.textContent(".b-sign")).includes(sign) && (await page.textContent(".b-sign")).includes(roman), `${label}: ${roman} ${sign}`);
    ok(hasImage ? await page.$$eval("#face-front img", e => e.length) === 1 : (await page.textContent(".f-pending")).includes("준비 중"),
      `${label}: 앞면 ${hasImage ? "그림 이미지" : "일러스트 준비 중"}`);
    const before = await page.evaluate(() => ({ text: document.getElementById("b-result").textContent, body: document.body.innerText,
      save: document.getElementById("actions").hidden, explain: document.getElementById("explain").hidden }));
    ok(before.text === "" && !before.body.includes("기회") && before.save && before.explain, `${label}: 탭 전에는 결과·저장 버튼·설명 박스가 없음`);
    if (roman === "XVIII") await page.screenshot({ path: `${OUT}/03-front.png` });
    await page.tap("#card", { force: true });
    if (roman === "XVIII") { await page.waitForTimeout(560); await page.screenshot({ path: `${OUT}/03b-midflip.png` }); }
    await waitRevealed();
    ok((await page.textContent("#b-result")).replace(/[\s\u00a0]+/g, " ").trim() === result, `${label}: 뒷면 결과 "${result}"`);
    ok((await page.textContent(".b-name")) === en, `${label}: 뒷면 이름 ${en}`);
    ok(await face() === "back", `${label}: 뒷면이 보임`);
    if (roman === "XVIII") await page.screenshot({ path: `${OUT}/04-back.png` });
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
    const file = `${OUT}/card-${roman}.png`; await dl.saveAs(file);
    const buf = fs.readFileSync(file), w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    ok(w === 1080 && h === 1920 && dl.suggestedFilename().startsWith("birth-arcana_" + roman), `${label}: 이미지 저장 ${dl.suggestedFilename()} (${w}×${h}, ${Math.round(buf.length / 1024)}KB)`);
    ok(await face() === "back" && !(await page.$("#face-back #save")) && await page.evaluate(() => { const c = document.getElementById("card").getBoundingClientRect(), b = document.getElementById("save").getBoundingClientRect(); return b.top >= c.bottom; }), `${label}: 저장 버튼은 카드 밑에 있고 눌러도 카드는 그대로`);
    const box = await page.textContent("#explain");
    ok(box.includes(sign) && box.includes("크롤리") && box.includes("창작 해석") && box.includes("간이 기준"), `${label}: 카드 아래 설명 박스`);
    if (roman === "XVIII") { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.screenshot({ path: `${OUT}/05-explain.png` }); await page.evaluate(() => window.scrollTo(0, 0)); }
    await page.tap("#card", { force: true }); await page.waitForTimeout(1000);
    ok(await face() === "front" && (await page.textContent("#hint")).includes("뒷면"), `${label}: 다시 누르면 앞면`);
    await page.tap("#card", { force: true }); await page.waitForTimeout(1000);
    ok(await face() === "back", `${label}: 또 누르면 뒷면`);
    await page.click("#back");
  }

  // 나머지 별자리 대표 날짜: 모두 결과까지 열린다
  const rest = [[1,1,"XV","The Devil"],[4,1,"IV","The Emperor"],[5,1,"V","The Hierophant"],[6,1,"VI","The Lovers"],[7,1,"VII","The Chariot"],[8,1,"VIII","Strength"],[9,1,"IX","The Hermit"],[10,1,"XI","Justice"],[12,1,"XIV","Temperance"]];
  for (const [m, d, roman, en] of rest) {
    ok(await page.evaluate(n => { const c = window.BYEOL_CARD_CONTENT[n]; return !!(c.front && c.back); }, ({XV:15,IV:4,V:5,VI:6,VII:7,VIII:8,IX:9,XI:11,XIV:14})[roman]), `${roman}: 앞면·뒷면 그림 경로 있음`);
    if (m === 1) await page.evaluate(() => { window.BYEOL_CARD_CONTENT[15] = Object.assign({}, window.BYEOL_CARD_CONTENT[15], { front: null, back: null }); });
    await enter(String(m).padStart(2, "0"), String(d).padStart(2, "0"));
    await page.waitForTimeout(1100);
    if (m === 1) await page.screenshot({ path: `${OUT}/06-pending-front.png` });
    await page.tap("#card", { force: true });
    await waitRevealed();
    if (m === 1) await page.screenshot({ path: `${OUT}/06b-pending-back.png` });
    const r = (await page.textContent("#b-result")).replace(/\s+/g, " ").trim();
    ok((await page.textContent(".b-name")) === en && (await page.textContent(".b-sign")).includes(roman) && r.endsWith("니다"), `${m}월 ${d}일: ${roman} ${en} → "${r}"`);
    if (m === 1) {
      const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
      await dl.saveAs(`${OUT}/card-XV.png`);
      ok(dl.suggestedFilename() === "birth-arcana_XV_devil.png", "그림을 비운 카드도 준비 중 그림으로 이미지 저장 " + dl.suggestedFilename());
    }
    await page.click("#back");
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow, "가로 스크롤 없음");
  ok(errors.length === 0, "콘솔 오류 없음 " + errors.join(" | "));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : "all mobile checks passed");
  process.exit(fails ? 1 : 0);
})();
