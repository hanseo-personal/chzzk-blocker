// content.js

let blockedTags = []; // 크롬 스토리지에서 불러올 차단 태그 목록
let isEnabled = true; // '방송 차단 기능' 활성화/비활성화 상태
let isPreviewBlocked = true; // '대문 미리보기' 활성화/비활성화 상태 (true면 숨김)

// 모든 가능한 방송 카드 셀렉터를 쉼표로 연결하여 사용합니다.
// 이 변수를 전역 스코프로 이동시킵니다.
const allStreamCardSelectors = 'li.home_component_item__fFarx, li.navigation_component_item__iMPOI, li.category_component_item__Sx3co, div.video_card_container__urjO6.video_card_vertical__+gTMT'; // <-- 이 부분이 변경됩니다!


// 방송 카드들을 숨기는 주 함수
function hideBlockedStreams() {
  // 1. '방송 차단 기능' 토글 상태에 따라 방송 카드 처리
  if (!isEnabled) {
    console.log("chzzk-blocker: 방송 차단 기능 비활성화됨. 모든 방송을 표시합니다.");
    document.querySelectorAll(allStreamCardSelectors).forEach(card => {
      card.style.display = ''; // 모두 표시
    });
  } else if (!blockedTags || blockedTags.length === 0) {
    console.log("chzzk-blocker: 차단 태그가 없습니다. 모든 방송을 표시합니다.");
    document.querySelectorAll(allStreamCardSelectors).forEach(card => {
      card.style.display = ''; // 모두 표시
    });
  } else {
    console.log("chzzk-blocker: 현재 차단 태그 목록:", blockedTags);
    const streamCards = document.querySelectorAll(allStreamCardSelectors);
    streamCards.forEach(card => {
      // 이미 처리된 카드인지 확인 (중복 처리 방지)
      if (card.dataset.chzzkBlockerProcessed) {
        return;
      }

      card.style.display = ''; // 일단 기본 상태로 돌려놓고 재판단

      const categoryTagElements = card.querySelectorAll('.video_card_category__xQ15T');
      let currentCardTags = [];
      let shouldBlock = false;

      for (const tagElement of categoryTagElements) {
        const tagName = tagElement.textContent.trim();
        currentCardTags.push(tagName);

        // 태그 비교 시 대소문자 구분 없이 처리
        if (blockedTags.map(t => t.toLowerCase()).includes(tagName.toLowerCase())) {
          shouldBlock = true;
          break;
        }
      }
      console.log(`방송 카드 (제목: ${card.querySelector('.video_card_title__Amjk2')?.textContent.trim() || '제목 없음'}) - 감지된 태그: [${currentCardTags.join(', ')}]`);

      if (shouldBlock) {
        console.log(`=> 차단! 해당 방송 카드 숨김: ${card.querySelector('.video_card_title__Amjk2')?.textContent.trim() || '제목 없음'}`);
        card.style.display = 'none'; // 방송 카드 전체를 숨김
      }
      // 처리 완료 플래그 추가
      card.dataset.chzzkBlockerProcessed = true;
    });
  }

  // 2. '대문 미리보기' 토글 상태에 따라 미리보기 섹션 처리
  handlePreviewVisibility();
}

// 대문 미리보기 숨기기/표시하기 함수 (이전과 동일)
function handlePreviewVisibility() {
  const previewContainer = document.querySelector('.home_recommend_live_container__y16wk');
  if (previewContainer) {
    if (isPreviewBlocked) {
      previewContainer.style.display = 'none';
      console.log('chzzk-blocker: 대문 미리보기 숨김.');
    } else {
      previewContainer.style.display = '';
      console.log('chzzk-blocker: 대문 미리보기 표시.');
    }
  } else {
    console.log('chzzk-blocker: 대문 미리보기 컨테이너를 찾을 수 없습니다.');
  }
}

