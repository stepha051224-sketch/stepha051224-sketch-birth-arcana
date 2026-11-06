/*
 * 카드별 콘텐츠 (BIRTH ARCANA 창작 해석)
 *
 * result : 뒷면 결과 문장
 * motif  : 일러스트 주제 (그림 작업 메모)
 * front  : 앞면 이미지 경로. 테두리·별자리 메달·이름 리본까지 들어간 카드 한 장 그림.
 *          비워 두면(null) "일러스트 준비 중" 앞면을 그린다.
 * back   : 뒷면 위쪽 이미지 경로. 비워 두면 라벤더 빛 무늬를 그린다.
 *
 * 이미지 파일은 images/cards/ 에 "번호-slug-front.webp", "번호-slug-back.webp" 로 둔다.
 * 결과·뒤집기·저장은 그림이 없어도 모두 동작한다.
 */
window.BYEOL_CARD_CONTENT = {
  4: {
    motif: "별 왕관이 놓인 높은 의자와 곧게 뻗은 홀",
    result: "흐지부지된 계획에 마감일을 정할 때 일이 한 번에 풀립니다",
    front: null, back: null
  },
  5: {
    motif: "열쇠 두 개가 걸린 종탑과 울려 퍼지는 종소리",
    result: "믿을 만한 사람에게 조언을 구할 때 막혔던 길이 열립니다",
    front: null, back: null
  },
  6: {
    motif: "두 갈래 길 위로 마주 닿는 두 손과 날개",
    result: "둘 중 하나를 마음 가는 대로 고를 때 더 좋은 쪽이 따라옵니다",
    front: null, back: null
  },
  7: {
    motif: "달빛 바퀴를 단 작은 마차와 앞으로 뻗은 리본",
    result: "망설이던 첫걸음을 내디딜 때 속도가 붙기 시작합니다",
    front: null, back: null
  },
  8: {
    motif: "꽃 화관을 쓴 사자를 부드럽게 쓰다듬는 손",
    result: "서두르지 않고 한 번 더 기다릴 때 상대가 먼저 손을 내밉니다",
    front: null, back: null
  },
  9: {
    motif: "별 하나를 담은 등불과 눈 덮인 산길",
    result: "혼자 조용히 정리하는 시간에 놓쳤던 답이 떠오릅니다",
    front: null, back: null
  },
  11: {
    motif: "깃털과 별이 균형을 이룬 저울",
    result: "미뤄 둔 약속을 정확히 지킬 때 믿음이 기회로 돌아옵니다",
    front: null, back: null
  },
  13: {
    motif: "검은 리본이 풀리며 피어나는 흰 꽃",
    result: "오래 끌던 일을 끝낼 때 새 기회가 들어옵니다",
    front: null, back: null
  },
  14: {
    motif: "두 잔 사이를 오가는 물줄기와 무지개",
    result: "서로 다른 둘을 섞어 볼 때 생각지 못한 조합이 빛납니다",
    front: null, back: null
  },
  15: {
    motif: "느슨하게 풀린 사슬과 열린 새장",
    result: "끊지 못한 습관 하나를 내려놓을 때 그 시간이 기회로 바뀝니다",
    front: null, back: null
  },
  17: {
    motif: "하늘색 밤에 길게 빛을 흘리는 별",
    result: "좋아하는 걸 보여 줄 때 취향이 맞는 사람이 먼저 다가옵니다",
    front: null, back: null
  },
  18: {
    motif: "초승달 아래 두 탑 사이로 굽이쳐 흐르는 빛의 강",
    result: "익숙한 선택지 밖을 살펴볼 때 새 기회가 보입니다",
    front: "images/cards/18-moon-front.webp",
    back: "images/cards/18-moon-back.webp"
  }
};
