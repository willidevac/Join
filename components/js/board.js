let activeBoardTasks = [];
let activeBoardTaskId = "";


/**
 * Loads tasks from the task store and wires the board interactions.
 */
async function initBoardTasks() {
  const taskLists = document.querySelectorAll("[data-board-status]");
  if (!taskLists.length) return;

  try {
    activeBoardTasks = await loadTasksFromStore();
    renderBoardColumns(activeBoardTasks);
    initBoardTaskDetails(activeBoardTasks);
    initBoardDropZones(taskLists);
    initBoardSearch();
  } catch (error) {
    showBoardToast("Board tasks could not be loaded.");
  }
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
 * Adds click and keyboard handling for opening, closing and editing task details.
 */
function initBoardTaskDetails(tasks) {
  document
    .querySelectorAll(".board-card")
    .forEach((card) => addBoardCardListeners(card, tasks));
  initBoardDetailControls();
}


/**
 * Wires the click, keyboard and drag events of one board card.
 * @param {HTMLElement} card - The board card element.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function addBoardCardListeners(card, tasks) {
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
  addBoardCardMoveListeners(card, tasks);
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
  document.addEventListener("click", closeAllBoardCardMoveMenus);
  initBoardDetailActionControls();
  overlay.dataset.eventsReady = "true";
}


/**
 * Wires the edit, delete, form and status controls of the detail dialog.
 */
function initBoardDetailActionControls() {
  getBoardEditButton().addEventListener("click", showBoardEditMode);
  getBoardDeleteButton().addEventListener("click", handleBoardDeleteClick);
  getBoardEditCancelButton().addEventListener("click", showBoardDetailViewMode);
  getBoardEditForm().addEventListener("submit", handleBoardEditSubmit);
  initBoardEditValidation();
  getBoardDetailSubtasks().addEventListener(
    "change",
    handleBoardDetailSubtaskChange,
  );
  getBoardMobileStatusSelect().addEventListener(
    "change",
    handleBoardMobileStatusChange,
  );
  initBoardEditDropdowns();
}


/**
 * Opens the task detail when a card is activated via Enter or Space.
 * @param {KeyboardEvent} event - The keydown event.
 * @param {HTMLElement} card - The focused board card.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function handleBoardCardKey(event, card, tasks) {
  if (event.target !== card) return;
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openBoardTaskDetail(card.dataset.taskId, tasks);
}


/**
 * Wires the mobile move menu controls of one board card.
 * @param {HTMLElement} card - The board card element.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
function addBoardCardMoveListeners(card, tasks) {
  const toggle = card.querySelector(".board-card-move__toggle");
  if (!toggle) return;
  toggle.addEventListener("click", (event) => toggleBoardCardMoveMenu(event, card));
  card.querySelectorAll("[data-move-status]").forEach((option) => {
    option.addEventListener("click", (event) => handleBoardCardMoveOption(event, card, tasks));
  });
}


/**
 * Opens or closes the move menu of one card and closes all other menus.
 * @param {MouseEvent} event - The toggle button click event.
 * @param {HTMLElement} card - The board card element.
 */
function toggleBoardCardMoveMenu(event, card) {
  event.stopPropagation();
  const menu = card.querySelector(".board-card-move__menu");
  const shouldOpen = menu.hidden;
  closeAllBoardCardMoveMenus();
  menu.hidden = !shouldOpen;
  card.querySelector(".board-card-move__toggle").setAttribute("aria-expanded", String(shouldOpen));
}


/**
 * Closes every open move menu on the board.
 */
function closeAllBoardCardMoveMenus() {
  document.querySelectorAll(".board-card-move__menu:not([hidden])").forEach((menu) => {
    menu.hidden = true;
  });
  document.querySelectorAll('.board-card-move__toggle[aria-expanded="true"]').forEach((toggle) => {
    toggle.setAttribute("aria-expanded", "false");
  });
}


/**
 * Moves the card's task to the picked column and re-renders the board.
 * @param {MouseEvent} event - The option button click event.
 * @param {HTMLElement} card - The board card element.
 * @param {Object[]} tasks - All tasks shown on the board.
 */
async function handleBoardCardMoveOption(event, card, tasks) {
  event.stopPropagation();
  const status = event.currentTarget.dataset.moveStatus;
  const task = tasks.find((currentTask) => currentTask.id === card.dataset.taskId);
  if (!task) return;
  try {
    await moveBoardTaskToStatus(task, status);
  } catch (error) {
    showBoardToast("Task status could not be updated.");
  }
}


/**
 * Opens the detail dialog for the task with the given id and locks page scrolling.
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
  getBoardDetailCard().scrollTop = 0;
  lockPageScroll();
}


/**
 * Closes the detail dialog, restores page scrolling and resets it to view mode.
 */
function closeBoardTaskDetail() {
  getBoardDetailOverlay().hidden = true;
  unlockPageScroll();
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
 * Fills the meta fields (due date, priority, assignee) of the task detail dialog.
 * @param {Object} task - The task providing the meta information.
 */
function fillBoardDetailMetaFields(task) {
  setBoardDetailText(
    "boardTaskDetailDueDate",
    formatTaskDueDate(task.dueDate) || "-",
  );
  fillBoardDetailPriority(task.priority);
  syncBoardMobileStatus(task.status);
  renderBoardDetailAssignees(task.assignedTo);
}


/**
 * Shows the priority text with its icon in the task detail dialog.
 * @param {string} priority - Stored priority of the task.
 */
function fillBoardDetailPriority(priority) {
  setBoardDetailText("boardTaskDetailPriority", priority || "-");
  const icon = document.getElementById("boardTaskDetailPriorityIcon");
  icon.src = priority ? getBoardPriorityIcon(priority) : "";
  icon.hidden = !priority;
}


/**
 * Renders the assignees as avatar rows in the task detail dialog.
 * @param {Array|string} assignedTo - Stored task assignment value.
 */
async function renderBoardDetailAssignees(assignedTo) {
  const references = getTaskAssigneeReferences(assignedTo);
  const target = document.getElementById("boardTaskDetailAssignee");
  if (!references.length) {
    target.textContent = "Not assigned";
    return;
  }
  const contacts = await loadBoardDetailContacts();
  target.innerHTML = references
    .map((reference) => getBoardDetailAssigneeTemplate(resolveAssigneeDisplay(reference, contacts)))
    .join("");
}


/**
 * Combines an assignee reference with the color of its matching contact.
 * @param {Object} reference - Stored assignee reference with id and name.
 * @param {Object[]} contacts - All known contacts.
 * @returns {{name: string, color: string}} Display data for the avatar row.
 */
function resolveAssigneeDisplay(reference, contacts) {
  const contact = contacts.find((item) => isTaskAssigneeContact(reference, item));
  return {
    name: reference.name,
    color: (contact && contact.color) || "var(--color-primary-auth)",
  };
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
 * @returns {HTMLElement} The scrollable card inside the task detail dialog.
 */
function getBoardDetailCard() {
  return document.getElementById("boardTaskDetailCard");
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
