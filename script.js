// ==========================================
// データの保存先のキー名(localStorageの中の名前)
// ==========================================
const STORAGE_KEY = "questApp.data.v1";

// 初回起動時に入れておく初期データ
const DEFAULT_DATA = {
  week: [
    { id: "w1", text: "インスタ投稿", done: false },
    { id: "w2", text: "カメラを持って外出", done: false },
    { id: "w3", text: "Lightroomで現像", done: false },
    { id: "w4", text: "副業30分", done: false },
  ],
  month: [
    { id: "m1", text: "月のテーマを決める", done: false },
    { id: "m2", text: "副業を意識した写真を撮る", done: false },
  ],
};

// ==========================================
// localStorageからデータを読み込む
// (保存されたデータが無ければ初期データを使う)
// ==========================================
function loadData() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(DEFAULT_DATA);
  try {
    return JSON.parse(raw);
  } catch (e) {
    return structuredClone(DEFAULT_DATA);
  }
}

// データをlocalStorageに保存する
function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

let data = loadData();

// ==========================================
// 画面を全部描き直す(データが変わるたびに呼ぶ)
// ==========================================
function renderAll() {
  renderNextQuest();
  renderProgress();
  renderList("week", document.getElementById("weeklyList"));
  renderList("month", document.getElementById("monthlyList"));
}

// ------------------------------------------
// Next Quest(今やるべき1つ)を決めて表示する
// 週のQuestを優先し、それが全部終わっていたら月のQuestから探す
// ------------------------------------------
function renderNextQuest() {
  const card = document.getElementById("nextQuestCard");
  const next =
    data.week.find((q) => !q.done) || data.month.find((q) => !q.done);

  if (!next) {
    card.innerHTML = `
      <p class="nq-eyebrow">TODAY</p>
      <p class="nq-empty">今日やることは終わりました。おつかれさまでした 🎞️</p>
    `;
    return;
  }

  card.innerHTML = `
    <p class="nq-eyebrow">NEXT QUEST</p>
    <p class="nq-text">${escapeHtml(next.text)}</p>
    <button class="nq-button" id="nextQuestBtn">達成する</button>
  `;

  document.getElementById("nextQuestBtn").addEventListener("click", () => {
    toggleQuest(next.id);
  });
}

// ------------------------------------------
// 達成率を計算してバーに反映する
// ------------------------------------------
function renderProgress() {
  const all = [...data.week, ...data.month];
  const doneCount = all.filter((q) => q.done).length;
  const percent = all.length === 0 ? 0 : Math.round((doneCount / all.length) * 100);

  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("progressFill").style.width = `${percent}%`;
}

// ------------------------------------------
// 週 or 月のQuest一覧をリストとして表示する
// scope: "week" または "month"
// ------------------------------------------
function renderList(scope, ulElement) {
  ulElement.innerHTML = "";

  data[scope].forEach((quest, i) => {
    const li = document.createElement("li");
    li.className = "quest-item" + (quest.done ? " done" : "");

    li.innerHTML = `
      <span class="index">${String(i + 1).padStart(2, "0")}</span>
      <input type="checkbox" class="quest-checkbox" ${quest.done ? "checked" : ""} />
      <span class="quest-text">${escapeHtml(quest.text)}</span>
    `;

    const checkbox = li.querySelector(".quest-checkbox");
    checkbox.addEventListener("change", () => {
      toggleQuest(quest.id);
    });

    ulElement.appendChild(li);
  });
}

// ------------------------------------------
// 指定したidのQuestの完了状態を反転させて保存＆再描画
// ------------------------------------------
function toggleQuest(id) {
  for (const scope of ["week", "month"]) {
    const target = data[scope].find((q) => q.id === id);
    if (target) {
      target.done = !target.done;
    }
  }
  saveData(data);
  renderAll();
}

// ------------------------------------------
// 新しいQuestを追加する(簡易的にprompt()を使用)
// ------------------------------------------
function addQuest(scope) {
  const text = prompt(
    scope === "week" ? "今週のQuestを入力してください" : "今月のQuestを入力してください"
  );
  if (!text || !text.trim()) return;

  const newQuest = {
    id: `${scope}-${Date.now()}`,
    text: text.trim(),
    done: false,
  };
  data[scope].push(newQuest);
  saveData(data);
  renderAll();
}

document.querySelectorAll(".add-quest-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    addQuest(btn.dataset.scope);
  });
});

// ------------------------------------------
// 文字列をそのままHTMLに入れると危ないので無害化する
// (例えば <script> のような文字が入力されても実行されないようにする)
// ------------------------------------------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// 起動時に一度描画する
renderAll();
