// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const blockStreamsToggle = document.getElementById('blockStreamsToggle');
  const blockPreviewToggle = document.getElementById('blockPreviewToggle');
  const tagInput = document.getElementById('tagInput');
  const addTagBtn = document.getElementById('addTagBtn');
  const blockedTagsList = document.getElementById('blockedTagsList');
  const toggleTagListBtn = document.getElementById('toggleTagList');
  const blockedTagsContainer = document.getElementById('blockedTagsContainer');

  let currentBlockedTags = []; // 현재 차단 태그 목록

  // 차단 태그 목록을 UI에 표시하는 함수
  function renderBlockedTags() {
    blockedTagsList.innerHTML = ''; // 기존 목록 초기화
    if (currentBlockedTags.length === 0) {
      const li = document.createElement('li');
      li.textContent = '차단 태그가 없습니다.';
      li.style.fontStyle = 'italic';
      li.style.color = '#777';
      li.style.justifyContent = 'center';
      blockedTagsList.appendChild(li);
    } else {
      currentBlockedTags.forEach(tag => {
        const li = document.createElement('li');
        li.textContent = tag;

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'X';
        deleteBtn.style.marginLeft = '5px';
        deleteBtn.style.cursor = 'pointer';
        deleteBtn.onclick = function() {
          removeTag(tag);
        };
        li.appendChild(deleteBtn);
        blockedTagsList.appendChild(li);
      });
    }
  }

  // 태그 추가
  addTagBtn.addEventListener('click', function() {
    const newTag = tagInput.value.trim();
    if (newTag && !currentBlockedTags.includes(newTag)) {
      currentBlockedTags.push(newTag);
      tagInput.value = ''; // 입력창 초기화
      chrome.storage.sync.set({ blockedTags: currentBlockedTags }, function() {
        renderBlockedTags(); // 태그 추가 후 목록 다시 그리기

        // 태그 추가 시 목록이 닫혀있다면 펼치고, 펼쳐져 있다면 높이를 재조정
        // DOM 업데이트가 완료된 후 실행되도록 setTimeout 사용
        setTimeout(() => {
          const isCollapsed = blockedTagsContainer.style.maxHeight === '0px';
          if (isCollapsed) {
            toggleTagListBtn.click(); // 닫혀있으면 펼치기
          } else {
            // 펼쳐져 있다면 높이를 콘텐츠에 맞게 다시 계산하여 업데이트
            blockedTagsContainer.style.maxHeight = blockedTagsList.scrollHeight + 16 + 'px';
          }
        }, 50); // 50ms 정도 딜레이를 주어 DOM 업데이트 기다림
        console.log('chzzk-blocker: 태그 추가됨:', newTag);
      });
    }
  });

  // 태그 삭제
  function removeTag(tagToRemove) {
    currentBlockedTags = currentBlockedTags.filter(tag => tag !== tagToRemove);
    chrome.storage.sync.set({ blockedTags: currentBlockedTags }, function() {
      renderBlockedTags(); // 태그 삭제 후 목록 다시 그리기

      setTimeout(() => { // DOM 업데이트 후 높이 재조정
        if (currentBlockedTags.length === 0) { // 태그가 모두 삭제되면 컨테이너를 닫습니다.
          blockedTagsContainer.style.maxHeight = '0px';
          blockedTagsContainer.style.padding = '0 8px';
          blockedTagsContainer.style.border = '1px solid transparent';
          toggleTagListBtn.textContent = '펼치기';
        } else {
          // 태그가 남아있는데 닫혀있다면 펼치고, 펼쳐져 있다면 높이를 재조정
          const isCollapsed = blockedTagsContainer.style.maxHeight === '0px';
          if (isCollapsed) {
            // 닫혀있으면 펼치기 (click 이벤트가 내부적으로 높이 계산)
            toggleTagListBtn.click();
          } else {
            // 펼쳐져 있다면 높이를 콘텐츠에 맞게 다시 계산하여 업데이트
            blockedTagsContainer.style.maxHeight = blockedTagsList.scrollHeight + 16 + 'px';
          }
        }
      }, 50); // 50ms 딜레이
      console.log('chzzk-blocker: 태그 삭제됨:', tagToRemove);
    });
  }

  // 스토리지에서 설정 불러오기 및 UI 업데이트
  chrome.storage.sync.get(['blockedTags', 'chzzkBlockerEnabled', 'chzzkPreviewBlockerEnabled'], function(result) {
    if (result.blockedTags) {
      currentBlockedTags = result.blockedTags;
    }
    renderBlockedTags(); // 초기 로드 시 태그 표시

    // 초기 로드 시 태그 목록 컨테이너는 항상 닫힌 상태로 시작
    blockedTagsContainer.style.maxHeight = '0px';
    blockedTagsContainer.style.padding = '0 8px';
    blockedTagsContainer.style.border = '1px solid transparent';
    toggleTagListBtn.textContent = '펼치기';


    // 체크박스 상태 로드
    if (typeof result.chzzkBlockerEnabled !== 'undefined') {
      blockStreamsToggle.checked = result.chzzkBlockerEnabled;
    } else {
      blockStreamsToggle.checked = true; // 기본값: 활성화
    }
    if (typeof result.chzzkPreviewBlockerEnabled !== 'undefined') {
      blockPreviewToggle.checked = result.chzzkPreviewBlockerEnabled;
    } else {
      blockPreviewToggle.checked = true; // 기본값: 활성화
    }
  });

  // '방송 차단 기능' 토글 상태 저장
  blockStreamsToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ chzzkBlockerEnabled: blockStreamsToggle.checked }, function() {
      console.log('chzzk-blocker: 방송 차단 기능 활성화 상태 저장:', blockStreamsToggle.checked);
    });
  });

  // '대문 미리보기 숨기기' 토글 상태 저장
  blockPreviewToggle.addEventListener('change', function() {
    chrome.storage.sync.set({ chzzkPreviewBlockerEnabled: blockPreviewToggle.checked }, function() {
      console.log('chzzk-blocker: 대문 미리보기 숨기기 상태 저장:', blockPreviewToggle.checked);
    });
  });

  // 태그 리스트 펼치기/접기 토글 기능
  toggleTagListBtn.addEventListener('click', function() {
    const isCollapsed = blockedTagsContainer.style.maxHeight === '0px';

    if (isCollapsed) {
      // 현재 접혀있음 -> 펼치기
      blockedTagsContainer.style.maxHeight = blockedTagsList.scrollHeight + 16 + 'px'; // 콘텐츠 높이 + 패딩(위아래 8px씩 총 16px)
      blockedTagsContainer.style.padding = '8px';
      blockedTagsContainer.style.border = '1px solid #ddd';
      toggleTagListBtn.textContent = '접기';
    } else {
      // 현재 펼쳐져 있음 -> 접기
      blockedTagsContainer.style.maxHeight = '0px';
      blockedTagsContainer.style.padding = '0 8px';
      blockedTagsContainer.style.border = '1px solid transparent';
      toggleTagListBtn.textContent = '펼치기';
    }
  });

  // Enter 키로 태그 추가
  tagInput.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault(); // 기본 Enter 동작 방지
      // setTimeout을 사용하여 이벤트 루프 다음 틱에서 addTagBtn.click() 호출
      // 이렇게 하면 입력 필드에 마지막 글자가 완전히 반영될 시간을 줍니다.
      setTimeout(() => {
        addTagBtn.click();
      }, 0);
    }
  });
});
