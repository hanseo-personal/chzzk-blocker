// content.js

let blockedTags = [];
let isEnabled = true;
let isPreviewBlocked = true;
let isBannerBlocked = true;
let isChzzkBlockedUserStreamBlocked = true; // ✨ 치지직 자체 차단 방송 숨김 여부

// --- 셀렉터 강화 ---
const allStreamCardSelectors =
  'li.home_component_item__fFarx, ' +
  'li.navigation_component_item__iMPOI, ' +
  'li.category_component_item__Sx3co, ' +
  'li[class*="home_list_item__"], ' +
  'li[class*="component_item__"], ' +
  'div.video_card_container__urjO6.video_card_vertical__+gTMT, ' +
  'div[class*="video_card_container__"], ' +
  'div[class*="stream_card__"], ' +
  'div[class*="live_item__"], ' +
  'div[class*="LiveCard_live_card__"], ' +
  'div[class*="LiveList_live_item__"]';

const allTagSelectors =
  '.video_card_category__xQ15T, ' +
  'span[class*="tag_item__"], ' +
  'span[class*="category_tag__"], ' +
  'div[class*="tag_list__"] span, ' +
  'a[class*="tag_text__"]';

const bannerContainerSelectors =
  '.top_banner_container__Nk\\+98, ' +
  '.home_list_container__vqLLO.top_banner_container__Nk\\+98, ' +
  'section[class*="top_banner_container__"], ' +
  'div[class*="banner_area__"], ' +
  'div[class*="promotion_banner__"], ' +
  'div[class*="main_banner__"], ' +
  'div[class*="banner_slot__"], ' +
  'div[class*="ad_wrap__"], ' +
  'div[class*="gnb_banner__"]';

const previewContainerSelectors =
  '.home_recommend_live_container__y16wk, ' +
  'section[class*="recommend_live_container__"], ' +
  'div[class*="recommend_live_list__"], ' +
  'div[class*="live_recommend_area__"]';

// 치지직 자체 차단 유저 라이브 셀렉터 (이번에는 LI 태그 자체를 대상으로)
const chzzkBlockedUserStreamSelectors =
  'li.category_component_item__Sx3co:has(div.video_card_is_block__cGuyo), ' + // ✨ 변경: LI에 직접 적용
  'li[class*="home_list_item__"]:has(div.video_card_is_block__cGuyo)'; // ✨ 변경: LI에 직접 적용

// CSS 규칙을 동적으로 삽입하여 요소를 즉시 숨김
function injectCSSRules() {
  let style = document.getElementById('chzzk-blocker-style');
  if (!style) {
    style = document.createElement('style');
    style.id = 'chzzk-blocker-style';
    (document.head || document.documentElement).appendChild(style);
  }
  let sheet = style.sheet;

  while(sheet && sheet.cssRules.length > 0) {
    sheet.deleteRule(0);
  }

  if (isBannerBlocked) {
    sheet.insertRule(`${bannerContainerSelectors} { display: none !important; }`, sheet.cssRules.length);
    console.log('chzzk-blocker: CSS로 배너 숨김 규칙 적용.');
  }
  if (isPreviewBlocked) {
    sheet.insertRule(`${previewContainerSelectors} { display: none !important; }`, sheet.cssRules.length);
    console.log('chzzk-blocker: CSS로 미리보기 숨김 규칙 적용.');
  }
  // ✨ 변경: 치지직 자체 차단 방송 숨김 규칙을 다시 display: none !important로 변경하여 공간 자체를 제거
  if (isChzzkBlockedUserStreamBlocked) {
    sheet.insertRule(`${chzzkBlockedUserStreamSelectors} { display: none !important; }`, sheet.cssRules.length);
    console.log('chzzk-blocker: CSS로 치지직 자체 차단 방송 빈 공간 제거 규칙 적용.');
  }
}


