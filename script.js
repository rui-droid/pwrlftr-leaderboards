const WEIGHT_CLASS_LIMITS = {
  Female: [
    { limit: 43, label: "43kg" },
    { limit: 47, label: "47kg" },
    { limit: 52, label: "52kg" },
    { limit: 57, label: "57kg" },
    { limit: 63, label: "63kg" },
    { limit: 69, label: "69kg" },
    { limit: 76, label: "76kg" },
    { limit: 84, label: "84kg" },
    { limit: Infinity, label: "84+kg" },
  ],
  Male: [
    { limit: 59, label: "59kg" },
    { limit: 66, label: "66kg" },
    { limit: 74, label: "74kg" },
    { limit: 83, label: "83kg" },
    { limit: 93, label: "93kg" },
    { limit: 105, label: "105kg" },
    { limit: 120, label: "120kg" },
    { limit: Infinity, label: "120+kg" },
  ],
};

const SEXES = ["Female", "Male"];
const CATEGORIES = ["Sub-Junior", "Junior", "Open", "Master 1"];
const LIFT_KEYS = ["squat", "bench", "deadlift"];
const LIFT_LABELS = {
  squat: "Squat",
  bench: "Bench",
  deadlift: "Deadlift",
  total: "Total",
};
const ATTEMPT_LABELS = ["Opener", "Second", "Third"];
const ATTEMPT_STEP = 2.5;
const MAX_PROJECTED_ATTEMPT = 500;

const JUDGE_COUNT = 3;

const STORAGE_KEY = "pwrlftr-state";
const meets = [];
const meetHistory = [];
let currentMeetId = null;

const uiState = {
  weightClassFilter: "all",
  sexFilter: "all",
  categoryFilter: "all",
  sortMode: "total",
  activeLiftView: "total",
};

const strategyState = {
  athleteId: "",
  targetId: "",
  lift: "deadlift",
  scoring: "total",
};

const DOM = {};
let isMenuOpen = false;
let editingAthleteId = null;

function createAttempt() {
  return {
    weight: 0,
    judges: Array.from({ length: JUDGE_COUNT }, () => "pending"),
  };
}

function createAttemptSet() {
  return [createAttempt(), createAttempt(), createAttempt()];
}

function getWeightClass(sex, bodyweight) {
  if (!sex || !bodyweight) return "";
  const limits = WEIGHT_CLASS_LIMITS[sex];
  if (!limits) return "";
  const entry = limits.find((item) => bodyweight <= item.limit);
  return entry?.label || "";
}

function normalizeAttemptValue(value) {
  if (value === "" || value === null || typeof value === "undefined") {
    return null;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.max(0, numeric);
}

function evaluateAttempt(attempt) {
  const good = attempt.judges.filter((judge) => judge === "good").length;
  const bad = attempt.judges.filter((judge) => judge === "bad").length;
  const pending = JUDGE_COUNT - good - bad;
  return {
    good,
    bad,
    pending,
    isGood: good >= 2,
    isComplete: pending === 0,
  };
}

function saveAppState() {
  const payload = {
    currentMeetId,
    meets,
    meetHistory,
    uiState: {
      sortMode: uiState.sortMode,
    },
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadAppState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data.meets)) {
      meets.splice(0, meets.length, ...data.meets);
    }
    if (Array.isArray(data.meetHistory)) {
      meetHistory.splice(0, meetHistory.length, ...data.meetHistory);
    }
    currentMeetId = data.currentMeetId || null;
    if (data.uiState?.sortMode) {
      uiState.sortMode = data.uiState.sortMode;
    }
    return true;
  } catch {
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  bindEvents();
  populateStaticSelects();
  updateAutoClassPreview();
  const restored = loadAppState();
  if (!restored || !meets.length) {
    bootstrapDefaultMeet();
  } else {
    if (!currentMeetId || !meets.find((meet) => meet.id === currentMeetId)) {
      currentMeetId = meets[0].id;
    }
    renderAll();
  }
});

function cacheDom() {
  DOM.meetPanel = document.getElementById("meetPanel");
  DOM.meetSelect = document.getElementById("meetSelect");
  DOM.meetForm = document.getElementById("meetForm");
  DOM.meetName = document.getElementById("meetName");
  DOM.meetDate = document.getElementById("meetDate");
  DOM.meetLocation = document.getElementById("meetLocation");
  DOM.activeMeetMeta = document.getElementById("activeMeetMeta");
  DOM.meetHistoryToggle = document.getElementById("meetHistoryToggle");
  DOM.menuToggle = document.getElementById("menuToggle");
  DOM.menuClose = document.getElementById("menuClose");
  DOM.sideMenu = document.getElementById("sideMenu");
  DOM.menuBackdrop = document.getElementById("menuBackdrop");
  DOM.saveToast = document.getElementById("saveToast");
  DOM.saveToastMessage = document.getElementById("saveToastMessage");
  DOM.saveToastIcon = DOM.saveToast?.querySelector(".toast__icon");
  DOM.activeMeetName = document.getElementById("activeMeetName");
  DOM.editMeetName = document.getElementById("editMeetName");
  DOM.meetNameEditRow = document.getElementById("meetNameEditRow");
  DOM.meetNameEdit = document.getElementById("meetNameEdit");
  DOM.saveMeetName = document.getElementById("saveMeetName");
  DOM.removeMeet = document.getElementById("removeMeet");
  DOM.meetHistoryList = document.getElementById("meetHistoryList");

  DOM.nameInput = document.getElementById("name");
  DOM.sexSelect = document.getElementById("sex");
  DOM.categorySelect = document.getElementById("category");
  DOM.bodyweightInput = document.getElementById("bodyweight");
  DOM.autoClassDisplay = document.getElementById("autoClassDisplay");
  DOM.athleteFormTitle = document.getElementById("athleteFormTitle");
  DOM.editModeIndicator = document.getElementById("editModeIndicator");
  DOM.athleteSubmit = document.getElementById("athleteSubmit");

  DOM.athletesContainer = document.getElementById("athletes");

  DOM.leaderboardTitle = document.getElementById("leaderboardTitle");
  DOM.leaderboardHeadRow = document.getElementById("leaderboardHeadRow");
  DOM.leaderboardBody = document.getElementById("leaderboard");
  DOM.weightFilter = document.getElementById("weightFilter");
  DOM.sexFilter = document.getElementById("sexFilter");
  DOM.categoryFilter = document.getElementById("categoryFilter");
  DOM.sortButtons = document.querySelectorAll("[data-sort]");
  DOM.liftButtons = document.querySelectorAll("[data-lift]");

  DOM.strategyAthlete = document.getElementById("strategyAthlete");
  DOM.strategyTarget = document.getElementById("strategyTarget");
  DOM.strategyLift = document.getElementById("strategyLift");
  DOM.strategyScoring = document.getElementById("strategyScoring");
  DOM.strategyValue = document.getElementById("strategyValue");
  DOM.strategyNote = document.getElementById("strategyNote");
  DOM.saveLeaderboard = document.getElementById("saveLeaderboard");

  if (DOM.sexFilter) DOM.sexFilter.value = uiState.sexFilter;
  if (DOM.categoryFilter) DOM.categoryFilter.value = uiState.categoryFilter;
  if (DOM.weightFilter) DOM.weightFilter.value = uiState.weightClassFilter;
  if (DOM.strategyLift) DOM.strategyLift.value = strategyState.lift;
  if (DOM.strategyScoring) DOM.strategyScoring.value = strategyState.scoring;
}

