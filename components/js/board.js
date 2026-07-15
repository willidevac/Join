let activeBoardTasks = [];
let activeBoardTaskId = "";


/**
 * Loads tasks from the task store and wires the board interactions.
 */
async function initBoardTasks() {
  const taskLists = document.querySelectorAll("[data-board-status]");
  if (!taskLists.length) return;

  activeBoardTasks = await loadTasksFromStore();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
  initBoardDropZones(taskLists);
  initBoardSearch();
}


/**
 * Renders every board column with the tasks matching its status.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function renderBoardColumns(tasks) {
  document.querySelectorAll("[data-board-status]").forEach((taskList) => {
    renderBoardColumn(taskList, tasks);
  });
}


/**
 * Fills one column with its task cards or an empty-state message.
 * @param {HTMLElement} taskList - The column's task list element.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function renderBoardColumn(taskList, tasks) {
  const status = taskList.dataset.boardStatus;
  const filteredTasks = tasks.filter((task) => task.status === status);
  taskList.innerHTML = filteredTasks.length
    ? filteredTasks.map(getBoardTaskTemplate).join("")
    : getBoardEmptyTemplate(status);
}


/**
 * Returns the empty-state markup for a column without tasks.
 * @param {string} status - The status of the empty column.
 * @returns {string} The empty-state HTML.
 */
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


/**
 * Wires all buttons and events of the task detail dialog once.
 */
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
  getBoardDetailSubtasks().addEventListener("change", handleBoardDetailSubtaskChange);
  getBoardMobileStatusSelect().addEventListener("change", handleBoardMobileStatusChange);
  initBoardEditDropdowns();
  overlay.dataset.eventsReady = "true";
}


/**
 * Opens the task detail when a card is activated via Enter or Space.
 * @param {KeyboardEvent} event - The keydown event.
 * @param {HTMLElement} card - The focused board card.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function handleBoardCardKey(event, card, tasks) {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openBoardTaskDetail(card.dataset.taskId, tasks);
}


/**
 * Opens the detail dialog for the task with the given id.
 * @param {string} taskId - The id of the task to show.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function openBoardTaskDetail(taskId, tasks) {
  const task = tasks.find((currentTask) => currentTask.id === taskId);
  if (!task) return;
  activeBoardTaskId = task.id;
  fillBoardTaskDetail(task);
  showBoardDetailViewMode();
  getBoardDetailOverlay().hidden = false;
}


/**
 * Closes the detail dialog and resets it to view mode.
 */
function closeBoardTaskDetail() {
  getBoardDetailOverlay().hidden = true;
  activeBoardTaskId = "";
  showBoardDetailViewMode();
}


/**
 * Closes the detail dialog when the backdrop is clicked.
 * @param {MouseEvent} event - The click event.
 */
function handleBoardDetailBackdrop(event) {
  if (event.target === getBoardDetailOverlay()) closeBoardTaskDetail();
}


/**
 * Closes the detail dialog when the Escape key is pressed.
 * @param {KeyboardEvent} event - The keydown event.
 */
function handleBoardDetailEscape(event) {
  if (event.key === "Escape") closeBoardTaskDetail();
}


/**
 * Fills the task detail dialog with the content of the given task.
 * @param {Object} task - The task shown in the detail view.
 */
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
  fillBoardDetailMetaFields(task);
  renderBoardDetailSubtasks(task);
}


/**
 * Fills the meta fields (due date, priority, status, assignee) of the task detail dialog.
 * @param {Object} task - The task providing the meta information.
 */
function fillBoardDetailMetaFields(task) {
  setBoardDetailText(
    "boardTaskDetailDueDate",
    formatTaskDueDate(task.dueDate) || "-",
  );
  setBoardDetailText("boardTaskDetailPriority", task.priority || "-");
  setBoardDetailText("boardTaskDetailStatus", formatBoardStatus(task.status));
  syncBoardMobileStatus(task.status);
  setBoardDetailText(
    "boardTaskDetailAssignee",
    task.assignedTo || "Not assigned",
  );
}


/**
 * Switches the detail dialog back to the read-only view.
 */
function showBoardDetailViewMode() {
  getBoardDetailView().hidden = false;
  getBoardEditForm().hidden = true;
}


/**
 * Returns the task currently shown in the detail dialog.
 * @returns {Object|undefined} The active task, if any.
 */
function getActiveBoardTask() {
  return activeBoardTasks.find((task) => task.id === activeBoardTaskId);
}


/**
 * Sets the text content of a detail dialog element.
 * @param {string} elementId - The id of the target element.
 * @param {string} text - The text to display.
 */
function setBoardDetailText(elementId, text) {
  document.getElementById(elementId).textContent = text;
}


/**
 * Returns the overlay element of the task detail dialog.
 * @returns {HTMLElement} The detail overlay.
 */
function getBoardDetailOverlay() {
  return document.getElementById("boardTaskDetail");
}


/**
 * Returns the close button of the task detail dialog.
 * @returns {HTMLElement} The close button.
 */
function getBoardDetailCloseButton() {
  return document.getElementById("boardTaskDetailClose");
}


/**
 * Returns the read-only view container of the task detail dialog.
 * @returns {HTMLElement} The detail view container.
 */
function getBoardDetailView() {
  return document.getElementById("boardTaskDetailView");
}


/**
 * Maps a category key to its readable display label.
 * @param {string} category - The category key of the task.
 * @returns {string} The category label.
 */
function formatBoardCategory(category) {
  const categoryLabels = {
    "technical-task": "Technical Task",
    "user-story": "User Story",
  };
  return categoryLabels[category] || "Task";
}


/**
 * Maps a status key to its readable display label.
 * @param {string} status - The status key of a column or task.
 * @returns {string} The status label.
 */
function formatBoardStatus(status) {
  const statusLabels = {
    todo: "to do",
    "in-progress": "in progress",
    feedback: "awaiting feedback",
    done: "done",
  };
  return statusLabels[status] || "here";
}


/**
 * Escapes HTML special characters to prevent markup injection.
 * @param {string} value - The raw text value.
 * @returns {string} The escaped text.
 */
function escapeBoardText(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/**
 * Shows a short feedback popup that hides itself after three seconds.
 * @param {string} message - The feedback text to display.
 */
function showBoardToast(message) {
  const toast = document.getElementById("boardToast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), 3000);
}
