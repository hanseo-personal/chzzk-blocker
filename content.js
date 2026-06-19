// content.js

let blockedTags = [];
let isEnabled = true;
let isPreviewBlocked = true;
let isBannerBlocked = true;
let isChzzkBlockedUserStreamBlocked = true;
let isToolbarEventBlocked = true;
let isLiveChattingInputTooltipBlocked = true;

// 현재 CHZZK 방송 카드 구조 기준
const allStreamCardSelectors =
  'li:has(a[href^="/live/"]):has(a[href*="/category/"])';

// 현재 CHZZK 카테고리/태그 구조 기준
const allTagSelectors =
  'a[href*="/category/"] span, ' +
  'a[href*="tags="] span, ' +
  'span[class*="_category_"]';

const bannerContainerSelectors =
  'section[class*="_container_"]:has(.flicking-viewport):has(a[class*="_container_vdt37_"]), ' +
  'section[class*="_container_"]:has(.flicking-camera):has(a[class*="_container_vdt37_"]), ' +
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
  'section[class*="_container_"]:has(video.webplayer-internal-video):has(a[href^="/live/"]), ' +
  'section[class*="_container_"]:has(div[class*="_player_"]):has(a[href^="/live/"]), ' +
  '.home_recommend_live_container__y16wk, ' +
  'section[class*="recommend_live_container__"], ' +
  'div[class*="recommend_live_list__"], ' +
  'div[class*="live_recommend_area__"]';

const chzzkBlockedUserStreamSelectors =
  'li.category_component_item__Sx3co:has(div.video_card_is_block__cGuyo), ' +
  'li[class*="home_list_item__"]:has(div.video_card_is_block__cGuyo), ' +
  'li:has(a[href^="/live/"]):has(div[class*="is_block"])';

const toolbarEventTooltipSelectors =
  'span.toolbar_tooltip__1tjo3';

const liveChattingInputTooltipSelectors =
  'span.live_chatting_input_tooltip__1k-j9';

