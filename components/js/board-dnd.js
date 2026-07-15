let draggedBoardTaskId = "";


/**
 * Registers dragover, dragleave and drop handling on every board column.
 * @param {NodeList} taskLists - The task list elements of all columns.
 */
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
    console.error("Task status could not be updated.", error);
  } finally {
    draggedBoardTaskId = "";
    clearAllBoardDropFeedback();
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
 * Marks the card as dragged and stores its task id.
 * @param {DragEvent} event - The dragstart event.
 * @param {HTMLElement} card - The card being dragged.
 */
function handleBoardDragStart(event, card) {
  draggedBoardTaskId = card.dataset.taskId;
  card.classList.add("board-card--dragging");
  event.dataTransfer.setData("text/plain", draggedBoardTaskId);
}


/**
 * Resets the drag state and removes all drag and drop feedback.
 */
function handleBoardDragEnd() {
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