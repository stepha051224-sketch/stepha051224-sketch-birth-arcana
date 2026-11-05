/*
 * 카드별 콘텐츠 (별의 서고 창작 해석)
 *
 * result  : 뒷면 결과 문장
 * motif   : 일러스트 주제 (그림 작업 메모)
 * art     : js/art.js 에 직접 그린 일러스트 이름. 없으면 null
 * image   : 일러스트 이미지 파일 경로 (예: "images/cards/04-emperor.png").
 *           값이 있으면 art 보다 먼저 쓴다. 비워 두면(null) art 를, art 도 없으면
 *           "일러스트 준비 중" 그림을 보여준다. 결과·뒤집기·저장은 그림과 상관없이 동작한다.
 * palette : 카드별 포인트 색 (accent: 테두리 띠, pale: 봉인과 크레스트 바탕)
 */
(function () {
  var MINT = { accent: "#a6d9c8", pale: "#e2f3ed" };
  var SKY = { accent: "#9ecbe7", pale: "#e3f1f9" };
  var GREYVIOLET = { accent: "#b7adcd", pale: "#ece7f4" };
  var LILAC = { accent: "#c7b6e6", pale: "#efe9f8" };

  window.BYEOL_CARD_CONTENT = {
    4: {
      motif: "별 왕관이 놓인 높은 의자와 곧게 뻗은 홀",
      result: "흐지부지된 계획에 마감일을 정할 때, 일이 한 번에 풀려.",
      art: null, image: null, palette: LILAC
    },
    5: {
      motif: "열쇠 두 개가 걸린 종탑과 울려 퍼지는 종소리",
      result: "믿을 만한 사람에게 조언을 구할 때, 막혔던 길이 열려.",
      art: null, image: null, palette: GREYVIOLET
    },
    6: {
      motif: "두 갈래 길 위로 마주 닿는 두 손과 날개",
      result: "둘 중 하나를 마음 가는 대로 고를 때, 더 좋은 쪽이 따라와.",
      art: null, image: null, palette: SKY
    },
    7: {
      motif: "달빛 바퀴를 단 작은 마차와 앞으로 뻗은 리본",
      result: "망설이던 첫걸음을 내디딜 때, 속도가 붙기 시작해.",
      art: null, image: null, palette: MINT
    },
    8: {
      motif: "꽃 화관을 쓴 사자를 부드럽게 쓰다듬는 손",
      result: "서두르지 않고 한 번 더 기다릴 때, 상대가 먼저 손을 내밀어.",
      art: null, image: null, palette: LILAC
    },
    9: {
      motif: "별 하나를 담은 등불과 눈 덮인 산길",
      result: "혼자 조용히 정리하는 시간에, 놓쳤던 답이 떠올라.",
      art: null, image: null, palette: GREYVIOLET
    },
    11: {
      motif: "깃털과 별이 균형을 이룬 저울",
      result: "미뤄 둔 약속을 정확히 지킬 때, 믿음이 기회로 돌아와.",
      art: null, image: null, palette: SKY
    },
    13: {
      motif: "검은 리본이 풀리며 피어나는 흰 꽃",
      result: "오래 끌던 일을 끝낼 때 새 기회가 들어와.",
      art: "death", image: null, palette: GREYVIOLET
    },
    14: {
      motif: "두 잔 사이를 오가는 물줄기와 무지개",
      result: "서로 다른 둘을 섞어 볼 때, 생각지 못한 조합이 빛나.",
      art: null, image: null, palette: MINT
    },
    15: {
      motif: "느슨하게 풀린 사슬과 열린 새장",
      result: "끊지 못한 습관 하나를 내려놓을 때, 그 시간이 기회로 바뀌어.",
      art: null, image: null, palette: LILAC
    },
    17: {
      motif: "하늘색 밤에 길게 빛을 흘리는 별",
      result: "좋아하는 걸 보여줄 때, 취향이 맞는 사람이 먼저 다가와.",
      art: "star", image: null, palette: SKY
    },
    18: {
      motif: "라일락빛 달 아래 두 탑 사이로 이어지는 길",
      result: "익숙한 선택지 밖을 살펴볼 때, 새 기회가 보여.",
      art: "moon", image: null, palette: MINT
    }
  };
})();