function bindEvents() {
  DOM.meetHistoryToggle?.addEventListener("click", () => {
    document.body.classList.toggle("meet-panel-open");
  });

  DOM.menuToggle?.addEventListener("click", toggleMenu);
  DOM.menuClose?.addEventListener("click", closeMenu);
  DOM.menuBackdrop?.addEventListener("click", closeMenu);

  DOM.meetForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    createMeetFromForm();
  });

  DOM.meetSelect?.addEventListener("change", (event) => {
    setActiveMeet(event.target.value);
  });

  DOM.saveLeaderboard?.addEventListener("click", saveLeaderboardSnapshot);

  DOM.editMeetName?.addEventListener("click", () => {
    if (!DOM.meetNameEditRow) return;
    DOM.meetNameEditRow.classList.toggle("hidden");
    if (!DOM.meetNameEdit) return;
    const meet = getActiveMeet();
    DOM.meetNameEdit.value = meet?.name || "";
    DOM.meetNameEdit.focus();
  });

  DOM.saveMeetName?.addEventListener("click", () => {
    if (!DOM.meetNameEdit) return;
    updateMeetName(DOM.meetNameEdit.value);
  });

  DOM.removeMeet?.addEventListener("click", removeActiveMeet);

  DOM.nameInput?.addEventListener("input", handleAthleteFormInput);
  DOM.categorySelect?.addEventListener("change", handleAthleteFormInput);
  DOM.sexSelect?.addEventListener("change", () => {
    updateAutoClassPreview();
    handleAthleteFormInput();
  });
  DOM.bodyweightInput?.addEventListener("input", () => {
    updateAutoClassPreview();
    handleAthleteFormInput();
  });
  DOM.meetDate?.addEventListener("input", () => {
    const cleaned = DOM.meetDate.value.replace(/[^0-9/]/g, "");
    if (cleaned !== DOM.meetDate.value) {
      DOM.meetDate.value = cleaned;
    }
  });

  DOM.weightFilter?.addEventListener("change", (event) => {
    uiState.weightClassFilter = event.target.value;
    renderAll();
  });

  DOM.sexFilter?.addEventListener("change", (event) => {
    uiState.sexFilter = event.target.value;
    renderAll();
  });

  DOM.categoryFilter?.addEventListener("change", (event) => {
    uiState.categoryFilter = event.target.value;
    renderAll();
  });

  DOM.sortButtons.forEach((button) =>
    button.addEventListener("click", () => {
      uiState.sortMode = button.dataset.sort;
      updateSortButtons();
      renderLeaderboard();
      renderStrategyOptions();
      saveAppState();
    })
  );

  DOM.liftButtons.forEach((button) =>
    button.addEventListener("click", () => {
      uiState.activeLiftView = button.dataset.lift;
      updateLiftButtons();
      renderLeaderboard();
    })
  );

  DOM.strategyAthlete?.addEventListener("change", (event) => {
    strategyState.athleteId = event.target.value;
    renderStrategyResult();
  });
  DOM.strategyTarget?.addEventListener("change", (event) => {
    strategyState.targetId = event.target.value;
    renderStrategyResult();
  });
  DOM.strategyLift?.addEventListener("change", (event) => {
    strategyState.lift = event.target.value;
    renderStrategyResult();
  });
  DOM.strategyScoring?.addEventListener("change", (event) => {
    strategyState.scoring = event.target.value;
    renderStrategyResult();
  });

  DOM.athletesContainer?.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-athlete-edit]");
    if (editButton) {
      setEditMode(editButton.dataset.athleteEdit);
      return;
    }
    const removeButton = event.target.closest("[data-athlete-remove]");
    if (removeButton) {
      removeAthlete(removeButton.dataset.athleteRemove);
      return;
    }
  });

  DOM.meetHistoryList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-meet-id]");
    if (!button) return;
    if (button.dataset.action === "delete") {
      deleteMeet(button.dataset.meetId);
      return;
    }
    if (button.dataset.action === "edit") {
      startMeetHistoryEdit(button.dataset.meetId);
      return;
    }
    if (button.dataset.action === "save") {
      saveMeetHistoryEdit(button.dataset.meetId);
      return;
    }
    if (button.dataset.action === "cancel") {
      cancelMeetHistoryEdit(button.dataset.meetId);
      return;
    }
    setActiveMeet(button.dataset.meetId);
  });

  DOM.meetHistoryList?.addEventListener("input", (event) => {
    const input = event.target.closest('[data-edit-field="date"]');
    if (!input) return;
    const cleaned = input.value.replace(/[^0-9/]/g, "");
    if (cleaned !== input.value) {
      input.value = cleaned;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!isMenuOpen) return;
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.querySelectorAll("[data-menu-link]").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();
    });
  });
}