function injectCSSRules() {
  let style = document.getElementById('chzzk-blocker-style');

  if (!style) {
    style = document.createElement('style');
    style.id = 'chzzk-blocker-style';
    (document.head || document.documentElement).appendChild(style);
  }

  const sheet = style.sheet;
  if (!sheet) return;

  while (sheet.cssRules.length > 0) {
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

  if (isChzzkBlockedUserStreamBlocked) {
    sheet.insertRule(`${chzzkBlockedUserStreamSelectors} { display: none !important; }`, sheet.cssRules.length);
    console.log('chzzk-blocker: CSS로 치지직 자체 차단 방송 숨김 규칙 적용.');
  }

  if (isToolbarEventBlocked) {
    sheet.insertRule(`${toolbarEventTooltipSelectors} { display: none !important; }`, sheet.cssRules.length);
    console.log('chzzk-blocker: CSS로 툴바 이벤트 알림 숨김 규칙 적용.');
  }

  if (isLiveChattingInputTooltipBlocked) {
    sheet.insertRule(`${liveChattingInputTooltipSelectors} { display: none !important; }`, sheet.cssRules.length);
    console.log('chzzk-blocker: CSS로 채팅창 이벤트 알림 숨김 규칙 적용.');
  }
}

function normalizeText(text) {
  return (text || '').trim().toLowerCase();
}

function getCardTitle(card) {
  return (
    card.querySelector('a[class*="_title_"]')?.textContent?.trim() ||
    card.querySelector('.video_card_title__Amjk2')?.textContent?.trim() ||
    '제목 없음'
  );
}

function resetStreamCards() {
  document.querySelectorAll(allStreamCardSelectors).forEach(card => {
    card.style.removeProperty('display');
  });
}

function hideBlockedStreams() {
  const streamCards = document.querySelectorAll(allStreamCardSelectors);

  if (!isEnabled) {
    resetStreamCards();
    console.log('chzzk-blocker: 방송 차단 기능 비활성화됨. 모든 방송을 표시합니다.');
    return;
  }

  if (!blockedTags || blockedTags.length === 0) {
    resetStreamCards();
    console.log('chzzk-blocker: 차단 태그가 없습니다. 모든 방송을 표시합니다.');
    return;
  }

  const normalizedBlockedTags = blockedTags.map(normalizeText);

  console.log('chzzk-blocker: 현재 차단 태그 목록:', blockedTags);
  console.log('chzzk-blocker: 감지된 방송 카드 수:', streamCards.length);

  streamCards.forEach(card => {
    const tagElements = card.querySelectorAll(allTagSelectors);

    const tagNames = [...tagElements]
      .map(tag => normalizeText(tag.textContent))
      .filter(Boolean);

    const shouldBlock = tagNames.some(tagName =>
      normalizedBlockedTags.includes(tagName)
    );

    if (shouldBlock) {
      console.log(`=> 차단! ${getCardTitle(card)} / 태그:`, tagNames);
      card.style.setProperty('display', 'none', 'important');
    } else {
      card.style.removeProperty('display');
    }
  });
}

function loadSettingsAndApply() {
  chrome.storage.sync.get(
    [
      'blockedTags',
      'chzzkBlockerEnabled',
      'chzzkPreviewBlockerEnabled',
      'chzzkBannerBlockerEnabled',
      'chzzkBlockedUserStreamBlocked',
      'isToolbarEventBlocked',
      'isLiveChattingInputTooltipBlocked'
    ],
    function(result) {
      blockedTags = result.blockedTags || [];

      isEnabled =
        result.chzzkBlockerEnabled !== undefined
        ? result.chzzkBlockerEnabled
        : true;

      isPreviewBlocked =
        result.chzzkPreviewBlockerEnabled !== undefined
        ? result.chzzkPreviewBlockerEnabled
        : true;

      isBannerBlocked =
        result.chzzkBannerBlockerEnabled !== undefined
        ? result.chzzkBannerBlockerEnabled
        : true;

      isChzzkBlockedUserStreamBlocked =
        result.chzzkBlockedUserStreamBlocked !== undefined
        ? result.chzzkBlockedUserStreamBlocked
        : true;

      isToolbarEventBlocked =
        result.isToolbarEventBlocked !== undefined
        ? result.isToolbarEventBlocked
        : true;

      isLiveChattingInputTooltipBlocked =
        result.isLiveChattingInputTooltipBlocked !== undefined
        ? result.isLiveChattingInputTooltipBlocked
        : true;

      console.log(
        'chzzk-blocker: 설정 로드 - 태그:',
        blockedTags,
        '방송 차단 활성화:',
        isEnabled,
        '미리보기 숨김:',
        isPreviewBlocked,
        '배너 숨김:',
        isBannerBlocked,
        '치지직 자체 차단 방송 숨김:',
        isChzzkBlockedUserStreamBlocked,
        '툴바 이벤트 숨김:',
        isToolbarEventBlocked,
        '채팅창 이벤트 숨김:',
        isLiveChattingInputTooltipBlocked
      );

      injectCSSRules();
      hideBlockedStreams();
    }
  );
}

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace !== 'sync') return;

  if (changes.blockedTags) {
    blockedTags = changes.blockedTags.newValue || [];
  }

  if (changes.chzzkBlockerEnabled) {
    isEnabled = changes.chzzkBlockerEnabled.newValue;
  }

  if (changes.chzzkPreviewBlockerEnabled) {
    isPreviewBlocked = changes.chzzkPreviewBlockerEnabled.newValue;
  }

  if (changes.chzzkBannerBlockerEnabled) {
    isBannerBlocked = changes.chzzkBannerBlockerEnabled.newValue;
  }

  if (changes.chzzkBlockedUserStreamBlocked) {
    isChzzkBlockedUserStreamBlocked = changes.chzzkBlockedUserStreamBlocked.newValue;
  }

  if (changes.isToolbarEventBlocked) {
    isToolbarEventBlocked = changes.isToolbarEventBlocked.newValue;
  }

  if (changes.isLiveChattingInputTooltipBlocked) {
    isLiveChattingInputTooltipBlocked = changes.isLiveChattingInputTooltipBlocked.newValue;
  }

  injectCSSRules();
  hideBlockedStreams();
});

let applyTimer = null;

function scheduleApply() {
  if (applyTimer) clearTimeout(applyTimer);

  applyTimer = setTimeout(() => {
    injectCSSRules();
    hideBlockedStreams();
  }, 300);
}

const observer = new MutationObserver(() => {
  scheduleApply();
});

function start() {
  loadSettingsAndApply();

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    console.log('chzzk-blocker: MutationObserver started.');
  } else {
    console.error('chzzk-blocker: document.body를 찾을 수 없습니다.');
  }

  setTimeout(hideBlockedStreams, 500);
  setTimeout(hideBlockedStreams, 1500);
  setTimeout(hideBlockedStreams, 3000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
