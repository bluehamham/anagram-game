let titles = [];
let correctOrder = [];
let draggedElement = null;
let currentLevel = null;
let shiftSwapMode = false;

let timerInterval = null;
let hintTimeout = null;
let endTimeout = null;
let timeLimit = 0;
let hintDelay = 0;
let remainingTime = 0;
let hintTime = 0;

document.addEventListener('keydown', e => {
  if (e.key === 'Shift') shiftSwapMode = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'Shift') shiftSwapMode = false;
});
//スマホ対応　START
function applyDragEvents(div) {
  div.className = 'word';
  div.draggable = true;

  div.addEventListener('dragstart', () => draggedElement = div);
  div.addEventListener('dragover', e => e.preventDefault());
  div.addEventListener('drop', e => {
    e.preventDefault();
    if (draggedElement && draggedElement !== div) {
      const container = document.getElementById('wordContainer');

      if (shiftSwapMode) {
        const draggedClone = draggedElement.cloneNode(true);
        const targetClone = div.cloneNode(true);
        applyDragEvents(draggedClone);
        applyDragEvents(targetClone);
        container.replaceChild(draggedClone, div);
        container.replaceChild(targetClone, draggedElement);
      } else {
        const isAfter = draggedElement.compareDocumentPosition(div) & Node.DOCUMENT_POSITION_FOLLOWING;
        container.insertBefore(draggedElement, isAfter ? div.nextSibling : div);
      }
    }
  });

  div.addEventListener('touchstart', e => {
    draggedElement = div;
    div.classList.add('dragging-follow');
  
    const touch = e.touches[0];
    moveElementToTouch(div, touch);
    e.preventDefault();
  });
  
  div.addEventListener('touchmove', e => {
    const touch = e.touches[0];
    moveElementToTouch(draggedElement, touch);
  });
  
  div.addEventListener('touchend', e => {
    draggedElement.classList.remove('dragging-follow');
  
    const touch = e.changedTouches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('word') && target !== draggedElement) {
      const container = document.getElementById('wordContainer');
      const isAfter = draggedElement.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING;
      container.insertBefore(draggedElement, isAfter ? target.nextSibling : target);
    }
  
    // 元の位置に戻す（position解除）
    draggedElement.style.position = '';
    draggedElement.style.left = '';
    draggedElement.style.top = '';
    draggedElement = null;
  });

}

function moveElementToTouch(el, touch) {
  el.style.left = `${touch.clientX - el.offsetWidth / 2}px`;
  el.style.top = `${touch.clientY - el.offsetHeight / 2}px`;
}
//スマホ対応　END

async function loadTitles() {
  const res = await fetch('./titles.json');
  const data = await res.json();
  titles = data.titles;
  currentLevel = 'easy'; // ✅ 初期レベルを設定
  setTimersForLevel(currentLevel); // ✅ タイマー開始
  startRandomGame(currentLevel);   // ✅ 問題生成
}


function setTimersForLevel(level) {
  clearTimers();

  if (level === 'easy') {
    timeLimit = 60;
    hintDelay = 30;
  } else if (level === 'normal') {
    timeLimit = 120;
    hintDelay = 60;
  } else if (level === 'hard') {
    timeLimit = 240;
    hintDelay = 120;
  }

  remainingTime = timeLimit;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay();
    if (remainingTime <= 0) {
      clearTimers();
      endGame();
    }
  }, 1000);
  
  hintTime = 0.5; // ✅ 初期化
  scheduleHintLoop()

  endTimeout = setTimeout(() => {
    endGame();
  }, timeLimit * 1000);
}

function scheduleHintLoop() {
  if (hintTime >= 0.125) {
    hintTimeout = setTimeout(() => {
      showHint();
      scheduleHintLoop(); // ✅ ヒントだけを再帰的に予約
    }, timeLimit * hintTime * 1000);
  }
}


function clearTimers() {
  clearInterval(timerInterval);
  clearTimeout(hintTimeout);
  clearTimeout(endTimeout);
  document.getElementById('hintBox').textContent = '';
}

function updateTimerDisplay() {
  const min = Math.floor(remainingTime / 60);
  const sec = remainingTime % 60;
  document.getElementById('timerBox').textContent = `⏱ 残り時間: ${min}:${sec.toString().padStart(2, '0')}`;
}

function showHint() {
  if (!correctOrder || correctOrder.length === 0) return;

  // ヒントに出す語数（半分、切り上げ）
  const hintCount = Math.ceil(correctOrder.length * (1 - hintTime));

  // 正解の順序から先頭から順に hintCount 個取り出す
  const hintWords = correctOrder.slice(0, hintCount);

  // ヒント表示
  document.getElementById('hintBox').innerHTML =
    `💡 ヒント：先頭から ${hintCount} 語 → 「${hintWords.join(' ')}」`;
  
    hintTime = hintTime * 0.5
}


function endGame() {
  document.getElementById('hintBox').innerHTML += '<br>⏰ 時間切れ！答え合わせしてみましょう。';
  document.getElementById('checkBtn').disabled = false;
}

function startRandomGame(level = null) {
  const filtered = level ? titles.filter(t => t.level === level) : titles;
  if (filtered.length === 0) return;

  const randomIndex = Math.floor(Math.random() * filtered.length);
  const title = filtered[randomIndex];
  correctOrder = [...title.words];
  currentLevel = level;

  const shuffled = shuffle([...correctOrder]);
  const container = document.getElementById('wordContainer');
  container.innerHTML = '';

shuffled.forEach(word => {
  const div = document.createElement('div');
  div.className = 'word';
  div.textContent = word;
  applyDragEvents(div); // ✅ 正しい関数名に修正
  container.appendChild(div);
});

  document.getElementById('result').textContent = '';
  document.getElementById('feedbackButtons').style.display = 'none';
  document.getElementById('nextBtn').style.display = 'none';

  if (level) setTimersForLevel(level);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

document.getElementById('checkBtn').addEventListener('click', () => {
  clearTimeout(hintTimeout); // ✅ ヒントを止める
  
  const container = document.getElementById('wordContainer');
  const current = Array.from(container.children).map(div => div.textContent);
  const result = document.getElementById('result');
  const nextBtn = document.getElementById('nextBtn');

  if (JSON.stringify(current) === JSON.stringify(correctOrder)) {
    result.textContent = '✅ 正解！';
    result.style.color = 'green';
  } else {
    result.textContent = `❌ 不正解。正解は「${correctOrder.join('')}」`;
    result.style.color = 'red';
  }

  nextBtn.style.display = 'inline-block';
  document.getElementById('feedbackButtons').style.display = 'block';
});

document.querySelectorAll('#levelSelector button').forEach(btn => {
  btn.addEventListener('click', () => {
    const level = btn.getAttribute('data-level');
    currentLevel = level;
    setTimersForLevel(level); // ✅ タイマー開始
    startRandomGame(level);   // ✅ 問題生成
    document.getElementById('nextBtn').style.display = 'none';
  });
});


document.getElementById('nextBtn').addEventListener('click', () => {
  startRandomGame(currentLevel);
});

function saveFeedbackToLocalStorage(titleKey, feedback) {
  const key = 'titleFeedback';
  const data = JSON.parse(localStorage.getItem(key)) || {};
  data[titleKey] = feedback;
  localStorage.setItem(key, JSON.stringify(data));
}

function sendFeedbackToServer(titleKey, feedback) {
  fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ titleKey, feedback })
  }).then(res => {
    if (res.ok) {
      console.log('✅ titles.json に保存されました');
    } else {
      console.error('❌ 保存に失敗しました');
    }
  });
}

loadTitles();