function openMenu() {
  isMenuOpen = true;
  DOM.sideMenu?.classList.add("open");
  DOM.menuBackdrop?.classList.add("open");
  DOM.menuToggle?.setAttribute("aria-expanded", "true");
}

function closeMenu() {
  isMenuOpen = false;
  DOM.sideMenu?.classList.remove("open");
  DOM.menuBackdrop?.classList.remove("open");
  DOM.menuToggle?.setAttribute("aria-expanded", "false");
}

function toggleMenu() {
  if (isMenuOpen) {
    closeMenu();
    return;
  }
  openMenu();
}

function populateStaticSelects() {
  populateCategorySelect(DOM.categorySelect, true);
  populateCategorySelect(DOM.categoryFilter, false, true);
}

function populateCategorySelect(selectEl, includePlaceholder = false, includeAll = false) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  if (includeAll) {
    selectEl.innerHTML = '<option value="all">All</option>';
  } else if (includePlaceholder) {
    selectEl.innerHTML = '<option value="">Category</option>';
  }
  CATEGORIES.forEach((label) => {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    selectEl.append(option);
  });
}

function bootstrapDefaultMeet() {
  const today = formatDateDisplay(new Date());
  const defaultMeet = createMeet({
    name: "Open Session A",
    date: today,
    location: "Main Platform",
  });
  meets.push(defaultMeet);
  currentMeetId = defaultMeet.id;
  renderAll();
}

function createMeet({ name, date, location }) {
  return {
    id: crypto.randomUUID(),
    name,
    date,
    location: location || "",
    athletes: [],
  };
}

function createMeetFromForm() {
  const name = DOM.meetName.value.trim();
  const dateInput = DOM.meetDate.value.trim();
  const parsedDate = parseDisplayDate(dateInput);
  if (!name || !parsedDate) return;
  const location = DOM.meetLocation.value.trim();
  const newMeet = createMeet({ name, date: parsedDate.display, location });
  meets.push(newMeet);
  setActiveMeet(newMeet.id);
  DOM.meetForm.reset();
  saveAppState();
}

function setActiveMeet(meetId) {
  currentMeetId = meetId;
  uiState.weightClassFilter = "all";
  uiState.sexFilter = "all";
  uiState.categoryFilter = "all";
  strategyState.athleteId = "";
  strategyState.targetId = "";
  exitEditMode();
  renderAll();
  saveAppState();
}

function getActiveMeet() {
  return meets.find((meet) => meet.id === currentMeetId) || null;
}

function addAthlete() {
  const meet = getActiveMeet();
  if (!meet) return;

  const name = DOM.nameInput.value.trim();
  const sex = DOM.sexSelect.value;
  const category = DOM.categorySelect.value;
  const bodyweight = Number(DOM.bodyweightInput.value);
  if (!name || !sex || !category || !bodyweight) return;

  const weightClassValue = getWeightClass(sex, bodyweight);
  if (!weightClassValue) return;

  const existing = editingAthleteId
    ? meet.athletes.find((athlete) => athlete.id === editingAthleteId)
    : null;

  if (existing) {
    existing.name = name;
    existing.sex = sex;
    existing.category = category;
    existing.bodyweight = bodyweight;
    existing.weightClass = weightClassValue;
    resetAthleteForm();
    renderAthletes();
    refreshFilterOptions();
    renderLeaderboard();
    renderStrategyOptions();
    saveAppState();
    return;
  }

  const athlete = {
    id: crypto.randomUUID(),
    name,
    sex,
    category,
    bodyweight,
    weightClass: weightClassValue,
    squat: createAttemptSet(),
    bench: createAttemptSet(),
    deadlift: createAttemptSet(),
  };

  meet.athletes.push(athlete);
  resetAthleteForm();
  renderAthletes();
  refreshFilterOptions();
  renderLeaderboard();
  renderStrategyOptions();
  saveAppState();
}

function setEditMode(athleteId) {
  const meet = getActiveMeet();
  if (!meet || !athleteId) return;
  const athlete = meet.athletes.find((entry) => entry.id === athleteId);
  if (!athlete) return;
  editingAthleteId = athlete.id;
  DOM.nameInput.value = athlete.name;
  DOM.sexSelect.value = athlete.sex;
  DOM.categorySelect.value = athlete.category;
  DOM.bodyweightInput.value = athlete.bodyweight;
  updateAutoClassPreview();
  updateEditModeUI();
  DOM.nameInput.focus();
}

function exitEditMode() {
  if (!editingAthleteId) return;
  editingAthleteId = null;
  updateEditModeUI();
}

function updateEditModeUI() {
  const isEditing = Boolean(editingAthleteId);
  if (DOM.athleteFormTitle) {
    DOM.athleteFormTitle.textContent = isEditing ? "Edit Athlete" : "Add Athlete";
  }
  if (DOM.editModeIndicator) {
    DOM.editModeIndicator.classList.toggle("hidden", !isEditing);
  }
  if (DOM.athleteSubmit) {
    DOM.athleteSubmit.textContent = isEditing ? "Save Changes" : "Add Athlete";
  }
}

function resetAthleteForm() {
  DOM.nameInput.value = "";
  DOM.sexSelect.value = "";
  DOM.categorySelect.value = "";
  DOM.bodyweightInput.value = "";
  updateAutoClassPreview();
  exitEditMode();
}

