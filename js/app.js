import { CASES } from "../data/cases.js";

const state = {
  started: false,
  index: 0,
  ledger: [],
  deferredPrompt: null,
};

const $ = (id) => document.getElementById(id);

function save() {
  localStorage.setItem("qareen-desk-v0", JSON.stringify({
    index: state.index,
    ledger: state.ledger,
    started: state.started,
  }));
}

function load() {
  try {
    const raw = localStorage.getItem("qareen-desk-v0");
    if (!raw) return;
    const data = JSON.parse(raw);
    state.index = data.index ?? 0;
    state.ledger = data.ledger ?? [];
    state.started = !!data.started;
  } catch {
    /* ignore */
  }
}

function renderQueue() {
  const list = $("case-list");
  list.innerHTML = "";
  CASES.forEach((c, i) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    const done = state.ledger.some((x) => x.id === c.id);
    btn.textContent = `${c.shortTitle}`;
    btn.classList.toggle("active", i === state.index && state.started && !done);
    btn.classList.toggle("done", done);
    btn.disabled = done || i !== state.index;
    li.appendChild(btn);
    list.appendChild(li);
  });
  $("kpi").textContent = `KPI: ${state.ledger.length}/${CASES.length}`;
}

function show(id) {
  ["gate", "case-view", "aftermath", "shift-end"].forEach((x) => {
    $(x).classList.toggle("hidden", x !== id);
  });
}

function currentCase() {
  return CASES[state.index];
}

function openCase() {
  const c = currentCase();
  if (!c) {
    endShift();
    return;
  }
  $("case-title").textContent = c.title;
  $("case-id").textContent = c.id;
  $("case-body").textContent = c.dossier;
  $("case-photo").src = c.photo;
  $("case-photo").alt = c.photoAlt;
  $("photo-caption").textContent = c.photoCaption;
  const ul = $("anomalies");
  ul.innerHTML = "";
  c.anomalies.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = a;
    ul.appendChild(li);
  });
  show("case-view");
  renderQueue();
  save();
}

function aftermathCopy(action, c) {
  const map = {
    confirm: c.aftermath.confirm,
    flag: c.aftermath.flag,
    merge: c.aftermath.merge,
    quarantine: c.aftermath.quarantine,
  };
  return map[action];
}

function decide(action) {
  const c = currentCase();
  state.ledger.push({ id: c.id, action, at: Date.now() });
  $("aftermath-text").textContent = aftermathCopy(action, c);
  if (state.ledger.length >= 2) {
    $("login-echo").textContent = "موظف: ر.ظ — جلستان متزامنتان؟";
    $("login-echo").classList.add("dup");
  }
  show("aftermath");
  renderQueue();
  save();
}

function nextCase() {
  state.index += 1;
  if (state.index >= CASES.length) {
    endShift();
    return;
  }
  openCase();
}

function endShift() {
  const flags = state.ledger.filter((x) => x.action === "flag").length;
  const merges = state.ledger.filter((x) => x.action === "merge").length;
  let ending =
    "الدفتر أقفل. الشوارع هادئة أكثر من اللازم. في الصباح، اسمك ظاهر مرتين في كشف الحضور.";
  if (flags >= 2) {
    ending =
      "وشمتِ أكثر من قرين. الحي القديم بيبعت شكر رسمي… من رقم مسجل باسمك.";
  } else if (merges >= 2) {
    ending =
      "الدمج خلّى السجلات أنظف. كمان خلّى وجهك في كاميرا البوابة أوضح من وجهك في المرآة.";
  }
  $("ending-text").textContent = ending;
  $("ledger-summary").textContent = state.ledger
    .map((x) => `${x.id}:${x.action}`)
    .join(" · ");
  show("shift-end");
  save();
}

function startShift() {
  state.started = true;
  if (state.index >= CASES.length) {
    state.index = 0;
    state.ledger = [];
    $("login-echo").textContent = "موظف: ر.ظ — جلسة واحدة";
    $("login-echo").classList.remove("dup");
  }
  openCase();
}

function restart() {
  state.index = 0;
  state.ledger = [];
  state.started = true;
  $("login-echo").textContent = "موظف: ر.ظ — جلسة واحدة";
  $("login-echo").classList.remove("dup");
  openCase();
}

function wire() {
  $("btn-start").addEventListener("click", startShift);
  $("btn-next").addEventListener("click", nextCase);
  $("btn-restart").addEventListener("click", restart);
  $("actions").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    decide(btn.dataset.action);
  });

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    state.deferredPrompt = e;
    $("btn-install").classList.remove("hidden");
  });
  $("btn-install").addEventListener("click", async () => {
    if (!state.deferredPrompt) return;
    state.deferredPrompt.prompt();
    await state.deferredPrompt.userChoice;
    state.deferredPrompt = null;
    $("btn-install").classList.add("hidden");
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }
}

load();
wire();
renderQueue();
if (state.started && state.index < CASES.length) {
  openCase();
} else {
  show("gate");
}
