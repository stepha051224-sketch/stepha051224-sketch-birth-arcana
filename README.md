# 별의 서고 — 모바일 웹 프로토타입

생일(월·일)을 넣으면 별자리에 대응하는 타로 카드 한 장이 나타나고, 카드를 탭하면 뒤집혀 "내 운이 열리는 순간"을 보여준다.

## 실행

```bash
cd byeol-seogo && python3 -m http.server 8765
```
브라우저(또는 같은 와이파이의 휴대폰)에서 `http://localhost:8765/` 를 연다. `index.html`을 바로 열어도 동작한다.

## 파일

| 파일 | 내용 |
|---|---|
| `data/zodiac-ranges.js` | 별자리 날짜 구간 (프로토타입용 고정 구간), 월별 일수 |
| `data/card-map.js` | 별자리 → 카드 대응 (크롤리 대응표, RWS 번호·이름) |
| `data/card-content.js` | 카드별 결과 문장·일러스트(이미지 경로 또는 그림 이름)·색 |
| `js/lookup.js` | 날짜 검증과 생일 → 별자리 → 카드 연결 |
| `js/art.js` | 카드 프레임, 별자리 문양, 일러스트 (SVG) |
| `js/app.js` | 화면 흐름, 뒤집기 연출, PNG 저장 |

## 카드 일러스트 넣기

12장 모두 결과 문장이 들어 있다. XIII 죽음·XVII 별·XVIII 달은 `js/art.js`에 직접 그린 그림이 있고, 나머지 9장은 "일러스트 준비 중" 그림을 보여준다.

1. 이미지를 `images/cards/` 에 넣는다. 파일 이름은 `번호-slug` 형식을 권장한다 (예: `04-emperor.png`).
   - 그림 창 비율은 224 × 356 (약 5:8). 다른 비율이면 가운데를 기준으로 잘린다. 권장 크기 896 × 1424 이상.
2. `data/card-content.js` 에서 해당 카드의 `image` 값을 파일 경로로 바꾼다.
   ```js
   4: { ..., image: "images/cards/04-emperor.png", ... }
   ```
3. `image` 가 있으면 직접 그린 그림보다 먼저 쓰인다. 화면 앞면과 저장 이미지에 모두 들어간다.

| 카드 | slug | 별자리 |
|---|---|---|
| IV 황제 | emperor | 양자리 |
| V 교황 | hierophant | 황소자리 |
| VI 연인 | lovers | 쌍둥이자리 |
| VII 전차 | chariot | 게자리 |
| VIII 힘 | strength | 사자자리 |
| IX 은자 | hermit | 처녀자리 |
| XI 정의 | justice | 천칭자리 |
| XIII 죽음 | death | 전갈자리 |
| XIV 절제 | temperance | 사수자리 |
| XV 악마 | devil | 염소자리 |
| XVII 별 | star | 물병자리 |
| XVIII 달 | moon | 물고기자리 |

## 배포

빌드 단계가 없는 정적 사이트다. Vercel에서 저장소 루트를 그대로 배포한다 (Framework: Other, Build Command 없음).

## 확인

```bash
node tools/check-lookup.js
```
```bash
NODE_PATH=$(npm root -g) node tools/check-mobile.js <스크린샷 폴더>
```
`check-mobile.js`는 위 로컬 서버가 켜져 있어야 한다.
