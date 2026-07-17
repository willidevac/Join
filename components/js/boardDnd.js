let draggedBoardTaskId = "";
let boardDragGhost = null;
let boardDragGhostOffsetX = 0;
let boardDragGhostOffsetY = 0;


/**
 * Registers dragover, dragleave and drop handling on every board column.
 * @param {NodeList} taskLists - The task list elements of all columns.
 */
function initBoardDropZones(taskLists) {
  taskLists.forEach((taskList) => {
    if (taskList.dataset.dropEventsReady === "true") return;
    addBoardDropListeners(taskList);
    taskList.dataset.dropEventsReady = "true";
  });
}


/**
 * Attaches the dragover, dragleave and drop listeners to one column.
 * @param {HTMLElement} taskList - The task list element of the column.
 */
function addBoardDropListeners(taskList) {
  taskList.addEventListener("dragover", (event) =>
    handleBoardDragOver(event, taskList),
  );
  taskList.addEventListener("dragleave", (event) =>
    handleBoardDragLeave(event, taskList),
  );
  taskList.addEventListener("drop", (event) =>
    handleBoardDrop(event, taskList),
  );
}


/**
 * Allows dropping on a column and shows the drop highlight while dragging.
 * @param {DragEvent} event - The dragover event.
 * @param {HTMLElement} taskList - The column being dragged over.
 */
function handleBoardDragOver(event, taskList) {
  if (!draggedBoardTaskId) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "move";
  taskList.classList.add("board-task-list--dragover");
}


/**
 * Removes the drop highlight when the dragged card leaves a column.
 * @param {DragEvent} event - The dragleave event.
 * @param {HTMLElement} taskList - The column being left.
 */
function handleBoardDragLeave(event, taskList) {
  if (event.relatedTarget && taskList.contains(event.relatedTarget)) return;
  clearBoardDropFeedback(taskList);
}


/**
 * Handles dropping a dragged task card onto a board column.
 * @param {DragEvent} event - The drop event.
 * @param {HTMLElement} taskList - The task list the card was dropped on.
 */
async function handleBoardDrop(event, taskList) {
  event.preventDefault();
  const task = getDraggedBoardTask();
  if (!task) return;
  try {
    await moveBoardTaskToStatus(task, taskList.dataset.boardStatus);
  } catch (error) {
    showBoardToast("Task status could not be updated.");
  } finally {
    draggedBoardTaskId = "";
    clearAllBoardDropFeedback();
    removeBoardDragGhost();
  }
}


/**
 * Saves the task with its new status and refreshes the board columns.
 * @param {Object} task - The task being moved.
 * @param {string} status - The status of the target column.
 */
async function moveBoardTaskToStatus(task, status) {
  await updateTaskInStore({ ...task, status });
  await refreshBoardAfterDrop();
}


/**
 * Returns the task that is currently being dragged.
 * @returns {Object|undefined} The dragged task, if any.
 */
function getDraggedBoardTask() {
  return activeBoardTasks.find((task) => task.id === draggedBoardTaskId);
}


/**
 * Removes the drop highlight from one column.
 * @param {HTMLElement} taskList - The column to clear.
 */
function clearBoardDropFeedback(taskList) {
  taskList.classList.remove("board-task-list--dragover");
}


/**
 * Removes the drop highlight from all columns.
 */
function clearAllBoardDropFeedback() {
  document.querySelectorAll("[data-board-status]").forEach((taskList) => {
    clearBoardDropFeedback(taskList);
  });
}


/**
 * Reloads all tasks and re-renders the board after a drop.
 */
async function refreshBoardAfterDrop() {
  activeBoardTasks = await loadTasksFromStore();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
}


/**
 * Starts a card drag with a custom rotated ghost following the mouse.
 * @param {DragEvent} event - The dragstart event.
 * @param {HTMLElement} card - The card being dragged.
 */
function handleBoardDragStart(event, card) {
  draggedBoardTaskId = card.dataset.taskId;
  event.dataTransfer.setData("text/plain", draggedBoardTaskId);
  hideNativeBoardDragImage(event);
  createBoardDragGhost(event, card);
  document.addEventListener("dragover", moveBoardDragGhost);
  window.setTimeout(() => card.classList.add("board-card--dragging"));
}


/**
 * Replaces the browser's drag snapshot with a transparent pixel.
 * @param {DragEvent} event - The dragstart event.
 */
function hideNativeBoardDragImage(event) {
  const emptyImage = new Image();
  emptyImage.src =
    "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
  event.dataTransfer.setDragImage(emptyImage, 0, 0);
}


/**
 * Creates the rotated card clone that follows the mouse while dragging.
 * @param {DragEvent} event - The dragstart event.
 * @param {HTMLElement} card - The card being dragged.
 */
function createBoardDragGhost(event, card) {
  const rect = card.getBoundingClientRect();
  boardDragGhostOffsetX = event.clientX - rect.left;
  boardDragGhostOffsetY = event.clientY - rect.top;
  boardDragGhost = card.cloneNode(true);
  boardDragGhost.classList.add("board-card--ghost");
  boardDragGhost.style.width = `${rect.width}px`;
  document.body.append(boardDragGhost);
  moveBoardDragGhost(event);
}


/**
 * Moves the drag ghost to the current mouse position.
 * @param {DragEvent} event - A dragover event carrying mouse coordinates.
 */
function moveBoardDragGhost(event) {
  if (!boardDragGhost) return;
  boardDragGhost.style.left = `${event.clientX - boardDragGhostOffsetX}px`;
  boardDragGhost.style.top = `${event.clientY - boardDragGhostOffsetY}px`;
}


/**
 * Removes the drag ghost and its document-level listener.
 */
function removeBoardDragGhost() {
  document.removeEventListener("dragover", moveBoardDragGhost);
  if (boardDragGhost) boardDragGhost.remove();
  boardDragGhost = null;
}


/**
 * Resets the drag state and removes all drag and drop feedback.
 */
function handleBoardDragEnd() {
  removeBoardDragGhost();
  clearActiveBoardDragCard();
  draggedBoardTaskId = "";
  clearAllBoardDropFeedback();
}


/**
 * Removes the dragging style from all board cards.
 */
function clearActiveBoardDragCard() {
  document.querySelectorAll(".board-card--dragging").forEach((card) => {
    card.classList.remove("board-card--dragging");
  });
}