let activeBoardTasks = [];
let activeBoardTaskId = "";

/**
 * Renders locally saved tasks into the board columns and wires the detail view.
 */
function initBoardTasks() {
  const taskLists = document.querySelectorAll("[data-board-status]");
  if (!taskLists.length) return;

  activeBoardTasks = getStoredTasks();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
}

function renderBoardColumns(tasks) {
  document.querySelectorAll("[data-board-status]").forEach((taskList) => {
    renderBoardColumn(taskList, tasks);
  });
}

function renderBoardColumn(taskList, tasks) {
  const status = taskList.dataset.boardStatus;
  const filteredTasks = tasks.filter((task) => task.status === status);

  taskList.innerHTML = filteredTasks.length
    ? filteredTasks.map(getBoardTaskTemplate).join("")
    : getBoardEmptyTemplate(status);
}

function getBoardTaskTemplate(task) {
  return `
    <article class="board-card" data-task-id="${escapeBoardText(task.id)}" tabindex="0">
      <span class="board-card__category">${formatBoardCategory(task.category)}</span>
      <h3>${escapeBoardText(task.title)}</h3>
      <p>${escapeBoardText(task.description || "No description")}</p>
      <div class="board-card__meta">
        <span class="board-card__date">${escapeBoardText(task.dueDate)}</span>
        <span class="board-card__priority">${escapeBoardText(task.priority)}</span>
      </div>
    </article>
  `;
}

function getBoardEmptyTemplate(status) {
  return `<p class="board-empty-state">No tasks ${formatBoardStatus(status)}</p>`;
}

/**
 * Adds click and keyboard handling for opening, closing and editing task details.
 */
function initBoardTaskDetails(tasks) {
  document.querySelectorAll(".board-card").forEach((card) => {
    card.addEventListener("click", () => openBoardTaskDetail(card.dataset.taskId, tasks));
    card.addEventListener("keydown", (event) => handleBoardCardKey(event, card, tasks));
  });
  initBoardDetailControls();
}

function initBoardDetailControls() {
  const overlay = getBoardDetailOverlay();
  if (overlay.dataset.eventsReady === "true") return;

  getBoardDetailCloseButton().addEventListener("click", closeBoardTaskDetail);
  overlay.addEventListener("click", handleBoardDetailBackdrop);
  document.addEventListener("keydown", handleBoardDetailEscape);
  getBoardEditButton().addEventListener("click", showBoardEditMode);
  getBoardEditCancelButton().addEventListener("click", showBoardDetailViewMode);
  getBoardEditForm().addEventListener("submit", handleBoardEditSubmit);
  overlay.dataset.eventsReady = "true";
}

function handleBoardCardKey(event, card, tasks) {
  if (event.key !== "Enter" && event.key !== " ") return;

  event.preventDefault();
  openBoardTaskDetail(card.dataset.taskId, tasks);
}

function openBoardTaskDetail(taskId, tasks) {
  const task = tasks.find((currentTask) => currentTask.id === taskId);
  if (!task) return;

  activeBoardTaskId = task.id;
  fillBoardTaskDetail(task);
  showBoardDetailViewMode();
  getBoardDetailOverlay().hidden = false;
}

function closeBoardTaskDetail() {
  getBoardDetailOverlay().hidden = true;
  activeBoardTaskId = "";
  showBoardDetailViewMode();
}

function handleBoardDetailBackdrop(event) {
  if (event.target === getBoardDetailOverlay()) closeBoardTaskDetail();
}

function handleBoardDetailEscape(event) {
  if (event.key === "Escape") closeBoardTaskDetail();
}

function fillBoardTaskDetail(task) {
  setBoardDetailText("boardTaskDetailCategory", formatBoardCategory(task.category));
  setBoardDetailText("boardTaskDetailTitle", task.title);
  setBoardDetailText("boardTaskDetailDescription", task.description || "No description");
  setBoardDetailText("boardTaskDetailDueDate", task.dueDate || "-");
  setBoardDetailText("boardTaskDetailPriority", task.priority || "-");
  setBoardDetailText("boardTaskDetailAssignee", task.assignedTo || "Not assigned");
  setBoardDetailText("boardTaskDetailSubtasks", formatBoardSubtasks(task.subtasks));
}

function showBoardEditMode() {
  const task = getActiveBoardTask();
  if (!task) return;

  fillBoardTaskEditForm(task);
  getBoardDetailView().hidden = true;
  getBoardEditForm().hidden = false;
}

function showBoardDetailViewMode() {
  getBoardDetailView().hidden = false;
  getBoardEditForm().hidden = true;
}

function fillBoardTaskEditForm(task) {
  getBoardEditField("Title").value = task.title || "";
  getBoardEditField("Description").value = task.description || "";
  getBoardEditField("DueDate").value = task.dueDate || "";
  getBoardEditField("Category").value = task.category || "user-story";
  getBoardEditField("Priority").value = task.priority || "medium";
}

function handleBoardEditSubmit(event) {
  event.preventDefault();
  const task = getActiveBoardTask();
  if (!task) return;

  const updatedTask = getBoardEditedTask(task);
  updateStoredTask(updatedTask);
  refreshBoardAfterEdit(updatedTask.id);
}

function getBoardEditedTask(task) {
  return {
    ...task,
    title: getBoardEditField("Title").value.trim(),
    description: getBoardEditField("Description").value.trim(),
    dueDate: getBoardEditField("DueDate").value,
    category: getBoardEditField("Category").value,
    priority: getBoardEditField("Priority").value,
  };
}

function refreshBoardAfterEdit(taskId) {
  activeBoardTasks = getStoredTasks();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
  openBoardTaskDetail(taskId, activeBoardTasks);
}

function getActiveBoardTask() {
  return activeBoardTasks.find((task) => task.id === activeBoardTaskId);
}

function setBoardDetailText(elementId, text) {
  document.getElementById(elementId).textContent = text;
}

function formatBoardSubtasks(subtasks) {
  if (!subtasks || !subtasks.length) return "No subtasks";
  return subtasks.join(", ");
}

function getBoardDetailOverlay() {
  return document.getElementById("boardTaskDetail");
}

function getBoardDetailCloseButton() {
  return document.getElementById("boardTaskDetailClose");
}

function getBoardDetailView() {
  return document.getElementById("boardTaskDetailView");
}

function getBoardEditButton() {
  return document.getElementById("boardTaskEditButton");
}

function getBoardEditCancelButton() {
  return document.getElementById("boardTaskEditCancel");
}

function getBoardEditForm() {
  return document.getElementById("boardTaskEditForm");
}

function getBoardEditField(fieldName) {
  return document.getElementById(`boardTaskEdit${fieldName}`);
}

function formatBoardCategory(category) {
  const categoryLabels = {
    "technical-task": "Technical Task",
    "user-story": "User Story",
  };

  return categoryLabels[category] || "Task";
}

function formatBoardStatus(status) {
  const statusLabels = {
    todo: "to do",
    "in-progress": "in progress",
    feedback: "awaiting feedback",
    done: "done",
  };

  return statusLabels[status] || "here";
}

function escapeBoardText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
