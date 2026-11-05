// 1년 366일이 모두 정확히 하나의 별자리·카드로 연결되는지 확인
global.window = globalThis;
const path = require("path");
["data/zodiac-ranges.js", "data/card-map.js", "data/card-content.js", "js/lookup.js"].forEach(f => require(path.join(__dirname, "..", f)));
const L = window.ByeolLookup;
let fails = 0; const count = {};
const ok = (c, m) => { if (!c) { fails++; console.log("FAIL", m); } };
for (let m = 1; m <= 12; m++) for (let d = 1; d <= window.BYEOL_DAYS_IN_MONTH[m - 1]; d++) {
  const hits = window.BYEOL_ZODIAC_RANGES.filter(z => { const k=m*100+d,s=z.start[0]*100+z.start[1],e=z.end[0]*100+z.end[1]; return s<=e?k>=s&&k<=e:k>=s||k<=e; });
  ok(hits.length === 1, `${m}/${d} matches ${hits.length}`);
  const r = L.lookup(m, d); count[r.zodiac.name] = (count[r.zodiac.name] || 0) + 1;
}
const expect = [[11,5,"전갈자리",13],[2,8,"물병자리",17],[3,7,"물고기자리",18],[2,29,"물고기자리",18],[3,21,"양자리",4],[3,20,"물고기자리",18],
  [12,22,"염소자리",15],[1,19,"염소자리",15],[1,20,"물병자리",17],[7,23,"사자자리",8],[9,23,"천칭자리",11],[10,22,"천칭자리",11],[10,23,"전갈자리",13],[11,23,"사수자리",14],[5,21,"쌍둥이자리",6],[6,22,"게자리",7],[8,23,"처녀자리",9],[4,20,"황소자리",5]];
expect.forEach(([m,d,z,n]) => { const r = L.lookup(m,d); ok(r && r.zodiac.name===z && r.card.num===n, `${m}/${d} -> ${r && r.zodiac.name} ${r && r.card.num}`); });
[[4,31],[2,30],[6,31],[13,1],[0,5],[1,0],[1,32]].forEach(([m,d]) => ok(!L.isValidMonthDay(m,d) && L.lookup(m,d)===null, `${m}/${d} should be invalid`));
Object.values(window.BYEOL_CARD_MAP).forEach(c => ok(window.BYEOL_CARD_CONTENT[c.num] && window.BYEOL_CARD_CONTENT[c.num].result && c.slug, `card ${c.roman} ${c.name} has result and slug`));
ok(L.lookup(3,21).boundary && !L.lookup(11,5).boundary, "boundary flag");
console.log(count);
console.log(fails ? `${fails} FAILED` : "all lookup checks passed");
process.exit(fails ? 1 : 0);
