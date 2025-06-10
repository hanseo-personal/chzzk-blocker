// popup.js

document.addEventListener('DOMContentLoaded', initializePopup);

const blockerToggle = document.getElementById('blockerToggle'); // 태그 차단 기능 토글
const previewToggle = document.getElementById('previewToggle'); // 대문 미리보기 토글
const newTagInput = document.getElementById('newTagInput');
const addTagBtn = document.getElementById('addTagBtn');
const blockedTagsList = document.getElementById('blockedTagsList');
const statusDiv = document.getElementById('status');

// 팝업 초기화: 저장된 설정 불러오기 및 UI 업데이트
function initializePopup() {
  // 1. "대문 미리보기" 토글 상태 불러오기 (순서 변경)
  chrome.storage.sync.get(['chzzkPreviewBlockerEnabled'], function(result) {
    // 기본값은 true (미리보기 숨김)
    previewToggle.checked = typeof result.chzzkPreviewBlockerEnabled === 'undefined' ? true : result.chzzkPreviewBlockerEnabled;
  });

  // 2. "태그 차단 기능" 토글 상태 불러오기 (순서 변경)
  chrome.storage.sync.get(['chzzkBlockerEnabled'], function(result) {
    // 기본값은 true (활성화)
    blockerToggle.checked = typeof result.chzzkBlockerEnabled === 'undefined' ? true : result.chzzkBlockerEnabled;
  });

  // 차단 태그 목록 불러오기
  loadBlockedTags();

  // 이벤트 리스너 연결
  previewToggle.addEventListener('change', togglePreviewBlocker); // 순서 변경
  blockerToggle.addEventListener('change', toggleBlocker);     // 순서 변경
  addTagBtn.addEventListener('click', addTag);
  // Enter 키로 태그 추가
  newTagInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      addTag();
    }
  });
}

// "태그 차단 기능" 활성화/비활성화
function toggleBlocker() {
  const isChecked = blockerToggle.checked;
  chrome.storage.sync.set({ chzzkBlockerEnabled: isChecked }, function() {
    // 메시지 텍스트 변경
    showStatus(isChecked ? '태그 차단 기능 활성화됨' : '태그 차단 기능 비활성화됨', isChecked ? 'green' : 'red');
  });
}

// "대문 미리보기" 숨김/표시 (토글이 켜져 있으면 숨김)
function togglePreviewBlocker() {
  const isChecked = previewToggle.checked;
  chrome.storage.sync.set({ chzzkPreviewBlockerEnabled: isChecked }, function() {
    showStatus(isChecked ? '대문 미리보기 숨김' : '대문 미리보기 표시', isChecked ? 'green' : 'red');
  });
}

// 저장된 차단 태그 목록을 불러와 UI에 표시
function loadBlockedTags() {
  chrome.storage.sync.get(['blockedTags'], function(result) {
    const tags = result.blockedTags || [];
    blockedTagsList.innerHTML = ''; // 기존 목록 초기화
    tags.forEach(tag => addTagToDisplay(tag));
  });
}

// 새로운 태그를 추가하는 함수
function addTag() {
  const tag = newTagInput.value.trim();
  if (tag) {
    chrome.storage.sync.get(['blockedTags'], function(result) {
      const tags = result.blockedTags || [];
      if (!tags.includes(tag)) { // 중복 태그 방지
        tags.push(tag);
        chrome.storage.sync.set({ blockedTags: tags }, function() {
          addTagToDisplay(tag);
          newTagInput.value = ''; // 입력 필드 초기화
          showStatus(`'${tag}' 태그가 추가되었습니다.`, 'green');
        });
      } else {
        showStatus(`'${tag}'은(는) 이미 존재하는 태그입니다.`, 'orange');
      }
    });
  } else {
    showStatus('태그를 입력해주세요.', 'red');
  }
}

// UI에 태그를 표시하고 삭제 버튼을 추가
function addTagToDisplay(tag) {
  const li = document.createElement('li');
  li.textContent = tag;

  const deleteButton = document.createElement('button');
  deleteButton.textContent = '삭제';
  deleteButton.addEventListener('click', function() {
    removeTag(tag, li);
  });

  li.appendChild(deleteButton);
  blockedTagsList.appendChild(li);
}

// 태그를 삭제하는 함수
function removeTag(tagToRemove, listItem) {
  chrome.storage.sync.get(['blockedTags'], function(result) {
    let tags = result.blockedTags || [];
    const updatedTags = tags.filter(tag => tag !== tagToRemove); // 삭제할 태그 제외
    chrome.storage.sync.set({ blockedTags: updatedTags }, function() {
      listItem.remove(); // UI에서 제거
      showStatus(`'${tagToRemove}' 태그가 삭제되었습니다.`, 'green');
    });
  });
}

// 상태 메시지 표시
function showStatus(message, color) {
  statusDiv.textContent = message;
  statusDiv.style.color = color;
  setTimeout(() => {
    statusDiv.textContent = ''; // 3초 후 메시지 제거
  }, 3000);
}
