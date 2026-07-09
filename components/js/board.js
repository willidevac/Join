/**
 * Renders locally saved tasks into the board columns.
 */
function initBoardTasks() {
  const taskLists = document.querySelectorAll("[data-board-status]");
  if (!taskLists.length) return;

  const tasks = getStoredTasks();
  taskLists.forEach((taskList) => renderBoardColumn(taskList, tasks));
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
    <article class="board-card">
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