// 방송 카드들을 숨기는 주 함수
function hideBlockedStreams() {
  const streamCards = document.querySelectorAll(allStreamCardSelectors);

  streamCards.forEach(card => {
    card.style.removeProperty('display');
    card.style.removeProperty('visibility');
    card.style.removeProperty('width');
    card.style.removeProperty('height');
    card.style.removeProperty('margin');
    card.style.removeProperty('padding');
    card.style.removeProperty('overflow');
    card.style.removeProperty('flex-shrink');
    card.style.removeProperty('order');
    card.style.display = '';
    delete card.dataset.chzzkBlockerProcessed;
  });


  if (!isEnabled) {
    console.log("chzzk-blocker: 방송 차단 기능 비활성화됨. 모든 방송을 표시합니다.");
    return;
  }

  if (!blockedTags || blockedTags.length === 0) {
    console.log("chzzk-blocker: 차단 태그가 없습니다. 모든 방송을 표시합니다.");
    return;
  }

  console.log("chzzk-blocker: 현재 차단 태그 목록:", blockedTags);

  streamCards.forEach(card => {
    if (card.dataset.chzzkBlockerProcessed) {
      return;
    }

    let actualCardContent = card;
    if (card.tagName === 'LI') {
      actualCardContent = card.querySelector('div[class*="video_card_container__"]');
      // 치지직 자체 차단 방송은 여기서 스킵
      if (actualCardContent && actualCardContent.classList.contains('video_card_is_block__cGuyo')) {
        card.dataset.chzzkBlockerProcessed = true;
        return;
      }
      if (!actualCardContent) {
        card.dataset.chzzkBlockerProcessed = true;
        return;
      }
    } else { // card가 DIV인 경우 (allStreamCardSelectors에 DIV도 포함되므로)
      if (card.classList.contains('video_card_is_block__cGuyo')) {
        card.dataset.chzzkBlockerProcessed = true;
        return;
      }
    }


    const categoryTagElements = actualCardContent.querySelectorAll(allTagSelectors);
    let shouldBlock = false;

    for (const tagElement of categoryTagElements) {
      const tagName = tagElement.textContent.trim();
      if (blockedTags.map(t => t.toLowerCase()).includes(tagName.toLowerCase())) {
        shouldBlock = true;
        break;
      }
    }

    if (shouldBlock) {
      console.log(`=> 차단! 해당 방송 카드 숨김: ${actualCardContent.querySelector('.video_card_title__Amjk2')?.textContent.trim() || '제목 없음'}`);
      card.style.setProperty('display', 'block', 'important');
      card.style.setProperty('visibility', 'hidden', 'important');
      card.style.setProperty('width', '0px', 'important');
      card.style.setProperty('height', '0px', 'important');
      card.style.setProperty('margin', '0px', 'important');
      card.style.setProperty('padding', '0px', 'important');
      card.style.setProperty('overflow', 'hidden', 'important');
      card.style.setProperty('flex-shrink', '1', 'important');
      card.style.setProperty('order', '9999', 'important');
    } else {
      card.style.removeProperty('display');
      card.style.removeProperty('visibility');
      card.style.removeProperty('width');
      card.style.removeProperty('height');
      card.style.removeProperty('margin');
      card.style.removeProperty('padding');
      card.style.removeProperty('overflow');
      card.style.removeProperty('flex-shrink');
      card.style.removeProperty('order');
      card.style.display = '';
    }
    card.dataset.chzzkBlockerProcessed = true;
  });
}

