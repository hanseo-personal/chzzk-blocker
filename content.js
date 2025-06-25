// content.js

let blockedTags = []; // 크롬 스토리지에서 불러올 차단 태그 목록
let isEnabled = true; // '방송 차단 기능' 활성화/비활성화 상태
let isPreviewBlocked = true; // '대문 미리보기' 활성화/비활성화 상태 (true면 숨김)

// 모든 가능한 방송 카드 셀렉터를 쉼표로 연결하여 전역 변수로 선언합니다.
const allStreamCardSelectors = 'li.home_component_item__fFarx, li.navigation_component_item__iMPOI, li.category_component_item__Sx3co, div.video_card_container__urjO6.video_card_vertical__+gTMT';

// 방송 카드들을 숨기는 주 함수
function hideBlockedStreams() {
  document.querySelectorAll(allStreamCardSelectors).forEach(card => {
    delete card.dataset.chzzkBlockerProcessed;
    card.style.display = ''; // 일단 모두 표시 상태로 초기화
  });

  if (!isEnabled) {
    console.log("chzzk-blocker: 방송 차단 기능 비활성화됨. 모든 방송을 표시합니다.");
  } else if (!blockedTags || blockedTags.length === 0) {
    console.log("chzzk-blocker: 차단 태그가 없습니다. 모든 방송을 표시합니다.");
  } else {
    console.log("chzzk-blocker: 현재 차단 태그 목록:", blockedTags);
    const streamCards = document.querySelectorAll(allStreamCardSelectors);
    streamCards.forEach(card => {
      if (card.dataset.chzzkBlockerProcessed) {
        return;
      }

      const categoryTagElements = card.querySelectorAll('.video_card_category__xQ15T');
      let currentCardTags = [];
      let shouldBlock = false;

      for (const tagElement of categoryTagElements) {
        const tagName = tagElement.textContent.trim();
        currentCardTags.push(tagName);

        if (blockedTags.map(t => t.toLowerCase()).includes(tagName.toLowerCase())) {
          shouldBlock = true;
          break;
        }
      }
      // console.log(`방송 카드 (제목: ${card.querySelector('.video_card_title__Amjk2')?.textContent.trim() || '제목 없음'}) - 감지된 태그: [${currentCardTags.join(', ')}]`); // 너무 많은 로그 방지

      if (shouldBlock) {
        console.log(`=> 차단! 해당 방송 카드 숨김: ${card.querySelector('.video_card_title__Amjk2')?.textContent.trim() || '제목 없음'}`);
        card.style.display = 'none'; // 방송 카드 전체를 숨김
      }
      card.dataset.chzzkBlockerProcessed = true;
    });
  }
  handlePreviewVisibility();
}

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

chrome.storage.sync.get(['blockedTags', 'chzzkBlockerEnabled', 'chzzkPreviewBlockerEnabled'], function(result) {
  if (result.blockedTags) {
    blockedTags = result.blockedTags;
  }
  isEnabled = typeof result.chzzkBlockerEnabled === 'undefined' ? true : result.chzzkBlockerEnabled;
  isPreviewBlocked = typeof result.chzzkPreviewBlockerEnabled === 'undefined' ? true : result.chzzkPreviewBlockerEnabled;

  console.log('chzzk-blocker: 초기 설정 로드 - 태그:', blockedTags, '방송 차단 활성화:', isEnabled, '미리보기 숨김:', isPreviewBlocked);
  hideBlockedStreams();
});

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

const observer = new MutationObserver((mutations) => {
  let newContentAdded = false;
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
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

// **강화된 대상 노드 탐색 로직 (가장 안정적이고 광범위한 셀렉터 우선)**
// 치지직 페이지의 주요 콘텐츠 영역을 감싸는 다양한 잠재적 클래스를 추가했습니다.
const potentialSelectors = [
  '.app_main__vYx3W',             // 앱의 메인 컨테이너
  '.main_content__3Gz7_',         // 메인 콘텐츠 영역 (홈, 탐색, 카테고리 등)
  '.main_live__g1G13',            // 라이브 목록을 직접 감싸는 컨테이너일 가능성
  '.home_recommend_live_container__y16wk', // 홈 페이지 추천 라이브 컨테이너
  'ul.category_component_list__S8_8f', // 카테고리 페이지의 라이브 목록
  '.main_home__E04Lp',            // 홈 페이지의 메인 컨테이너
  '.main_navigation__d7s6g',      // 전체 방송 페이지의 네비게이션 메인 컨테이너
  '.main_channel__Mv6bU',         // 채널 페이지의 메인 컨테이너 (새로운 추가)
  '.css-1dbjc4n.r-1l5rcj .r-1wt4aef', // 기존에 확인된 복잡한 셀렉터
  'div[class*="main_page__"]',    // 'main_page__'로 시작하는 클래스를 가진 div (더 일반적인 패턴)
  'div[class*="content_area__"]'  // 'content_area__'로 시작하는 클래스를 가진 div (더 일반적인 패턴)
];

for (const selector of potentialSelectors) {
  targetNode = document.querySelector(selector);
  if (targetNode) {
    console.log(`chzzk-blocker: 대상 노드 (${selector}) 발견.`);
    break;
  }
}

// 5. 최후의 수단: body 전체 관찰 (여전히 경고가 뜬다면)
if (!targetNode) {
  targetNode = document.body;
  console.warn('chzzk-blocker: 특정 대상 노드를 찾을 수 없어 document.body를 관찰합니다. 성능 저하가 있을 수 있습니다. 개발자 도구로 치지직 라이브 목록을 감싸는 안정적인 부모 요소의 CSS 클래스를 찾아 제보해주세요.');
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
