let addTaskSubtasks = [];
let editingSubtaskIndex = -1;


/**
 * Wires the subtask input and list of the Add Task form.
 */
function initAddTaskSubtasks() {
  addTaskSubtasks = [];
  editingSubtaskIndex = -1;
  const input = getSubtaskInput();
  if (!input) return;
  bindSubtaskInput(input);
  bindSubtaskButtons();
  bindSubtaskList();
  updateSubtaskInputMode();
  renderSubtaskList();
}


function bindSubtaskInput(input) {
  input.addEventListener("input", updateSubtaskInputMode);
  input.addEventListener("keydown", handleSubtaskInputKeydown);
}


function bindSubtaskButtons() {
  getSubtaskAddButton().addEventListener("click", commitSubtaskFromInput);
  getSubtaskConfirmButton().addEventListener("click", commitSubtaskFromInput);
  getSubtaskClearButton().addEventListener("click", clearSubtaskInput);
}


function bindSubtaskList() {
  const list = getSubtaskList();
  list.addEventListener("click", handleSubtaskListClick);
  list.addEventListener("keydown", handleSubtaskListKeydown);
}


/**
 * Adds a subtask on Enter without ever submitting the main task form.
 */
function handleSubtaskInputKeydown(event) {
  if (event.key !== "Enter") return;

  event.preventDefault();
  commitSubtaskFromInput();
}


/**
 * Reads the input, stores a non-empty subtask and clears the field.
 */
function commitSubtaskFromInput() {
  const input = getSubtaskInput();
  const title = input.value.trim();
  if (!title) return;
  addTaskSubtasks.push({ title, done: false });
  input.value = "";
  updateSubtaskInputMode();
  renderSubtaskList();
  input.focus();
}


/**
 * Empties the input field only, without touching the stored subtasks.
 */
function clearSubtaskInput() {
  const input = getSubtaskInput();
  input.value = "";
  updateSubtaskInputMode();
  input.focus();
}


/**
 * Switches between the plus icon and the clear/confirm icons.
 */
function updateSubtaskInputMode() {
  const hasText = Boolean(getSubtaskInput().value.trim());
  getSubtaskInputWrapper().classList.toggle("is-editing", hasText);
}


function renderSubtaskList() {
  getSubtaskList().innerHTML = addTaskSubtasks.map(getSubtaskItemTemplate).join("");
}


/**
 * Routes clicks on the edit, delete and save icons of a subtask row.
 */
function handleSubtaskListClick(event) {
  const button = event.target.closest("[data-subtask-action]");
  if (!button) return;
  const index = getSubtaskItemIndex(button);
  const action = button.dataset.subtaskAction;
  if (action === "edit") startSubtaskEdit(index);
  if (action === "delete") deleteSubtask(index);
  if (action === "save") saveEditedSubtask(index, getSubtaskEditValue(button));
}


/**
 * Saves an inline edit on Enter without submitting the main task form.
 */
function handleSubtaskListKeydown(event) {
  if (event.key !== "Enter" || !event.target.matches("[data-subtask-edit]")) return;
  event.preventDefault();
  const index = getSubtaskItemIndex(event.target);
  saveEditedSubtask(index, event.target.value);
}


function startSubtaskEdit(index) {
  editingSubtaskIndex = index;
  renderSubtaskList();
  focusSubtaskEditInput();
}


function focusSubtaskEditInput() {
  const input = getSubtaskList().querySelector("[data-subtask-edit]");
  if (!input) return;

  input.focus();
  input.setSelectionRange(input.value.length, input.value.length);
}


function deleteSubtask(index) {
  addTaskSubtasks.splice(index, 1);
  editingSubtaskIndex = -1;
  renderSubtaskList();
}


/**
 * Stores the edited title, dropping the subtask when it was left empty.
 */
function saveEditedSubtask(index, value) {
  const title = value.trim();
  if (!title) addTaskSubtasks.splice(index, 1);
  else addTaskSubtasks[index] = { ...addTaskSubtasks[index], title };
  editingSubtaskIndex = -1;
  renderSubtaskList();
}


function getSubtaskItemIndex(element) {
  return Number(element.closest("[data-subtask-index]").dataset.subtaskIndex);
}


function getSubtaskEditValue(button) {
  return button.closest("[data-subtask-index]").querySelector("[data-subtask-edit]").value;
}


/**
 * Returns a copy of the collected subtasks for the new task object.
 */
function getAddTaskSubtasks() {
  return addTaskSubtasks.map((subtask) => ({ ...subtask }));
}


/**
 * Clears the subtask state after the form was reset or a task was created.
 */
function resetAddTaskSubtasks() {
  addTaskSubtasks = [];
  editingSubtaskIndex = -1;
  renderSubtaskList();
  updateSubtaskInputMode();
}


function getSubtaskInput() {
  return document.getElementById("taskSubtasks");
}


function getSubtaskInputWrapper() {
  return document.getElementById("taskSubtasksInputWrapper");
}


function getSubtaskAddButton() {
  return document.getElementById("taskSubtaskAdd");
}


function getSubtaskConfirmButton() {
  return document.getElementById("taskSubtaskConfirm");
}


function getSubtaskClearButton() {
  return document.getElementById("taskSubtaskClear");
}


function getSubtaskList() {
  return document.getElementById("taskSubtaskList");
}