// 스토리지에서 설정 로드 및 적용
function loadSettingsAndApply() {
  chrome.storage.sync.get(['blockedTags', 'chzzkBlockerEnabled', 'chzzkPreviewBlockerEnabled', 'chzzkBannerBlockerEnabled', 'chzzkBlockedUserStreamBlocked'], function(result) {
    if (result.blockedTags) {
      blockedTags = result.blockedTags;
    }
    isEnabled = result.chzzkBlockerEnabled !== undefined ? result.chzzkBlockerEnabled : true;
    isPreviewBlocked = result.chzzkPreviewBlockerEnabled !== undefined ? result.chzzkPreviewBlockerEnabled : true;
    isBannerBlocked = result.chzzkBannerBlockerEnabled !== undefined ? result.chzzkBannerBlockerEnabled : true;
    isChzzkBlockedUserStreamBlocked = result.chzzkBlockedUserStreamBlocked !== undefined ? result.chzzkBlockedUserStreamBlocked : true;

    console.log('chzzk-blocker: 설정 로드 - 태그:', blockedTags, '방송 차단 활성화:', isEnabled, '미리보기 숨김:', isPreviewBlocked, '배너 숨김:', isBannerBlocked, '치지직 자체 차단 방송 숨김:', isChzzkBlockedUserStreamBlocked);

    injectCSSRules();
    hideBlockedStreams();
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
    }
    if (changes.chzzkBannerBlockerEnabled) {
      isBannerBlocked = changes.chzzkBannerBlockerEnabled.newValue;
      console.log('chzzk-blocker: 배너 숨김 상태 업데이트:', isBannerBlocked);
    }
    if (changes.chzzkBlockedUserStreamBlocked) {
      isChzzkBlockedUserStreamBlocked = changes.chzzkBlockedUserStreamBlocked.newValue;
      console.log('chzzk-blocker: 치지직 자체 차단 방송 숨김 상태 업데이트:', isChzzkBlockedUserStreamBlocked);
    }
    injectCSSRules();
    hideBlockedStreams();
  }
});

// MutationObserver 설정
const observer = new MutationObserver((mutations) => {
  let contentChanged = false;
  let styleAttributeChangedOnBlockedCard = false;

  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      for (let i = 0; i < mutation.addedNodes.length; i++) {
        const node = mutation.addedNodes[i];
        if (node.nodeType === 1) {
          if (node.matches(allStreamCardSelectors) || node.querySelector(allStreamCardSelectors) ||
            node.matches(bannerContainerSelectors) || node.querySelector(bannerContainerSelectors) ||
            node.matches(previewContainerSelectors) || node.querySelector(previewContainerSelectors) ||
            node.matches(chzzkBlockedUserStreamSelectors) || node.querySelector(chzzkBlockedUserStreamSelectors)) {
            contentChanged = true;
          }
        }
      }
    }
    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
      if (mutation.target.matches(allStreamCardSelectors) ||
        mutation.target.closest(allStreamCardSelectors) ||
        mutation.target.matches(chzzkBlockedUserStreamSelectors) ||
        mutation.target.closest(chzzkBlockedUserStreamSelectors)) {
        if (mutation.target.style.display === 'none' && mutation.target.style.visibility !== 'hidden') {
          console.log(`chzzk-blocker: 감지된 요소의 인라인 style 변경 (display: none). 재처리합니다.`);
          styleAttributeChangedOnBlockedCard = true;
        }
      }
    }
  });

  if (contentChanged || styleAttributeChangedOnBlockedCard) {
    console.log('chzzk-blocker: DOM/스타일 변경 감지. 스타일 재적용합니다.');
    injectCSSRules();
    hideBlockedStreams();
  }
});

// DOMContentLoaded 이벤트 리스너를 사용하여 초기 설정 및 옵저버 시작을 보장합니다.
document.addEventListener('DOMContentLoaded', () => {
  loadSettingsAndApply();

  const targetNode = document.body;
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style']
    });
    console.log('chzzk-blocker: MutationObserver started on document.body with style attribute monitoring.');
  } else {
    console.error('chzzk-blocker: document.body를 찾을 수 없습니다. MutationObserver를 시작할 수 없습니다.');
  }
});

// `requestAnimationFrame`을 이용한 주기적 확인 로직 (보조적인 역할)
let checkAttempts = 0;
const maxCheckAttempts = 100;

function checkAndApplyStylesPeriodically() {
  if (checkAttempts < maxCheckAttempts) {
    hideBlockedStreams();
    checkAttempts++;
    requestAnimationFrame(checkAndApplyStylesPeriodically);
  } else {
    console.log('chzzk-blocker: 주기적인 스타일 적용 시도 종료.');
  }
}

requestAnimationFrame(checkAndApplyStylesPeriodically);
