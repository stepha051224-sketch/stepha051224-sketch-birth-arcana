# BIRTH ARCANA — 모바일 웹 프로토타입

생일(월·일)을 넣으면 별자리에 대응하는 타로 카드 한 장이 나타나고, 카드를 누르면 뒤집혀 "내 운이 열리는 순간"을 보여준다.

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
| `js/art.js` | 별자리 문양, 그림이 없을 때 쓰는 준비 중 앞면·뒷면 무늬 (SVG) |
| `js/app.js` | 화면 흐름, 뒤집기 연출, PNG 저장 |

## 카드 그림 넣기

12장 모두 결과 문장이 들어 있다. 그림은 카드마다 두 장이다.

- **앞면**: 테두리·별자리 메달·이름 리본까지 들어간 카드 한 장 그림 (비율 11:25, 권장 880 × 2000 이상)
- **뒷면 위쪽**: 뒷면 흰 카드 위쪽에 들어가는 그림 (비율 약 254:394, 권장 1016 × 1576 이상)

1. `images/cards/` 에 `번호-slug-front.webp`, `번호-slug-back.webp` 로 넣는다 (예: `04-emperor-front.webp`). png·jpg도 된다.
2. `data/card-content.js` 에서 해당 카드의 `front`, `back` 값을 파일 경로로 바꾼다.
3. 비워 두면 앞면은 "일러스트 준비 중" 카드, 뒷면은 라벤더 빛 무늬를 그린다. 결과·뒤집기·저장은 그림이 없어도 동작한다.

메인 화면 그림은 `images/hero.webp` 다. 지금 `hero.webp` 와 XVIII 달 카드의 두 그림은 디자인 시안에서 잘라 키운 임시 이미지라 흐릿하다. 원본으로 바꿔야 한다.

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
