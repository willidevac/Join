let boardDetailContacts = [];

/**
 * Shows detail subtasks as checkable items.
 */
function renderBoardDetailSubtasks(task) {
  const container = getBoardDetailSubtasks();
  const subtasks = getNormalizedBoardSubtasks(task.subtasks);

  container.innerHTML = subtasks.length
    ? subtasks.map(getBoardDetailSubtaskTemplate).join("")
    : '<span class="board-detail-empty">No subtasks</span>';
}

function getBoardDetailSubtaskTemplate(subtask, index) {
  return `
    <label class="board-detail-subtask">
      <input type="checkbox" data-detail-subtask-index="${index}" ${subtask.done ? "checked" : ""} />
      <span>${escapeBoardText(subtask.title)}</span>
    </label>
  `;
}

/**
 * Persists one checked state change and refreshes the open detail view.
 */
async function handleBoardDetailSubtaskChange(event) {
  if (!event.target.matches("[data-detail-subtask-index]")) return;

  const task = getActiveBoardTask();
  if (!task) return;

  const updatedTask = getTaskWithToggledSubtask(task, event.target);
  await updateTaskInStore(updatedTask);
  await refreshBoardAfterEdit(updatedTask.id);
}

/**
 * Moves the open task from the mobile detail dialog without drag and drop.
 */
async function handleBoardMobileStatusChange(event) {
  const task = getActiveBoardTask();
  const status = event.target.value;
  if (!task || task.status === status) return;

  await updateTaskInStore({ ...task, status });
  await refreshBoardAfterEdit(task.id);
}

function syncBoardMobileStatus(status) {
  getBoardMobileStatusSelect().value = status || "todo";
}

function getTaskWithToggledSubtask(task, checkbox) {
  const index = Number(checkbox.dataset.detailSubtaskIndex);
  const subtasks = getNormalizedBoardSubtasks(task.subtasks);
  subtasks[index] = { ...subtasks[index], done: checkbox.checked };
  return { ...task, subtasks };
}

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

async function loadBoardDetailContacts() {
  try {
    return sortContactsByName(await loadContactsFromStore());
  } catch (error) {
    return [];
  }
}

/**
 * Returns one selectable contact option for the edit assignee dropdown.
 *
 * @param {Object} contact - Contact object from the contacts store.
 * @param {string[]|string} assignedTo - Names currently assigned to the task.
 * @returns {string} HTML markup for one dropdown option.
 */
function getBoardEditAssigneeTemplate(contact, assignedTo) {
  const checked = getBoardAssigneeNames(assignedTo).includes(contact.name)
    ? "checked"
    : "";
  return `
    <label class="contact-dropdown__option">
      <input type="checkbox" value="${escapeBoardText(contact.name)}" ${checked} />
      <span class="contact-dropdown__avatar" style="background-color: ${escapeBoardText(contact.color || "var(--color-primary-auth)")}">
        ${getContactInitials(contact.name)}
      </span>
      <span>${escapeBoardText(contact.name)}</span>
    </label>
  `;
}

function getBoardEditedAssigneesFromContacts() {
  return [
    ...getBoardEditAssigneesPanel().querySelectorAll("input:checked"),
  ].map((input) => input.value);
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
  const names = getBoardEditedAssigneesFromContacts();
  updateBoardEditAssigneesButtonText(names.length);
  renderBoardEditAssigneeChips(names);
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
 * @param {string[]} names - Selected contact names.
 */
function renderBoardEditAssigneeChips(names) {
  const chips = names
    .map((name) => `<span class="contact-dropdown__chip">${escapeBoardText(name)}</span>`)
    .join("");
  getBoardEditAssigneesSelected().innerHTML = chips;
}


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


function getBoardMobileStatusSelect() {
  return document.getElementById("boardTaskMobileStatus");
}
