// 휴대폰 화면에서 대표 생일 3개 → 카드, 탭 전 결과 숨김, 뒤집기, PNG 저장 확인
const { chromium, devices } = require("playwright");
const fs = require("fs");
const OUT = process.argv[2] || "shots";
const URL = process.argv[3] || "http://localhost:8765/";
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ ...devices["iPhone 13"], acceptDownloads: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(URL); await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${OUT}/0-intro.png` });
  let fails = 0; const ok = (c, m) => { console.log(c ? "PASS" : "FAIL", m); if (!c) fails++; };

  // 존재하지 않는 날짜는 고를 수 없다
  await page.selectOption("#month", "4");
  ok(!(await page.$$eval("#day option", o => o.map(x => x.value))).includes("31"), "4월에는 31일이 없다");
  await page.selectOption("#month", "2");
  const feb = await page.$$eval("#day option", o => o.map(x => x.value));
  ok(feb.includes("29") && !feb.includes("30"), "2월은 29일까지 고를 수 있다");
  await page.selectOption("#month", "3"); await page.selectOption("#day", "31"); await page.selectOption("#month", "4");
  ok((await page.inputValue("#day")) === "" && /30일까지/.test(await page.textContent("#form-msg")), "3월 31일 → 4월로 바꾸면 날짜가 비워지고 안내가 나온다");

  const cases = [["11월 5일", "전갈자리", "XIII", "죽음", "오래 끌던 일을 끝낼 때 새 기회가 들어와."],
                 ["2월 8일", "물병자리", "XVII", "별", "좋아하는 걸 보여줄 때, 취향이 맞는 사람이 먼저 다가와."],
                 ["3월 7일", "물고기자리", "XVIII", "달", "익숙한 선택지 밖을 살펴볼 때, 새 기회가 보여."]];
  for (const [i, [label, sign, roman, name, result]] of cases.entries()) {
    await page.click(`.chip:has-text("${label}")`);
    ok(await page.isVisible("#intro"), `${label}: 예시를 누르면 날짜만 채워지고 화면은 그대로`);
    await page.click("#find");
    await page.waitForTimeout(1200);
    ok((await page.textContent("#chain-mini")).includes(sign), `${label}: ${sign}`);
    ok((await page.textContent(".f-num")).trim() === roman, `${label}: 앞면 번호 ${roman}`);
    const before = await page.evaluate(() => ({ text: document.getElementById("b-result").textContent, actions: document.getElementById("actions").hidden, body: document.body.innerText }));
    ok(before.text === "" && !before.body.includes("기회") && before.actions && await page.isHidden("#explain"), `${label}: 탭 전에는 결과 문장이 문서에 없고 버튼·설명 박스도 숨겨짐`);
    if (i === 0) await page.screenshot({ path: `${OUT}/1-front.png` });
    await page.tap("#card", { force: true });
    if (i === 0) { await page.waitForTimeout(430); await page.screenshot({ path: `${OUT}/2-midflip.png` }); await page.waitForTimeout(830); await page.screenshot({ path: `${OUT}/3-burst.png` }); }
    await page.waitForFunction(() => !document.getElementById("actions").hidden, null, { timeout: 5000 });
    ok((await page.textContent("#b-result")).replace(/\s+/g, " ") === result, `${label}: 뒷면 결과 "${result}"`);
    ok((await page.textContent(".b-name")) === name && (await page.textContent(".b-num")) === roman, `${label}: 뒷면 ${roman} ${name}`);
    ok(await page.isVisible("#save"), `${label}: 뒤집은 뒤 저장 버튼`);
    if (i === 0) await page.screenshot({ path: `${OUT}/4-back.png` });
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
    const file = `${OUT}/card-${roman}.png`; await dl.saveAs(file);
    const buf = fs.readFileSync(file);
    const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
    ok(buf.slice(1, 4).toString() === "PNG" && w === 1080 && h === 1920, `${label}: PNG 저장 ${dl.suggestedFilename()} (${w}×${h}, ${Math.round(buf.length / 1024)}KB)`);
    const box = await page.textContent("#explain");
    ok(await page.isVisible("#explain") && box.includes(sign) && box.includes(roman) && box.includes("크롤리") && box.includes("창작 해석") && box.includes("간이 기준"), `${label}: 카드 아래 설명 박스에 연결·출처·창작 안내`);
    ok((await page.textContent("#save")).trim() === "이미지 저장", `${label}: 버튼 문구 "이미지 저장"`);
    if (i === 2) { await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.screenshot({ path: `${OUT}/5-explain.png` }); await page.evaluate(() => window.scrollTo(0, 0)); }
    // 다시 누르면 앞면, 또 누르면 뒷면
    const face = () => page.evaluate(() => { const m = getComputedStyle(document.getElementById("card-inner")).transform; return m === "none" ? "front" : (new DOMMatrix(m).m11 < 0 ? "back" : "front"); });
    ok(await face() === "back", `${label}: 결과를 연 뒤 뒷면`);
    await page.tap("#card", { force: true }); await page.waitForTimeout(950);
    ok(await face() === "front" && (await page.textContent("#hint")).includes("뒷면"), `${label}: 다시 누르면 앞면`);
    if (i === 0) await page.screenshot({ path: `${OUT}/7-front-again.png` });
    await page.tap("#card", { force: true }); await page.waitForTimeout(950);
    ok(await face() === "back" && (await page.textContent("#hint")).includes("앞면"), `${label}: 또 누르면 뒷면`);
    await page.click("#back");
  }
  // 그림이 아직 없는 카드: 준비 중 그림이지만 뒤집기·결과·저장은 동작
  await page.selectOption("#month", "1"); await page.selectOption("#day", "1"); await page.click("#find");
  await page.waitForTimeout(1200);
  ok((await page.textContent(".p-name")) === "악마" && (await page.textContent(".p-tag")).includes("준비 중"), "1월 1일: XV 악마, 일러스트 준비 중 표시");
  ok((await page.textContent("#b-result")) === "" && await page.isHidden("#explain"), "1월 1일: 탭 전 결과 숨김");
  await page.screenshot({ path: `${OUT}/6-pending.png` });
  await page.tap("#card", { force: true });
  await page.waitForFunction(() => !document.getElementById("actions").hidden, null, { timeout: 5000 });
  ok((await page.textContent("#b-result")).replace(/\s+/g, " ") === "끊지 못한 습관 하나를 내려놓을 때, 그 시간이 기회로 바뀌어.", "1월 1일: 뒷면 결과");
  await page.screenshot({ path: `${OUT}/6b-pending-back.png` });
  {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
    await dl.saveAs(`${OUT}/card-XV.png`);
    ok(dl.suggestedFilename() === "byeol-seogo_XV_devil.png", "1월 1일: 이미지 저장 " + dl.suggestedFilename());
  }
  await page.click("#back");

  // 나머지 별자리 대표 날짜: 모두 결과까지 열린다
  const rest = [[4,1,"IV","황제"],[5,1,"V","교황"],[6,1,"VI","연인"],[7,1,"VII","전차"],[8,1,"VIII","힘"],[9,1,"IX","은자"],[10,1,"XI","정의"],[12,1,"XIV","절제"]];
  for (const [m, d, roman, name] of rest) {
    await page.selectOption("#month", String(m)); await page.selectOption("#day", String(d)); await page.click("#find");
    await page.waitForTimeout(1100);
    await page.tap("#card", { force: true });
    await page.waitForFunction(() => !document.getElementById("actions").hidden, null, { timeout: 5000 });
    const r = await page.textContent("#b-result");
    ok((await page.textContent(".b-num")) === roman && (await page.textContent(".b-name")) === name && r.trim().length > 10, `${m}월 ${d}일: ${roman} ${name} → "${r.replace(/\s+/g, " ").trim()}"`);
    await page.click("#back");
  }

  // 이미지 파일을 넣으면 앞면과 저장 이미지에 들어간다
  await page.evaluate(() => { window.BYEOL_CARD_CONTENT[4].image = "tools/fixtures/test-card.png"; });
  await page.selectOption("#month", "4"); await page.selectOption("#day", "1"); await page.click("#find");
  await page.waitForTimeout(1200);
  ok(await page.$$eval("#face-front image", e => e.length) === 1 && await page.$$eval(".f-pending", e => e.length) === 0, "이미지 슬롯: 앞면에 이미지가 들어가고 준비 중 표시는 사라짐");
  await page.screenshot({ path: `${OUT}/8-image-slot.png` });
  await page.tap("#card", { force: true });
  await page.waitForFunction(() => !document.getElementById("actions").hidden, null, { timeout: 5000 });
  {
    const [dl] = await Promise.all([page.waitForEvent("download"), page.click("#save")]);
    await dl.saveAs(`${OUT}/card-IV-image.png`);
    ok(true, "이미지 슬롯: 저장 " + dl.suggestedFilename());
  }

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  ok(!overflow, "가로 스크롤 없음");
  ok(errors.length === 0, "콘솔 오류 없음 " + errors.join(" | "));
  await browser.close();
  console.log(fails ? `${fails} FAILED` : "all mobile checks passed");
  process.exit(fails ? 1 : 0);
})();
