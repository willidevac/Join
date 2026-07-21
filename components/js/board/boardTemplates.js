/**
 * Returns the complete card markup for one task on the board.
 *
 * @param {Object} task - Task object from the board store.
 * @returns {string} HTML markup for one draggable board card.
 */
function getBoardTaskTemplate(task) {
  return `
      <article
        class="board-card"
        data-task-id="${escapeHtmlText(task.id)}"
        tabindex="0"
       >
      ${getBoardCardMoveTemplate(task)}
      <span class="board-status-pill board-card__category board-card__category--${getBoardCategoryClass(task.category)}">
        ${formatBoardCategory(task.category)}
      </span>

      <h3>${escapeHtmlText(task.title)}</h3>
      <p>${getBoardShortText(task.description || "No description")}</p>
      ${getBoardSubtaskTemplate(task.subtasks)}
      <div class="board-card__footer">
        ${getBoardAssigneeTemplate(task.assignedTo)}
        <img class="board-card__priority-icon"
          src="${getBoardPriorityIcon(task.priority)}"
          alt="${escapeHtmlText(task.priority)} priority"
        />
      </div>
    </article>
  `;
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
 * @param {string} category - Stored category value of the task.
 * @returns {string} Modifier suffix for the category badge class.
 */
function getBoardCategoryClass(category) {
  return category === "technical-task" ? "technical" : "user-story";
}


/**
 * Escapes a text and truncates it to fit the card preview.
 *
 * @param {string} text - Raw description text.
 * @returns {string} Escaped text, shortened with an ellipsis above 72 characters.
 */
function getBoardShortText(text) {
  const cleanedText = escapeHtmlText(text);
  return cleanedText.length > 72
    ? `${cleanedText.slice(0, 69)}...`
    : cleanedText;
}


/**
 * Returns the subtask progress bar, or an empty string without subtasks.
 *
 * @param {Object[]} [subtasks] - Subtasks stored on the task.
 * @returns {string} HTML markup for the progress section.
 */
function getBoardSubtaskTemplate(subtasks) {
  const subtaskList = Array.isArray(subtasks) ? subtasks : [];
  if (!subtaskList.length) return "";
  const doneCount = getBoardDoneSubtaskCount(subtaskList);
  const progressWidth = getBoardSubtaskProgress(subtaskList);
  const progressDetail = `${doneCount} of ${subtaskList.length} subtasks completed`;
  return `
    <button class="board-card__subtasks" type="button"
      aria-label="${progressDetail}"
      data-progress-detail="${progressDetail}">
      <span class="board-card__progress"><span style="width: ${progressWidth}%"></span></span>
      <span>${doneCount}/${subtaskList.length} Subtasks</span>
    </button>
  `;
}


/**
 * @param {Object[]} subtasks - Non-empty list of subtasks.
 * @returns {number} Completed share as a percentage from 0 to 100.
 */
function getBoardSubtaskProgress(subtasks) {
  const doneSubtasks = getBoardDoneSubtaskCount(subtasks);
  return (doneSubtasks / subtasks.length) * 100;
}


/**
 * @param {Object[]} subtasks - Subtasks of one task.
 * @returns {number} Count of subtasks marked as done.
 */
function getBoardDoneSubtaskCount(subtasks) {
  return subtasks.filter((subtask) => subtask.done).length;
}


/**
 * Returns the avatar group for a card, or a placeholder without assignees.
 *
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 * @returns {string} HTML markup for the assignee avatars.
 */
const maxVisibleBoardCardAssignees = 4;


function getBoardAssigneeTemplate(assignedTo) {
  const assignees = getBoardAssignees(assignedTo);
  if (!assignees.length) return "<span></span>";
  const { visible, overflowCount } = getVisibleAssigneeChips(
    assignees, maxVisibleBoardCardAssignees,
  );
  const avatars = visible.map(getBoardAvatarTemplate).join("") + getBoardAvatarOverflowTemplate(overflowCount);
  return `<div class="board-card__assignees">${avatars}</div>`;
}


/**
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 * @returns {{name: string, color: string}[]} All resolved assignees of the task.
 */
function getBoardAssignees(assignedTo) {
  return getTaskAssigneeReferences(assignedTo)
    .map((reference) => resolveAssigneeDisplay(reference, activeBoardContacts));
}


/**
 * @param {{name: string, color: string}} assignee - Resolved display data.
 * @returns {string} HTML markup for one initials avatar.
 */
function getBoardAvatarTemplate(assignee) {
  return `<span class="board-card__avatar" style="background-color: ${escapeHtmlText(assignee.color)}">${getInitials(assignee.name)}</span>`;
}


/**
 * Returns a muted "+N" avatar for card assignees hidden beyond the visible limit.
 *
 * @param {number} overflowCount - Number of assignees not shown directly.
 * @returns {string} HTML markup for the overflow avatar, or an empty string.
 */
function getBoardAvatarOverflowTemplate(overflowCount) {
  if (!overflowCount) return "";
  return `<span class="board-card__avatar board-card__avatar--overflow">+${overflowCount}</span>`;
}


/**
 * @param {{name: string, color: string}} assignee - Resolved display data.
 * @returns {string} HTML markup for one assignee row with avatar.
 */
function getBoardDetailAssigneeTemplate(assignee) {
  return `
    <div class="board-detail-assignee">
      <span class="board-detail-assignee__avatar" style="background-color: ${escapeHtmlText(assignee.color)}">${getInitials(assignee.name)}</span>
      <span>${escapeHtmlText(assignee.name)}</span>
    </div>`;
}


/**
 * @param {string} name - Full contact name.
 * @returns {string} Up to two uppercase initials.
 */
/**
 * @param {string} priority - Stored task priority.
 * @returns {string} Icon path, falling back to the medium icon.
 */
function getBoardPriorityIcon(priority) {
  const priorityIcons = {
    urgent: "./components/assets/img/icons/red_arrow_up.svg",
    medium: "./components/assets/img/icons/medium_even_orange.svg",
    low: "./components/assets/img/icons/green_arrow_down.svg",
  };
  return priorityIcons[String(priority).toLowerCase()] || priorityIcons.medium;
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
 * Returns one checkable subtask row for the detail view.
 *
 * @param {Object} subtask - Normalized subtask with title and done flag.
 * @param {number} index - Position of the subtask in the list.
 * @returns {string} HTML markup for one subtask row.
 */
function getBoardDetailSubtaskTemplate(subtask, index) {
  return `
    <label class="board-detail-subtask">
      <input type="checkbox" data-detail-subtask-index="${index}" ${subtask.done ? "checked" : ""} />
      <span>${escapeHtmlText(subtask.title)}</span>
    </label>
  `;
}


/**
 * Returns one selectable contact option for the edit assignee dropdown.
 *
 * @param {Object} contact - Contact object from the contacts store.
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 * @returns {string} HTML markup for one dropdown option.
 */
function getBoardEditAssigneeTemplate(contact, assignedTo) {
  const isChecked = getTaskAssigneeReferences(assignedTo).some((assignee) =>
    isTaskAssigneeContact(assignee, contact),
  );
  return getAssigneeOptionTemplate(contact, isChecked);
}


/**
 * @param {Object} task - Task rendered on the card.
 * @returns {string} HTML markup for the mobile move button and its menu.
 */
function getBoardCardMoveTemplate(task) {
  const options = getBoardMoveTargets(task.status)
    .map((target) => `
      <button type="button" class="board-card-move__option" data-move-status="${target.value}">
        <img src="./components/assets/img/icons/${target.icon}.svg" alt="" aria-hidden="true" />
        ${target.label}
      </button>`)
    .join("");
  return `
    <div class="board-card-move">
      <button type="button" class="board-card-move__toggle" aria-haspopup="true" aria-expanded="false" aria-label="Move task to another column">
        <img src="./components/assets/img/icons/change_task_mobile.svg" alt="" aria-hidden="true" />
      </button>
      <div class="board-card-move__menu" hidden>
        <span class="board-card-move__title">Move to</span>
        ${options}
      </div>
    </div>`;
}


/**
 * @param {string} currentStatus - Status of the task's current column.
 * @returns {{value: string, label: string, icon: string}[]} Adjacent board columns as targets.
 */
function getBoardMoveTargets(currentStatus) {
  const order = ["todo", "in-progress", "feedback", "done"];
  const labels = { todo: "To-do", "in-progress": "In progress", feedback: "Review", done: "Done" };
  const index = order.indexOf(currentStatus);
  if (index < 0) return [];
  return [order[index - 1], order[index + 1]]
    .filter(Boolean)
    .map((status) => ({
      value: status,
      label: labels[status],
      icon: order.indexOf(status) < index ? "arrow_upward" : "arrow_downward",
    }));
}
