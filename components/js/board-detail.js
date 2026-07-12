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
 * Loads contacts once and renders them as edit-mode checkboxes.
 */
async function renderBoardEditAssignees(assignedTo) {
  const container = getBoardEditAssignees();
  boardDetailContacts = await loadBoardDetailContacts();

  container.innerHTML = boardDetailContacts.length
    ? boardDetailContacts.map((contact) => getBoardEditAssigneeTemplate(contact, assignedTo)).join("")
    : '<span class="board-detail-empty">No contacts available.</span>';
}

async function loadBoardDetailContacts() {
  try {
    return sortContactsByName(await loadContactsFromStore());
  } catch (error) {
    return [];
  }
}

function getBoardEditAssigneeTemplate(contact, assignedTo) {
  const checked = getBoardAssignees(assignedTo).includes(contact.name) ? "checked" : "";
  return `
    <label class="board-detail-assignee">
      <input type="checkbox" value="${escapeBoardText(contact.name)}" ${checked} />
      <span>${escapeBoardText(contact.name)}</span>
    </label>
  `;
}

function getBoardEditedAssigneesFromContacts() {
  return [...getBoardEditAssignees().querySelectorAll("input:checked")].map((input) => input.value);
}

function getBoardDetailSubtasks() {
  return document.getElementById("boardTaskDetailSubtasks");
}

function getBoardEditAssignees() {
  return document.getElementById("boardTaskEditAssignees");
}

function getBoardMobileStatusSelect() {
  return document.getElementById("boardTaskMobileStatus");
}
