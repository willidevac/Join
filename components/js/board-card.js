function getBoardTaskTemplate(task) {
  return `
    <article class="board-card" data-task-id="${escapeBoardText(task.id)}" draggable="true" tabindex="0">
      <span class="board-card__category board-card__category--${getBoardCategoryClass(task.category)}">
        ${formatBoardCategory(task.category)}
      </span>
      <h3>${escapeBoardText(task.title)}</h3>
      <p>${getBoardShortText(task.description || "No description")}</p>
      ${getBoardSubtaskTemplate(task.subtasks)}
      <div class="board-card__footer">
        ${getBoardAssigneeTemplate(task.assignedTo)}
        <img class="board-card__priority-icon" src="${getBoardPriorityIcon(task.priority)}" alt="${escapeBoardText(task.priority)} priority" />
      </div>
    </article>
  `;
}

function getBoardCategoryClass(category) {
  return category === "technical-task" ? "technical" : "user-story";
}

function getBoardShortText(text) {
  const cleanedText = escapeBoardText(text);
  return cleanedText.length > 72
    ? `${cleanedText.slice(0, 69)}...`
    : cleanedText;
}

function getBoardSubtaskTemplate(subtasks) {
  const subtaskList = Array.isArray(subtasks) ? subtasks : [];
  if (!subtaskList.length) return "";
  const doneCount = getBoardDoneSubtaskCount(subtaskList);

  return `
    <div class="board-card__subtasks">
      <span class="board-card__progress"><span style="width: ${getBoardSubtaskProgress(subtaskList)}%"></span></span>
      <span>${doneCount}/${subtaskList.length} Subtasks</span>
    </div>
  `;
}

function getBoardSubtaskProgress(subtasks) {
  const doneSubtasks = getBoardDoneSubtaskCount(subtasks);
  return (doneSubtasks / subtasks.length) * 100;
}

function getBoardDoneSubtaskCount(subtasks) {
  return subtasks.filter((subtask) => subtask.done).length;
}

function getBoardAssigneeTemplate(assignedTo) {
  const assignees = getBoardAssignees(assignedTo);
  if (!assignees.length) return "<span></span>";

  return `<div class="board-card__assignees">${assignees.map(getBoardAvatarTemplate).join("")}</div>`;
}

function getBoardAssignees(assignedTo) {
  if (Array.isArray(assignedTo)) return assignedTo.filter(Boolean).slice(0, 3);
  if (!assignedTo) return [];
  return String(assignedTo)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getBoardAvatarTemplate(name, index) {
  return `<span class="board-card__avatar board-card__avatar--${index + 1}">${getBoardInitials(name)}</span>`;
}

function getBoardInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getBoardPriorityIcon(priority) {
  const priorityIcons = {
    urgent: "./components/assets/icons/red_arrow_up.svg",
    medium: "./components/assets/icons/medium_even.svg",
    low: "./components/assets/icons/green_arrow_down.svg",
  };

  return priorityIcons[String(priority).toLowerCase()] || priorityIcons.medium;
}
