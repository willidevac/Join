/**
 * Creates one contact option for the assignee dropdown.
 *
 * @param {Object} contact - Contact object from the contacts store.
 * @returns {string} HTML markup for one selectable contact.
 */
function getAssigneeOptionTemplate(contact) {
  return `
    <label class="contact-dropdown__option">
      <input type="checkbox" value="${escapeHtmlText(contact.id)}" />
      <span class="contact-dropdown__avatar" style="background-color: ${escapeHtmlText(contact.color || "var(--color-primary-auth)")}">
        ${getContactInitials(contact.name)}
      </span>
      <span>${escapeHtmlText(contact.name)}</span>
    </label>
  `;
}


/**
 * Returns a visible chip for one selected contact.
 *
 * @param {Object} contact - Selected contact object.
 * @returns {string} HTML markup for the selected-contact chip.
 */
function getAssigneeChipTemplate(contact) {
  return `<span class="contact-dropdown__chip">${escapeHtmlText(contact.name)}</span>`;
}


/**
 * Returns the markup for one subtask row in view or edit mode.
 */
function getSubtaskItemTemplate(subtask, index) {
  if (index === editingSubtaskIndex) return getSubtaskEditTemplate(subtask, index);
  return `
    <li class="add-task-subtask" data-subtask-index="${index}">
      <span class="add-task-subtask__title">${escapeHtmlText(subtask.title)}</span>
      <span class="add-task-subtask__actions">
        <button type="button" class="add-task-subtask__action" data-subtask-action="edit" aria-label="Edit subtask">
          <img src="./components/assets/img/icons/edit.svg" alt="" />
        </button>
        <span class="add-task-subtask__divider" aria-hidden="true"></span>
        <button type="button" class="add-task-subtask__action" data-subtask-action="delete" aria-label="Delete subtask">
          <img src="./components/assets/img/icons/delete.svg" alt="" />
        </button>
      </span>
    </li>`;
}


/**
 * Returns the inline edit markup for the subtask that is being changed.
 */
function getSubtaskEditTemplate(subtask, index) {
  return `
    <li class="add-task-subtask add-task-subtask--editing" data-subtask-index="${index}">
      <input class="add-task-subtask__edit" type="text" value="${escapeHtmlText(subtask.title)}" data-subtask-edit aria-label="Edit subtask" />
      <span class="add-task-subtask__actions">
        <button type="button" class="add-task-subtask__action" data-subtask-action="delete" aria-label="Delete subtask">
          <img src="./components/assets/img/icons/delete.svg" alt="" />
        </button>
        <span class="add-task-subtask__divider" aria-hidden="true"></span>
        <button type="button" class="add-task-subtask__action" data-subtask-action="save" aria-label="Save subtask">
          <img src="./components/assets/img/icons/check_edit_subtask.svg" alt="" />
        </button>
      </span>
    </li>`;
}