let boardDetailContacts = [];


/**
 * Shows detail subtasks as checkable items.
 *
 * @param {Object} task - The task whose subtasks are displayed.
 */
function renderBoardDetailSubtasks(task) {
  const container = getBoardDetailSubtasks();
  const subtasks = getNormalizedBoardSubtasks(task.subtasks);
  container.innerHTML = subtasks.length
    ? subtasks.map(getBoardDetailSubtaskTemplate).join("")
    : '<span class="board-detail-empty">No subtasks</span>';
}


/**
 * Persists one checked state change and refreshes the open detail view.
 *
 * @param {Event} event - Change event from the subtask checkbox list.
 */
async function handleBoardDetailSubtaskChange(event) {
  if (!event.target.matches("[data-detail-subtask-index]")) return;
  const task = getActiveBoardTask();
  if (!task) return;
  const updatedTask = getTaskWithToggledSubtask(task, event.target);
  try {
    await updateTaskInStore(updatedTask);
    await refreshBoardAfterEdit(updatedTask.id);
  } catch (error) {
    event.target.checked = !event.target.checked;
    showBoardToast("Subtask could not be updated.");
  }
}


/**
 * Moves the open task from the mobile detail dialog without drag and drop.
 *
 * @param {Event} event - Change event of the mobile status dropdown input.
 */
async function handleBoardMobileStatusChange(event) {
  const task = getActiveBoardTask();
  const status = event.target.value;
  if (!task || task.status === status) return;
  try {
    await updateTaskInStore({ ...task, status });
    await refreshBoardAfterEdit(task.id);
  } catch (error) {
    event.target.value = task.status;
    showBoardToast("Task status could not be updated.");
  }
}


/**
 * Mirrors the open task status into the mobile move-task dropdown.
 *
 * @param {string} status - Current status of the open task.
 */
function syncBoardMobileStatus(status) {
  getBoardMobileStatusSelect().value = status || "todo";
  syncBoardEditDropdowns();
}


/**
 * Returns a task copy with one subtask done state flipped to the checkbox.
 *
 * @param {Object} task - The currently open task.
 * @param {HTMLInputElement} checkbox - The toggled subtask checkbox.
 * @returns {Object} Updated task ready to be stored.
 */
function getTaskWithToggledSubtask(task, checkbox) {
  const index = Number(checkbox.dataset.detailSubtaskIndex);
  const subtasks = getNormalizedBoardSubtasks(task.subtasks);
  subtasks[index] = { ...subtasks[index], done: checkbox.checked };
  return { ...task, subtasks };
}


/**
 * Normalizes stored subtasks from legacy strings or objects to one shape.
 *
 * @param {Array} subtasks - Raw subtasks from the task store.
 * @returns {Object[]} Subtasks with title and done flag, empty titles dropped.
 */
function getNormalizedBoardSubtasks(subtasks) {
  if (!Array.isArray(subtasks)) return [];
  return subtasks
    .map((subtask) =>
      typeof subtask === "string"
        ? { title: subtask, done: false }
        : { title: subtask.title || "", done: Boolean(subtask.done) },
    )
    .filter((subtask) => subtask.title);
}


/**
 * Loads contacts and renders them as options into the assignee dropdown panel.
 *
 * @param {Array|string} assignedTo - Current or legacy task assignments.
 */
async function renderBoardEditAssignees(assignedTo) {
  const container = getBoardEditAssigneesPanel();
  boardDetailContacts = await loadBoardDetailContacts();
  container.innerHTML = boardDetailContacts.length
    ? boardDetailContacts
        .map((contact) => getBoardEditAssigneeTemplate(contact, assignedTo))
        .join("")
    : '<span class="board-detail-empty">No contacts available.</span>';
  bindBoardEditAssigneesDropdown();
  setBoardEditAssigneesOpen(false);
  updateBoardEditAssigneesSelection();
}


/**
 * @returns {Promise<Object[]>} Sorted contacts, or an empty list on errors.
 */
async function loadBoardDetailContacts() {
  try {
    return sortContactsByName(await loadContactsFromStore());
  } catch (error) {
    return [];
  }
}


/**
 * @returns {Object[]} Stable references for all checked contacts.
 */
