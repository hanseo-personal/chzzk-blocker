// content.js

let blockedTags = []; // 크롬 스토리지에서 불러올 차단 태그 목록
let isEnabled = true; // '방송 차단 기능' 활성화/비활성화 상태
let isPreviewBlocked = true; // '대문 미리보기' 활성화/비활성화 상태 (true면 숨김)
let isBannerBlocked = true; // '배너 제거' 활성화/비활성화 상태 (새로 추가)

// 모든 가능한 방송 카드 셀렉터를 쉼표로 연결하여 전역 변수로 선언합니다.
const allStreamCardSelectors = 'li.home_component_item__fFarx, li.navigation_component_item__iMPOI, li.category_component_item__Sx3co, div.video_card_container__urjO6.video_card_vertical__+gTMT';

// 방송 카드들을 숨기는 주 함수
function hideBlockedStreams() {
  document.querySelectorAll(allStreamCardSelectors).forEach(card => {
    delete card.dataset.chzzkBlockerProcessed;
    card.style.display = ''; // 일단 모두 표시 상태로 초기화
  });

  if (!isEnabled) {
    console.log("chzzk-bl ocker: 방송 차단 기능 비활성화됨. 모든 방송을 표시합니다.");
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
  // hideBlockedStreams 호출 후에도 미리보기/배너 상태 적용을 확실히 함
  handlePreviewVisibility();
  handleBannerVisibility();
}

// 대문 미리보기 숨기기/표시하기 함수
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
  }
}

// 배너 숨기기/표시하기 함수 (클래스 이름 업데이트)
function handleBannerVisibility() {
  // 제공해주신 소스 코드를 바탕으로 가장 정확한 셀렉터를 맨 앞으로 배치합니다.
  const bannerContainer = document.querySelector(
    '.top_banner_container__Nk\\+98, ' + // **제공해주신 소스에서 찾은 정확한 클래스 (가장 우선)**
    '.home_list_container__vqLLO.top_banner_container__Nk\\+98, ' + // section 태그와 함께
    '.home_promotion_banner_area__some_hash, ' +
    '.promotion_area__some_id, ' +
    '.banner_container__another_id, ' +
    '.main_banner_area__some_hash, ' +
    '.home_main_banner__some_hash, ' +
    '.live_all_main_banner_area__some_hash, ' +
    'div[class*="main_banner__"], ' +
    'div[class*="promotion_banner__"], ' +
    'div[class*="banner_slot__"]'
  );

  if (bannerContainer) {
    if (isBannerBlocked) {
      bannerContainer.style.display = 'none';
      console.log('chzzk-blocker: 배너 숨김.');
    } else {
      bannerContainer.style.display = '';
      console.log('chzzk-blocker: 배너 표시.');
    }
  } else {
    console.log('chzzk-blocker: 배너 컨테이너를 찾을 수 없습니다.');
  }
}

// 초기 설정 로드 및 적용
function initializeSettingsAndApply() {
  chrome.storage.sync.get(['blockedTags', 'chzzkBlockerEnabled', 'chzzkPreviewBlockerEnabled', 'chzzkBannerBlockerEnabled'], function(result) {
    if (result.blockedTags) {
      blockedTags = result.blockedTags;
    }
    isEnabled = result.chzzkBlockerEnabled !== undefined ? result.chzzkBlockerEnabled : true;
    isPreviewBlocked = result.chzzkPreviewBlockerEnabled !== undefined ? result.chzzkPreviewBlockerEnabled : true;
    isBannerBlocked = result.chzzkBannerBlockerEnabled !== undefined ? result.chzzkBannerBlockerEnabled : true;

    console.log('chzzk-blocker: 초기 설정 로드 - 태그:', blockedTags, '방송 차단 활성화:', isEnabled, '미리보기 숨김:', isPreviewBlocked, '배너 숨김:', isBannerBlocked);
    // 초기 로드 시에도 즉시 모든 설정 적용
    hideBlockedStreams(); // 이 함수 내에서 미리보기와 배너 함수도 호출됩니다.
  });
}

