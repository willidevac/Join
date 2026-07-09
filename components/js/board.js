let activeBoardTasks = [];
let activeBoardTaskId = "";
let draggedBoardTaskId = "";

/**
 * Renders locally saved tasks into the board columns and wires the detail view.
 */
function initBoardTasks() {
  const taskLists = document.querySelectorAll("[data-board-status]");
  if (!taskLists.length) return;

  activeBoardTasks = getStoredTasks();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
  initBoardDropZones(taskLists);
  initBoardSearch();
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

function getBoardEmptyTemplate(status) {
  return `<p class="board-empty-state">No tasks ${formatBoardStatus(status)}</p>`;
}

/**
 * Adds click and keyboard handling for opening, closing and editing task details.
 */
function initBoardTaskDetails(tasks) {
  document.querySelectorAll(".board-card").forEach((card) => {
    card.addEventListener("click", () =>
      openBoardTaskDetail(card.dataset.taskId, tasks),
    );
    card.addEventListener("keydown", (event) =>
      handleBoardCardKey(event, card, tasks),
    );
    card.addEventListener("dragstart", (event) =>
      handleBoardDragStart(event, card),
    );
    card.addEventListener("dragend", handleBoardDragEnd);
  });
  initBoardDetailControls();
}

function initBoardDropZones(taskLists) {
  taskLists.forEach((taskList) => {
    if (taskList.dataset.dropEventsReady === "true") return;

    taskList.addEventListener("dragover", (event) =>
      handleBoardDragOver(event, taskList),
    );
    taskList.addEventListener("dragleave", (event) =>
      handleBoardDragLeave(event, taskList),
    );
    taskList.addEventListener("drop", (event) =>
      handleBoardDrop(event, taskList),
    );
    taskList.dataset.dropEventsReady = "true";
  });
}

function handleBoardDragOver(event, taskList) {
  if (!draggedBoardTaskId) return;

  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  taskList.classList.add("board-task-list--dragover");
}

function handleBoardDragLeave(event, taskList) {
  if (event.relatedTarget && taskList.contains(event.relatedTarget)) return;

  clearBoardDropFeedback(taskList);
}

function handleBoardDrop(event, taskList) {
  event.preventDefault();
  const task = getDraggedBoardTask();
  if (!task) return;

  updateStoredTask({ ...task, status: taskList.dataset.boardStatus });
  draggedBoardTaskId = "";
  clearAllBoardDropFeedback();
  refreshBoardAfterDrop();
}

function getDraggedBoardTask() {
  return activeBoardTasks.find((task) => task.id === draggedBoardTaskId);
}

function clearBoardDropFeedback(taskList) {
  taskList.classList.remove("board-task-list--dragover");
}

function clearAllBoardDropFeedback() {
  document.querySelectorAll("[data-board-status]").forEach((taskList) => {
    clearBoardDropFeedback(taskList);
  });
}

function refreshBoardAfterDrop() {
  activeBoardTasks = getStoredTasks();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
}
function initBoardDetailControls() {
  const overlay = getBoardDetailOverlay();
  if (overlay.dataset.eventsReady === "true") return;

  getBoardDetailCloseButton().addEventListener("click", closeBoardTaskDetail);
  overlay.addEventListener("click", handleBoardDetailBackdrop);
  document.addEventListener("keydown", handleBoardDetailEscape);
  getBoardEditButton().addEventListener("click", showBoardEditMode);
  getBoardDeleteButton().addEventListener("click", handleBoardDeleteClick);
  getBoardEditCancelButton().addEventListener("click", showBoardDetailViewMode);
  getBoardEditForm().addEventListener("submit", handleBoardEditSubmit);
  overlay.dataset.eventsReady = "true";
}

function handleBoardDragStart(event, card) {
  draggedBoardTaskId = card.dataset.taskId;
  card.classList.add("board-card--dragging");
  event.dataTransfer.setData("text/plain", draggedBoardTaskId);
}

function handleBoardDragEnd() {
  clearActiveBoardDragCard();
  draggedBoardTaskId = "";
  clearAllBoardDropFeedback();
}

function clearActiveBoardDragCard() {
  document.querySelectorAll(".board-card--dragging").forEach((card) => {
    card.classList.remove("board-card--dragging");
  });
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
  setBoardDetailText(
    "boardTaskDetailCategory",
    formatBoardCategory(task.category),
  );
  setBoardDetailText("boardTaskDetailTitle", task.title);
  setBoardDetailText(
    "boardTaskDetailDescription",
    task.description || "No description",
  );
  setBoardDetailText("boardTaskDetailDueDate", task.dueDate || "-");
  setBoardDetailText("boardTaskDetailPriority", task.priority || "-");
  setBoardDetailText("boardTaskDetailStatus", formatBoardStatus(task.status));
  setBoardDetailText(
    "boardTaskDetailAssignee",
    task.assignedTo || "Not assigned",
  );
  setBoardDetailText(
    "boardTaskDetailSubtasks",
    formatBoardSubtasks(task.subtasks),
  );
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
  getBoardEditField("Status").value = task.status || "todo";
  getBoardEditField("Assignee").value = task.assignedTo || "";
  getBoardEditField("Subtasks").value = formatBoardSubtasksForEdit(
    task.subtasks,
  );
}

function handleBoardDeleteClick() {
  if (!activeBoardTaskId) return;

  deleteStoredTask(activeBoardTaskId);
  closeBoardTaskDetail();
  initBoardTasks();
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
    status: getBoardEditField("Status").value,
    assignedTo: getBoardEditField("Assignee").value.trim(),
    subtasks: getBoardEditedSubtasks(),
  };
}

function getBoardEditedSubtasks() {
  return getBoardEditField("Subtasks")
    .value.split("\n")
    .map(getTrimmedText)
    .filter(Boolean);
}

function getTrimmedText(text) {
  return text.trim();
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

function formatBoardSubtasksForEdit(subtasks) {
  if (!subtasks || !subtasks.length) return "";
  return subtasks.join("\n");
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

function getBoardDeleteButton() {
  return document.getElementById("boardTaskDeleteButton");
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
