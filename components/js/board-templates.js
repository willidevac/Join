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
        data-task-id="${escapeBoardText(task.id)}"
        draggable="true"
        tabindex="0"
       >
      <span class="board-card__category board-card__category--${getBoardCategoryClass(task.category)}">
        ${formatBoardCategory(task.category)}
      </span>
      <h3>${escapeBoardText(task.title)}</h3>
      <p>${getBoardShortText(task.description || "No description")}</p>
      ${getBoardSubtaskTemplate(task.subtasks)}
      <div class="board-card__footer">
        ${getBoardAssigneeTemplate(task.assignedTo)}
        <img class="board-card__priority-icon"
          src="${getBoardPriorityIcon(task.priority)}" 
          alt="${escapeBoardText(task.priority)} priority" 
        />
      </div>
    </article>
  `;
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
  const cleanedText = escapeBoardText(text);
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
  return `
    <div class="board-card__subtasks">
      <span class="board-card__progress"><span style="width: ${progressWidth}%"></span></span>
      <span>${doneCount}/${subtaskList.length} Subtasks</span>
    </div>
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
 * Reads the title from a subtask in object or legacy string form.
 *
 * @param {Object|string} subtask - Stored subtask entry.
 * @returns {string} The subtask title, or an empty string.
 */
function getBoardSubtaskTitle(subtask) {
  if (typeof subtask === "string") return subtask;
  return subtask && subtask.title ? subtask.title : "";
}


/**
 * Builds a subtask object and keeps the done state from a previous version.
 *
 * @param {string} title - Edited subtask title.
 * @param {Array} previousSubtasks - Subtasks before the edit.
 * @returns {Object} Subtask with title and preserved done flag.
 */
function toBoardSubtask(title, previousSubtasks) {
  const match = previousSubtasks.find(
    (subtask) => getBoardSubtaskTitle(subtask) === title,
  );
  return { title, done: Boolean(match && match.done) };
}


/**
 * Returns the avatar group for a card, or a placeholder without assignees.
 *
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 * @returns {string} HTML markup for the assignee avatars.
 */
function getBoardAssigneeTemplate(assignedTo) {
  const assignees = getBoardAssignees(assignedTo);
  if (!assignees.length) return "<span></span>";
  const avatars = assignees.map(getBoardAvatarTemplate).join("");
  return `<div class="board-card__assignees">${avatars}</div>`;
}


/**
 * Returns display names from current references and legacy assignments.
 *
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 * @returns {string[]} All cleaned assignee names.
 */
function getBoardAssigneeNames(assignedTo) {
  return getTaskAssigneeReferences(assignedTo).map((assignee) => assignee.name);
}


/**
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 * @returns {string[]} Up to three names for the card avatars.
 */
function getBoardAssignees(assignedTo) {
  return getBoardAssigneeNames(assignedTo).slice(0, 3);
}


/**
 * @param {string} name - Assignee name.
 * @param {number} index - Position in the avatar group, used for the color.
 * @returns {string} HTML markup for one initials avatar.
 */
function getBoardAvatarTemplate(name, index) {
  return `<span class="board-card__avatar board-card__avatar--${index + 1}">${getBoardInitials(name)}</span>`;
}


/**
 * @param {string} name - Full contact name.
 * @returns {string} Up to two uppercase initials.
 */
function getBoardInitials(name) {
  return String(name)
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}


/**
 * @param {string} priority - Stored task priority.
 * @returns {string} Icon path, falling back to the medium icon.
 */
function getBoardPriorityIcon(priority) {
  const priorityIcons = {
    urgent: "./components/assets/icons/red_arrow_up.svg",
    medium: "./components/assets/icons/medium_even_orange.svg",
    low: "./components/assets/icons/green_arrow_down.svg",
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
      <span>${escapeBoardText(subtask.title)}</span>
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
  const checked = getTaskAssigneeReferences(assignedTo).some((assignee) =>
    isTaskAssigneeContact(assignee, contact),
  )
    ? "checked"
    : "";
  return `
    <label class="contact-dropdown__option">
      <input type="checkbox" value="${escapeBoardText(contact.id)}" ${checked} />
      <span class="contact-dropdown__avatar" style="background-color: ${escapeBoardText(contact.color || "var(--color-primary-auth)")}">
        ${getContactInitials(contact.name)}
      </span>
      <span>${escapeBoardText(contact.name)}</span>
    </label>
  `;
}