// 스토리지 변경 감지
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
      handlePreviewVisibility(); // 미리보기 상태 변경 시 즉시 적용
    }
    if (changes.chzzkBannerBlockerEnabled) {
      isBannerBlocked = changes.chzzkBannerBlockerEnabled.newValue;
      console.log('chzzk-blocker: 배너 숨김 상태 업데이트:', isBannerBlocked);
      handleBannerVisibility(); // 배너 숨김 상태 변경 시 즉시 적용
    }
    hideBlockedStreams(); // 모든 변경 후 재처리 (미리보기/배너 포함)
  }
});

// MutationObserver 설정
const observer = new MutationObserver((mutations) => {
  let newContentAdded = false;
  let previewContainerFound = false;
  let bannerContainerFound = false;

  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
        if (node.nodeType === 1) { // 요소 노드인 경우에만 처리
          // 방송 카드 감지
          if (node.matches(allStreamCardSelectors) || node.querySelector(allStreamCardSelectors)) {
            newContentAdded = true;
          }
          // 대문 미리보기 컨테이너 감지
          if (node.matches('.home_recommend_live_container__y16wk') || node.querySelector('.home_recommend_live_container__y16wk')) {
            previewContainerFound = true;
          }
          // 배너 컨테이너 감지 (새로운 클래스 포함)
          if (node.matches('.top_banner_container__Nk\\+98') || node.querySelector('.top_banner_container__Nk\\+98')) {
            bannerContainerFound = true;
          }
          if (node.matches('div[class*="banner__"]') || node.querySelector('div[class*="banner__"]')) {
            bannerContainerFound = true;
          }
        }
      }
    }
  });

  if (newContentAdded) {
    console.log('chzzk-blocker: 새로운 방송 콘텐츠 감지. 재검사합니다.');
    hideBlockedStreams();
  }
  if (previewContainerFound) {
    console.log('chzzk-blocker: 대문 미리보기 컨테이너 감지. 상태 적용합니다.');
    handlePreviewVisibility(); // 미리보기 컨테이너가 로드되면 즉시 상태 적용
  }
  if (bannerContainerFound) {
    console.log('chzzk-blocker: 배너 컨테이너 감지. 상태 적용합니다.');
    handleBannerVisibility(); // 배너 컨테이너가 로드되면 즉시 상태 적용
  }
});


// DOMContentLoaded 이벤트 리스너를 사용하여 초기 설정 및 옵저버 시작을 보장합니다.
// 이렇게 하면 DOM이 완전히 로드된 후 스크립트가 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
  initializeSettingsAndApply(); // 초기 설정 로드 및 모든 숨김 기능 적용

  // MutationObserver를 document.body에 연결하여 페이지 전체의 동적 변화를 감지합니다.
  // body가 아직 로드되지 않았을 경우를 대비하여 한 번 더 확인합니다.
  const targetNode = document.body;
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true
    });
    console.log('chzzk-blocker: MutationObserver started on document.body for dynamic content.');
  } else {
    console.error('chzzk-blocker: document.body를 찾을 수 없습니다. MutationObserver를 시작할 수 없습니다.');
  }
});

// 만약 DOMContentLoaded가 너무 일찍 발생하여 동적으로 로드되는 콘텐츠를 놓치는 경우를 대비하여
// requestAnimationFrame을 사용하여 DOM이 안정화될 때까지 반복적으로 검사하도록 합니다.
let checkAttempts = 0;
const maxCheckAttempts = 100; // 최대 100번 시도 (약 1.6초)

function checkAndApplyStylesPeriodically() {
  if (checkAttempts < maxCheckAttempts) {
    // 이미 hideBlockedStreams()에서 처리하지만, 혹시 놓친 부분이 있을까봐 명시적으로 다시 호출
    handlePreviewVisibility();
    handleBannerVisibility();

    // 방송 카드도 다시 한번 확인 (hideBlockedStreams는 이미 호출됨)
    // document.querySelectorAll(allStreamCardSelectors).forEach(card => {
    //     if (!card.dataset.chzzkBlockerProcessed) {
    //         hideBlockedStreams(); // 처리되지 않은 카드가 있다면 전체 재실행
    //         return;
    //     }
    // });

    checkAttempts++;
    requestAnimationFrame(checkAndApplyStylesPeriodically);
  } else {
    console.log('chzzk-blocker: 주기적인 스타일 적용 시도 종료.');
  }
}

// 페이지 로드 후 즉시 주기적인 체크 시작
requestAnimationFrame(checkAndApplyStylesPeriodically);