// 초기 설정 (태그 목록, 방송 차단 기능, 대문 미리보기 활성화 상태)을 불러옵니다. (이전과 동일)
chrome.storage.sync.get(['blockedTags', 'chzzkBlockerEnabled', 'chzzkPreviewBlockerEnabled'], function(result) {
  if (result.blockedTags) {
    blockedTags = result.blockedTags;
  }
  isEnabled = typeof result.chzzkBlockerEnabled === 'undefined' ? true : result.chzzkBlockerEnabled;
  isPreviewBlocked = typeof result.chzzkPreviewBlockerEnabled === 'undefined' ? true : result.chzzkPreviewBlockerEnabled;

  console.log('chzzk-blocker: 초기 설정 로드 - 태그:', blockedTags, '방송 차단 활성화:', isEnabled, '미리보기 숨김:', isPreviewBlocked);
  hideBlockedStreams();
});

// 크롬 스토리지의 변경 사항을 감지하여 실시간으로 반영합니다. (이전과 동일)
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync') {
    if (changes.blockedTags) {
      blockedTags = changes.blockedTags.newValue || [];
      console.log('chzzk-blocker: 차단 태그 목록 업데이트:', blockedTags);
    }
    if (changes.chzzkBlockerEnabled) {
      isEnabled = changes.chzzkBlockerEnabled.newValue;
      console.log('chzzk-blocker: 방송 차단 활성화 상태 업데이트:', isEnabled);
    }
    if (changes.chzzkPreviewBlockerEnabled) {
      isPreviewBlocked = changes.chzzkPreviewBlockerEnabled.newValue;
      console.log('chzzk-blocker: 대문 미리보기 숨김 상태 업데이트:', isPreviewBlocked);
    }
    hideBlockedStreams();
  }
});

// MutationObserver를 사용하여 페이지의 동적 변화를 감지합니다.
const observer = new MutationObserver((mutations) => {
  let newContentAdded = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
        // 모든 가능한 방송 카드 셀렉터를 사용하여 새롭게 추가된 노드를 감지합니다.
        // allStreamCardSelectors는 이제 전역 변수이므로 접근 가능합니다.
        if (node.nodeType === 1 && (node.matches(allStreamCardSelectors) || node.querySelector(allStreamCardSelectors))) {
          newContentAdded = true;
          break;
        }
      }
    }
  });
  if (newContentAdded) {
    console.log('chzzk-blocker: 새로운 방송 콘텐츠 감지. 재검사합니다.');
    hideBlockedStreams();
  }
});

let targetNode = null;

// '전체 방송' 페이지 컨테이너 우선 탐색
targetNode = document.querySelector('.main_navigation__d7s6g');
if (targetNode) {
  console.log('chzzk-blocker: 대상 노드 (.main_navigation__d7s6g) 발견.');
}

// 홈 페이지 컨테이너
if (!targetNode) {
  targetNode = document.querySelector('.main_home__E04Lp');
  if (targetNode) {
    console.log('chzzk-blocker: 대상 노드 (.main_home__E04Lp) 발견.');
  }
}

// Fallback 컨테이너 (채널 페이지 등)
if (!targetNode) {
  targetNode = document.querySelector('.css-1dbjc4n.r-1l5rcj .r-1wt4aef');
  if (targetNode) {
    console.log('chzzk-blocker: 대상 노드 (.css-1dbjc4n.r-1l5rcj .r-1wt4aef) 발견.');
  }
}

// **추가: 라이브 카드 목록을 직접 감싸는 ul.category_component_list__S8_8f (가장 흔한 부모 요소 중 하나)**
if (!targetNode) {
  targetNode = document.querySelector('ul.category_component_list__S8_8f');
  if (targetNode) {
    console.log('chzzk-blocker: 대상 노드 (ul.category_component_list__S8_8f) 발견.');
  }
}

// 최후의 수단: body 전체 관찰
if (!targetNode) {
  targetNode = document.body;
  console.warn('chzzk-blocker: 특정 대상 노드를 찾을 수 없어 document.body를 관찰합니다. 성능 저하가 있을 수 있습니다.');
}


if (targetNode) {
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
  console.log('chzzk-blocker: MutationObserver started on:', targetNode);
} else {
  console.error('chzzk-blocker: MutationObserver를 시작할 대상 노드를 찾을 수 없습니다. 확장 프로그램이 예상대로 작동하지 않을 수 있습니다.');
}