function updateAutoClassPreview() {
  if (!DOM.autoClassDisplay) return;
  const sex = DOM.sexSelect?.value;
  const bodyweight = Number(DOM.bodyweightInput?.value);
  const label = getWeightClass(sex, bodyweight);
  DOM.autoClassDisplay.textContent = `Weightclass: ${label || "--"}`;
}

function handleAthleteFormInput() {
  if (!editingAthleteId) return;
  const cleared =
    !DOM.nameInput.value.trim() &&
    !DOM.sexSelect.value &&
    !DOM.categorySelect.value &&
    !DOM.bodyweightInput.value;
  if (cleared) {
    exitEditMode();
  }
}

function formatDateDisplay(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function parseDisplayDate(value) {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!day || !month || !year) return null;
  const candidate = new Date(year, month - 1, day);
  if (
    candidate.getFullYear() !== year ||
    candidate.getMonth() !== month - 1 ||
    candidate.getDate() !== day
  ) {
    return null;
  }
  const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { display: `${match[1]}/${match[2]}/${match[3]}`, iso };
}

function updateAttempt(id, lift, index, value) {
  const meet = getActiveMeet();
  if (!meet) return;
  const athlete = meet.athletes.find((a) => a.id === id);
  if (!athlete) return;
  const normalized = normalizeAttemptValue(value);
  athlete[lift][index].weight = normalized;
  updateAthleteCardTotal(athlete);
  renderLeaderboard();
  renderStrategyResult();
  saveAppState();
}

function updateAthleteCardTotal(athlete) {
  const element = document.querySelector(
    `[data-athlete-card="${athlete.id}"] .athlete-card__total`
  );
  if (element) {
    element.textContent = `${total(athlete).toFixed(1)} kg`;
  }
}

function updateJudgeDecision(athleteId, lift, attemptIndex, judgeIndex, decision) {
  const meet = getActiveMeet();
  if (!meet) return;
  const athlete = meet.athletes.find((a) => a.id === athleteId);
  if (!athlete) return;
  const attempt = athlete[lift][attemptIndex];
  if (!attempt) return;
  attempt.judges[judgeIndex] = decision;
  updateAttemptCellUI(athleteId, lift, attemptIndex, attempt);
  updateAthleteCardTotal(athlete);
  renderLeaderboard();
  renderStrategyResult();
  saveAppState();
}

function cycleJudgeDecision(athleteId, lift, attemptIndex, judgeIndex) {
  const meet = getActiveMeet();
  if (!meet) return;
  const athlete = meet.athletes.find((a) => a.id === athleteId);
  if (!athlete) return;
  const attempt = athlete[lift][attemptIndex];
  if (!attempt) return;
  const current = attempt.judges[judgeIndex];
  const sequence = ["pending", "good", "bad"];
  const nextStatus = sequence[(sequence.indexOf(current) + 1) % sequence.length];
  updateJudgeDecision(athleteId, lift, attemptIndex, judgeIndex, nextStatus);
}

function bestLift(attempts) {
  return attempts.reduce((best, attempt) => {
    if (!attempt) return best;
    const verdict = evaluateAttempt(attempt);
    if (attempt.weight > 0 && verdict.isGood) {
      return Math.max(best, attempt.weight);
    }
    return best;
  }, 0);
}

function total(athlete) {
  return LIFT_KEYS.reduce((sum, lift) => sum + bestLift(athlete[lift]), 0);
}

function glPointsFromTotal(totalKg, bodyweight) {
  if (!totalKg || !bodyweight) return 0;
  const coefficients = { a: 1199.72839, b: 1025.18162, c: 0.00921 };
  const denominator = coefficients.a - coefficients.b * Math.exp(-coefficients.c * bodyweight);
  if (denominator <= 0) return 0;
  return (totalKg / denominator) * 100;
}

function calculateGLPoints(athlete) {
  return glPointsFromTotal(total(athlete), athlete.bodyweight);
}

function getFilteredAthletes(options = {}) {
  const meet = getActiveMeet();
  if (!meet) return [];
  const applyWeightFilter = options.applyWeightFilter !== false;
  return meet.athletes.filter((athlete) => {
    if (uiState.sexFilter !== "all" && athlete.sex !== uiState.sexFilter) return false;
    if (uiState.categoryFilter !== "all" && athlete.category !== uiState.categoryFilter) return false;
    if (applyWeightFilter && uiState.weightClassFilter !== "all" && athlete.weightClass !== uiState.weightClassFilter)
      return false;
    return true;
  });
}

function renderAthletes() {
  const container = DOM.athletesContainer;
  container.innerHTML = "";
  const meet = getActiveMeet();
  if (!meet) return;
  meet.athletes.forEach((athlete) => {
    const card = document.createElement("div");
    card.className = "card athlete-card";
    card.dataset.athleteCard = athlete.id;
    card.innerHTML = `
      <div class="athlete-card__header">
        <div>
          <strong>${athlete.name}</strong>
          <p class="muted">${athlete.sex}&nbsp;&middot;&nbsp;${athlete.category}</p>
          <p class="muted">${athlete.weightClass}&nbsp;&middot;&nbsp;${athlete.bodyweight.toFixed(1)}kg</p>
        </div>
        <div class="athlete-card__actions">
          <div class="athlete-card__total">${total(athlete).toFixed(1)} kg</div>
          <button type="button" class="ghost-btn ghost-btn--small" data-athlete-remove="${athlete.id}">
            Remove
          </button>
          <button type="button" class="ghost-btn ghost-btn--small" data-athlete-edit="${athlete.id}">
            Edit
          </button>
        </div>
      </div>
      ${renderLiftInputs(athlete, "squat")}
      ${renderLiftInputs(athlete, "bench")}
      ${renderLiftInputs(athlete, "deadlift")}
    `;
    container.append(card);
  });
}