function getBoardEditedAssigneesFromContacts() {
  return [
    ...getBoardEditAssigneesPanel().querySelectorAll("input:checked"),
  ]
    .map((input) => getBoardDetailContactById(input.value))
    .filter(Boolean)
    .map(createTaskAssigneeReference);
}


/**
 * Finds one contact loaded for the board edit dropdown.
 * @param {string} contactId - Contact id stored by the checkbox.
 * @returns {Object|undefined} Matching contact if it still exists.
 */
function getBoardDetailContactById(contactId) {
  return boardDetailContacts.find((contact) => contact.id === contactId);
}


/**
 * Wires the edit assignee dropdown button and the outside click handling once.
 */
function bindBoardEditAssigneesDropdown() {
  const button = getBoardEditAssigneesButton();
  if (button.dataset.dropdownReady === "true") return;
  button.addEventListener("click", toggleBoardEditAssigneesDropdown);
  document.addEventListener("click", closeBoardEditAssigneesOnOutsideClick);
  getBoardEditAssigneesPanel().addEventListener("change", updateBoardEditAssigneesSelection);
  button.dataset.dropdownReady = "true";
}


/**
 * Opens or closes the edit assignee dropdown from the trigger button.
 */
function toggleBoardEditAssigneesDropdown() {
  setBoardEditAssigneesOpen(getBoardEditAssigneesPanel().hidden);
}


/**
 * Closes the dropdown when the user clicks outside of the component.
 *
 * @param {MouseEvent} event - Document click event.
 */
function closeBoardEditAssigneesOnOutsideClick(event) {
  const dropdown = getBoardEditAssigneesDropdown();
  if (dropdown && !dropdown.contains(event.target))
    setBoardEditAssigneesOpen(false);
}


/**
 * Applies the visual and accessibility state for the edit assignee dropdown.
 *
 * @param {boolean} isOpen - True to open, false to close the dropdown.
 */
function setBoardEditAssigneesOpen(isOpen) {
  getBoardEditAssigneesDropdown().classList.toggle("is-open", isOpen);
  getBoardEditAssigneesPanel().hidden = !isOpen;
  getBoardEditAssigneesButton().setAttribute("aria-expanded", String(isOpen));
}


/**
 * Updates the dropdown button text and chips for the checked contacts.
 */
function updateBoardEditAssigneesSelection() {
  const assignees = getBoardEditedAssigneesFromContacts();
  updateBoardEditAssigneesButtonText(assignees.length);
  renderBoardEditAssigneeChips(assignees);
}


/**
 * @param {number} count - Number of currently selected contacts.
 */
function updateBoardEditAssigneesButtonText(count) {
  getBoardEditAssigneesButton().textContent = count
    ? `${count} contact${count === 1 ? "" : "s"} selected`
    : "Select contacts to assign";
}


/**
 * @param {Object[]} assignees - Selected contact references.
 */
function renderBoardEditAssigneeChips(assignees) {
  const chips = assignees
    .map((item) => `<span class="contact-dropdown__chip">${escapeBoardText(item.name)}</span>`)
    .join("");
  getBoardEditAssigneesSelected().innerHTML = chips;
}


/**
 * @returns {HTMLElement} The subtask container of the detail view.
 */
function getBoardDetailSubtasks() {
  return document.getElementById("boardTaskDetailSubtasks");
}


/**
 * @returns {HTMLElement} The dropdown panel that lists the edit assignees.
 */
function getBoardEditAssigneesPanel() {
  return document.getElementById("boardEditAssigneesPanel");
}


/**
 * @returns {HTMLElement} The edit assignee dropdown container.
 */
function getBoardEditAssigneesDropdown() {
  return document.getElementById("boardEditAssigneesDropdown");
}


/**
 * @returns {HTMLElement} The button that toggles the edit assignee dropdown.
 */
function getBoardEditAssigneesButton() {
  return document.getElementById("boardEditAssigneesButton");
}


/**
 * @returns {HTMLElement} The container for the selected edit assignee chips.
 */
function getBoardEditAssigneesSelected() {
  return document.getElementById("boardEditAssigneesSelected");
}


/**
 * @returns {HTMLElement} The hidden input that stores the mobile move-task status.
 */
function getBoardMobileStatusSelect() {
  return document.getElementById("boardTaskMobileStatus");
}