function renderLiftInputs(athlete, lift) {
  return `
    <div class="lift-row">
      <div class="lift-row__header">
        <strong>${lift.toUpperCase()}</strong>
      </div>
      <div class="lift-row__inputs">
        ${athlete[lift]
          .map((attempt, index) => renderAttemptCell(athlete, lift, attempt, index))
          .join("")}
      </div>
    </div>
  `;
}

function renderAttemptCell(athlete, lift, attempt, index) {
  const verdict = evaluateAttempt(attempt);
  const attemptKey = `${athlete.id}-${lift}-${index}`;
  const statusClass = verdict.isGood
    ? "result-good"
    : verdict.pending === JUDGE_COUNT
    ? "result-pending"
    : "result-bad";
  const statusLabel = verdict.pending === JUDGE_COUNT ? "Await" : verdict.isGood ? "Good" : "No Lift";
  const inputValue = typeof attempt.weight === "number" && Number.isFinite(attempt.weight) ? attempt.weight : "";

  return `
    <div class="attempt-cell" data-attempt="${attemptKey}" data-athlete-id="${athlete.id}" data-lift="${lift}" data-attempt-index="${index}">
      <div class="attempt-head">
        <span>${ATTEMPT_LABELS[index]}</span>
        <span class="attempt-status ${statusClass}">${statusLabel}</span>
      </div>
      <div class="attempt-body">
        <input
          type="number"
          inputmode="decimal"
          min="0"
          value="${inputValue === "" ? "" : inputValue}"
          oninput="updateAttempt('${athlete.id}','${lift}',${index},this.value)"
        />
        <div class="lights">
          ${attempt.judges
            .map((judge, judgeIndex) => renderJudgeButton(athlete.id, lift, index, judgeIndex, judge))
            .join("")}
        </div>
      </div>
    </div>
  `;
}

function renderJudgeButton(athleteId, lift, attemptIndex, judgeIndex, status) {
  const label = judgeIndex + 1;
  const statusClass =
    status === "good" ? "light-good" : status === "bad" ? "light-bad" : "light-pending";
  return `
    <button
      type="button"
      class="light ${statusClass}"
      data-judge-index="${judgeIndex}"
      onclick="cycleJudgeDecision('${athleteId}','${lift}',${attemptIndex},${judgeIndex})"
    >
      ${label}
    </button>
  `;
}

function updateAttemptCellUI(athleteId, lift, attemptIndex, attempt) {
  const attemptEl = document.querySelector(
    `[data-attempt="${athleteId}-${lift}-${attemptIndex}"]`
  );
  if (!attemptEl) return;
  const verdict = evaluateAttempt(attempt);
  const statusClass = verdict.isGood
    ? "result-good"
    : verdict.pending === JUDGE_COUNT
    ? "result-pending"
    : "result-bad";
  const statusLabel = verdict.pending === JUDGE_COUNT ? "Await" : verdict.isGood ? "Good" : "No Lift";
  const statusEl = attemptEl.querySelector(".attempt-status");
  if (statusEl) {
    statusEl.textContent = statusLabel;
    statusEl.classList.remove("result-good", "result-bad", "result-pending");
    statusEl.classList.add(statusClass);
  }
  const lights = attemptEl.querySelectorAll(".light");
  lights.forEach((lightEl, index) => {
    const status = attempt.judges[index];
    lightEl.classList.remove("light-good", "light-bad", "light-pending");
    if (status === "good") {
      lightEl.classList.add("light-good");
    } else if (status === "bad") {
      lightEl.classList.add("light-bad");
    } else {
      lightEl.classList.add("light-pending");
    }
  });
}

function getLeaderboardEntries() {
  const athletes = getFilteredAthletes();
  return athletes.map((athlete) => {
    const bests = {
      squat: bestLift(athlete.squat),
      bench: bestLift(athlete.bench),
      deadlift: bestLift(athlete.deadlift),
    };
    return {
      id: athlete.id,
      name: athlete.name,
      weightClass: athlete.weightClass,
      bodyweight: athlete.bodyweight,
      sex: athlete.sex,
      category: athlete.category,
      bests,
      total: bests.squat + bests.bench + bests.deadlift,
      gl: calculateGLPoints(athlete),
    };
  });
}

function renderLeaderboard() {
  const entries = getLeaderboardEntries();
  updateLeaderboardHeader();
  DOM.leaderboardBody.innerHTML = "";

  const view = uiState.activeLiftView;
  const sortKey = view === "total" ? (uiState.sortMode === "gl" ? "gl" : "total") : view;
  const secondaryKey = sortKey === "total" ? "gl" : "total";

  const sorted = [...entries].sort((a, b) => {
    const primaryA = getSortMetric(a, sortKey);
    const primaryB = getSortMetric(b, sortKey);
    if (primaryB !== primaryA) return primaryB - primaryA;

    if (view === "total") {
      const altA = getSortMetric(a, secondaryKey);
      const altB = getSortMetric(b, secondaryKey);
      if (altB !== altA) return altB - altA;
    }

    return a.bodyweight - b.bodyweight;
  });

  sorted.forEach((entry, index) => {
    const row = document.createElement("tr");
    const metricCell = view === "total" ? entry.total.toFixed(1) + " kg" : `${entry.bests[view].toFixed(1)} kg`;
    const auxCell =
      view === "total"
        ? `${entry.gl.toFixed(2)}`
        : `${entry.bodyweight.toFixed(1)} kg`;
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>
        <div class="leaderboard-name">${entry.name}</div>
        <div class="muted leader-meta">${entry.sex}&nbsp;&middot;&nbsp;${entry.category}&nbsp;&middot;&nbsp;${entry.weightClass}</div>
      </td>
      <td>${metricCell}</td>
      <td>${auxCell}</td>
    `;
    DOM.leaderboardBody.append(row);
  });
}

function getSortMetric(entry, key) {
  if (key === "gl") return entry.gl;
  if (key === "total") return entry.total;
  if (LIFT_KEYS.includes(key)) return entry.bests[key];
  return 0;
}

function updateLeaderboardHeader() {
  const view = uiState.activeLiftView;
  const head = DOM.leaderboardHeadRow;
  DOM.leaderboardTitle.textContent = `${LIFT_LABELS[view]} Leaderboard`;
  if (view === "total") {
    head.innerHTML = `
      <th>Rank</th>
      <th>Athlete</th>
      <th>Total</th>
      <th>GL</th>
    `;
  } else {
    head.innerHTML = `
      <th>Rank</th>
      <th>Athlete</th>
      <th>Best ${LIFT_LABELS[view]}</th>
      <th>Bodyweight</th>
    `;
  }
}

function refreshFilterOptions() {
  refreshWeightFilterOptions();
  populateCategorySelect(DOM.categoryFilter, false, true);
  DOM.categoryFilter.value = uiState.categoryFilter;
}

function refreshWeightFilterOptions() {
  if (!DOM.weightFilter) return;
  const athletes = getFilteredAthletes({ applyWeightFilter: false });
  const classes = Array.from(new Set(athletes.map((a) => a.weightClass).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );
  DOM.weightFilter.innerHTML =
    '<option value="all">All</option>' +
    classes.map((weightClass) => `<option value="${weightClass}">${weightClass}</option>`).join("");
  if (uiState.weightClassFilter !== "all" && !classes.includes(uiState.weightClassFilter)) {
    uiState.weightClassFilter = "all";
  }
  DOM.weightFilter.value = uiState.weightClassFilter;
}

function renderMeetSelection() {
  DOM.meetSelect.innerHTML = meets
    .map((meet) => `<option value="${meet.id}">${meet.name}</option>`)
    .join("");
  DOM.meetSelect.value = currentMeetId;

  const activeMeet = getActiveMeet();
  if (!activeMeet) {
    DOM.activeMeetMeta.textContent = "";
    return;
  }
  const locationText = activeMeet.location ? ` | ${activeMeet.location}` : "";
  DOM.activeMeetMeta.textContent = `${activeMeet.date}${locationText}`;
}

function renderActiveMeetName() {
  const meet = getActiveMeet();
  if (!DOM.activeMeetName) return;
  if (!meet) {
    DOM.activeMeetName.textContent = "Meet - Unnamed";
    return;
  }
  DOM.activeMeetName.textContent = meet.name?.trim() || `Meet - ${meet.date}`;
}

function renderMeetHistoryList() {
  if (!DOM.meetHistoryList) return;
  if (!meetHistory.length) {
    DOM.meetHistoryList.innerHTML = "<p class=\"muted\">No saved snapshots yet.</p>";
    return;
  }
  DOM.meetHistoryList.innerHTML = meetHistory
    .map(
      (entry) => `
        <div class="meet-history-item">
          <div>
            <strong>${entry.meetName}</strong>
            <span> - ${entry.date}</span>
            <div class="meet-history-edit hidden" data-meet-edit="${entry.id}">
              <input type="text" class="meet-history-input" value="${entry.meetName}" data-edit-field="name" />
              <input type="text" class="meet-history-input" value="${entry.date}" data-edit-field="date" placeholder="DD/MM/YYYY" inputmode="numeric" />
              <input type="text" class="meet-history-input" value="${entry.location || ""}" data-edit-field="location" placeholder="Location (optional)" />
            </div>
          </div>
          <div class="meet-history-actions">
            <button type="button" class="ghost-btn ghost-btn--small" data-meet-id="${entry.id}">Load</button>
            <button type="button" class="ghost-btn ghost-btn--small" data-action="edit" data-meet-id="${entry.id}">
              Edit
            </button>
            <button type="button" class="ghost-btn ghost-btn--small hidden" data-action="save" data-meet-id="${entry.id}">
              Save
            </button>
            <button type="button" class="ghost-btn ghost-btn--small hidden" data-action="cancel" data-meet-id="${entry.id}">
              Cancel
            </button>
            <button type="button" class="ghost-btn ghost-btn--small" data-action="delete" data-meet-id="${entry.id}">
              Delete
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function deleteMeet(meetId, confirmMessage = "Delete this meet and its saved snapshot?") {
  if (!meetId) return;
  if (!confirm(confirmMessage)) return;
  const meetIndex = meets.findIndex((meet) => meet.id === meetId);
  if (meetIndex >= 0) {
    meets.splice(meetIndex, 1);
  }
  const historyIndex = meetHistory.findIndex((entry) => entry.id === meetId);
  if (historyIndex >= 0) {
    meetHistory.splice(historyIndex, 1);
  }
  if (currentMeetId === meetId) {
    currentMeetId = meets[0]?.id || null;
  }
  renderAll();
  saveAppState();
}

function startMeetHistoryEdit(meetId) {
  resetMeetHistoryEdits(meetId);
  const item = DOM.meetHistoryList?.querySelector(`[data-meet-edit="${meetId}"]`);
  if (!item) return;
  item.classList.remove("hidden");
  toggleMeetHistoryButtons(meetId, true);
}

function cancelMeetHistoryEdit(meetId) {
  const entry = meetHistory.find((item) => item.id === meetId);
  if (!entry) return;
  const item = DOM.meetHistoryList?.querySelector(`[data-meet-edit="${meetId}"]`);
  if (!item) return;
  item.querySelector('[data-edit-field="name"]').value = entry.meetName || "";
  item.querySelector('[data-edit-field="date"]').value = entry.date || "";
  item.querySelector('[data-edit-field="location"]').value = entry.location || "";
  item.classList.add("hidden");
  toggleMeetHistoryButtons(meetId, false);
}

function saveMeetHistoryEdit(meetId) {
  try {
    const entry = meetHistory.find((item) => item.id === meetId);
    if (!entry) return;
    const item = DOM.meetHistoryList?.querySelector(`[data-meet-edit="${meetId}"]`);
    if (!item) return;
    const nameInput = item.querySelector('[data-edit-field="name"]');
    const dateInput = item.querySelector('[data-edit-field="date"]');
    const locationInput = item.querySelector('[data-edit-field="location"]');
    const nextName = nameInput.value.trim();
    const dateValue = dateInput.value.trim();
    const parsedDate = parseDisplayDate(dateValue);
    if (!nextName || !parsedDate) return;
    const nextLocation = locationInput.value.trim();

    entry.meetName = nextName;
    entry.date = parsedDate.display;
    entry.location = nextLocation;

    const meet = meets.find((m) => m.id === meetId);
    if (meet) {
      meet.name = nextName;
      meet.date = parsedDate.display;
      meet.location = nextLocation;
    }

    localStorage.setItem("meetHistory", JSON.stringify(meetHistory));
    renderMeetSelection();
    renderActiveMeetName();
    renderMeetHistoryList();
    saveAppState();
  } catch (error) {
    console.error("Failed to save meet edits", error);
  }
}

function toggleMeetHistoryButtons(meetId, isEditing) {
  const actions = DOM.meetHistoryList?.querySelectorAll(`[data-meet-id="${meetId}"]`);
  if (!actions) return;
  actions.forEach((button) => {
    if (!button.dataset.action) return;
    if (button.dataset.action === "edit") {
      button.classList.toggle("hidden", isEditing);
    }
    if (button.dataset.action === "save" || button.dataset.action === "cancel") {
      button.classList.toggle("hidden", !isEditing);
    }
  });
}

function resetMeetHistoryEdits(exceptMeetId = null) {
  DOM.meetHistoryList?.querySelectorAll("[data-meet-edit]").forEach((panel) => {
    if (panel.dataset.meetEdit === exceptMeetId) return;
    panel.classList.add("hidden");
    toggleMeetHistoryButtons(panel.dataset.meetEdit, false);
  });
}

function removeActiveMeet() {
  const meet = getActiveMeet();
  if (!meet) return;
  deleteMeet(meet.id, "Are you sure you want to delete this meet?");
}

function removeAthlete(athleteId) {
  const meet = getActiveMeet();
  if (!meet || !athleteId) return;
  if (!confirm("Remove this athlete and all attempts?")) return;
  meet.athletes = meet.athletes.filter((athlete) => athlete.id !== athleteId);
  if (editingAthleteId === athleteId) {
    exitEditMode();
  }
  renderAthletes();
  refreshFilterOptions();
  renderLeaderboard();
  renderStrategyOptions();
  saveAppState();
}

function updateMeetName(value) {
  const meet = getActiveMeet();
  if (!meet) return;
  const trimmed = value.trim();
  if (!trimmed) return;
  meet.name = trimmed;
  const historyEntry = meetHistory.find((entry) => entry.id === meet.id);
  if (historyEntry) {
    historyEntry.meetName = trimmed;
  }
  renderMeetSelection();
  renderActiveMeetName();
  renderMeetHistoryList();
  if (DOM.meetNameEditRow) {
    DOM.meetNameEditRow.classList.add("hidden");
  }
  saveAppState();
}

function saveLeaderboardSnapshot() {
  const meet = getActiveMeet();
  if (!meet) {
    showToast("Failed to save", "error");
    return;
  }
  try {
    const now = new Date();
    const date = formatDateDisplay(now);
    const timestamp = `${date} ${String(now.getHours()).padStart(2, "0")}:${String(
      now.getMinutes()
    ).padStart(2, "0")}`;

    const meetName = meet.name?.trim() || `Meet - ${date}`;
    const snapshotAthletes = meet.athletes.map((athlete) => {
      const clone = JSON.parse(JSON.stringify(athlete));
      clone.bests = {
        squat: bestLift(athlete.squat),
        bench: bestLift(athlete.bench),
        deadlift: bestLift(athlete.deadlift),
      };
      clone.total = total(athlete);
      clone.glPoints = calculateGLPoints(athlete);
      return clone;
    });

    const entry = {
      id: meet.id,
      meetName,
      date,
      timestamp,
      location: meet.location || "",
      athletes: snapshotAthletes,
      leaderboardSortMode: uiState.sortMode,
    };

    const existing = meetHistory.findIndex((item) => item.id === meet.id);
    if (existing >= 0) {
      meetHistory[existing] = entry;
    } else {
      meetHistory.push(entry);
    }

    if (!meet.name?.trim()) {
      meet.name = meetName;
      renderMeetSelection();
    }

    renderActiveMeetName();
    renderMeetHistoryList();
    saveAppState();
    showToast("Leaderboard saved", "success");
  } catch (error) {
    showToast("Failed to save", "error");
  }
}

function showToast(message, variant) {
  if (!DOM.saveToast || !DOM.saveToastMessage || !DOM.saveToastIcon) return;
  const isError = variant === "error";
  DOM.saveToast.classList.remove("hidden", "toast--success", "toast--error");
  DOM.saveToast.classList.add(isError ? "toast--error" : "toast--success");
  DOM.saveToastMessage.textContent = message;
  DOM.saveToastIcon.textContent = isError ? "!" : "✔";
  window.clearTimeout(showToast._timer);
  DOM.saveToast.classList.add("show");
  showToast._timer = window.setTimeout(() => {
    DOM.saveToast.classList.remove("show");
  }, 2200);
}

function renderStrategyOptions() {
  const athletes = getFilteredAthletes();
  const selectOptions =
    '<option value="">Select</option>' +
    athletes.map((athlete) => `<option value="${athlete.id}">${athlete.name}</option>`).join("");

  DOM.strategyAthlete.innerHTML = selectOptions;
  DOM.strategyTarget.innerHTML = selectOptions;

  if (!athletes.find((a) => a.id === strategyState.athleteId)) {
    strategyState.athleteId = "";
  } else {
    DOM.strategyAthlete.value = strategyState.athleteId;
  }

  if (!athletes.find((a) => a.id === strategyState.targetId)) {
    strategyState.targetId = "";
  } else {
    DOM.strategyTarget.value = strategyState.targetId;
  }

  renderStrategyResult();
}

function renderStrategyResult() {
  const meetAthletes = getFilteredAthletes();
  const athlete = meetAthletes.find((a) => a.id === strategyState.athleteId);
  const target = meetAthletes.find((a) => a.id === strategyState.targetId);

  if (!athlete || !target) {
    DOM.strategyValue.textContent = "--";
    DOM.strategyNote.textContent = "Select athlete and target from the current filtered field.";
    return;
  }

  if (athlete.id === target.id) {
    DOM.strategyValue.textContent = "--";
    DOM.strategyNote.textContent = "Choose two different athletes.";
    return;
  }

  const result = calculateRequiredAttempt({
    athlete,
    target,
    lift: strategyState.lift,
    scoring: strategyState.scoring,
  });

  DOM.strategyValue.textContent = result.displayValue;
  DOM.strategyNote.textContent = result.note;
}

function calculateRequiredAttempt({ athlete, target, lift, scoring }) {
  if (lift === "total") {
    return calculateTotalRequirement(athlete, target, scoring);
  }
  return calculateLiftRequirement(athlete, target, lift, scoring);
}

function calculateTotalRequirement(athlete, target, scoring) {
  const metricFn = scoring === "gl" ? calculateGLPoints : total;
  const targetMetric = metricFn(target);
  const athleteMetric = metricFn(athlete);

  const leadCheck = compareMetrics(athleteMetric, targetMetric, athlete.bodyweight, target.bodyweight);
  if (leadCheck.wins) {
    return {
      displayValue: "LOCKED",
      note: leadCheck.tie
        ? "Already winning on bodyweight tie-break."
        : "Already leading under current scoring.",
    };
  }

  const baseTotal = total(athlete);
  for (let addition = ATTEMPT_STEP; addition <= 200; addition += ATTEMPT_STEP) {
    const projectedTotal = baseTotal + addition;
    const projectedMetric =
      scoring === "gl" ? glPointsFromTotal(projectedTotal, athlete.bodyweight) : projectedTotal;

    const comparison = compareMetrics(
      projectedMetric,
      targetMetric,
      athlete.bodyweight,
      target.bodyweight
    );
    if (comparison.wins) {
      const label = scoring === "gl" ? `${projectedMetric.toFixed(2)} GL` : `${projectedTotal.toFixed(1)} kg`;
      return {
        displayValue: label,
        note: `Need +${addition.toFixed(1)} kg on any lift to move ahead${
          comparison.tie ? " (wins on bodyweight)." : "."
        }`,
      };
    }
  }

  return {
    displayValue: "N/A",
    note: "Cannot reach target with +200kg cap. Reassess attempts.",
  };
}

function calculateLiftRequirement(athlete, target, lift, scoring) {
  const targetMetric = scoring === "gl" ? calculateGLPoints(target) : total(target);
  const currentMetric = scoring === "gl" ? calculateGLPoints(athlete) : total(athlete);
  const leadCheck = compareMetrics(currentMetric, targetMetric, athlete.bodyweight, target.bodyweight);
  if (leadCheck.wins) {
    return {
      displayValue: "LOCKED",
      note: leadCheck.tie
        ? "Ahead via bodyweight tie-break."
        : `Already ahead on ${scoring.toUpperCase()} scoring.`,
    };
  }

  const currentBest = bestLift(athlete[lift]);
  for (let attempt = Math.max(currentBest, ATTEMPT_STEP); attempt <= MAX_PROJECTED_ATTEMPT; attempt += ATTEMPT_STEP) {
    const projectedTotal = projectTotalWithAttempt(athlete, lift, attempt);
    const projectedMetric =
      scoring === "gl" ? glPointsFromTotal(projectedTotal, athlete.bodyweight) : projectedTotal;
    const comparison = compareMetrics(
      projectedMetric,
      targetMetric,
      athlete.bodyweight,
      target.bodyweight
    );
    if (comparison.wins) {
      return {
        displayValue: `${attempt.toFixed(1)} kg`,
        note: `Set ${LIFT_LABELS[lift]} to ${attempt.toFixed(1)} kg to surpass${
          comparison.tie ? " (wins on bodyweight)." : "."
        }`,
      };
    }
  }

  return {
    displayValue: "N/A",
    note: "Projected attempt cap reached. Consider different strategy.",
  };
}

function projectTotalWithAttempt(athlete, lift, attempt) {
  const baseBest = bestLift(athlete[lift]);
  const newBest = Math.max(baseBest, attempt);
  return total(athlete) - baseBest + newBest;
}

function compareMetrics(metricA, metricB, bodyweightA, bodyweightB) {
  if (metricA > metricB) return { wins: true, tie: false };
  if (metricA === metricB && bodyweightA < bodyweightB) return { wins: true, tie: true };
  return { wins: false, tie: false };
}


function updateSortButtons() {
  DOM.sortButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === uiState.sortMode);
  });
}

function updateLiftButtons() {
  DOM.liftButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lift === uiState.activeLiftView);
  });
}

function renderAll() {
  renderMeetSelection();
  renderActiveMeetName();
  renderMeetHistoryList();
  renderAthletes();
  refreshFilterOptions();
  updateSortButtons();
  updateLiftButtons();
  renderLeaderboard();
  renderStrategyOptions();
}

window.addAthlete = addAthlete;
window.updateAttempt = updateAttempt;
window.updateJudgeDecision = updateJudgeDecision;
window.cycleJudgeDecision = cycleJudgeDecision;
