const boardEditFieldNames = {
  boardTaskEditTitle: "Title",
  boardTaskEditDueDate: "DueDate",
};


/**
 * Switches the detail dialog to edit mode with the active task's data.
 */
async function showBoardEditMode() {
  const task = getActiveBoardTask();
  if (!task) return;
  await fillBoardTaskEditForm(task);
  getBoardDetailView().hidden = true;
  getBoardEditForm().hidden = false;
}


/**
 * Fills the edit form fields with the values of the given task.
 * @param {Object} task - The task being edited.
 */
async function fillBoardTaskEditForm(task) {
  resetBoardEditValidation();
  getBoardEditField("Title").value = task.title || "";
  getBoardEditField("Description").value = task.description || "";
  getBoardEditField("DueDate").value = normalizeTaskDueDate(task.dueDate);
  getBoardEditField("Category").value = task.category || "user-story";
  getBoardEditField("Priority").value = task.priority || "medium";
  getBoardEditField("Status").value = task.status || "todo";
  syncBoardEditDropdowns();
  await renderBoardEditAssignees(task.assignedTo);
  getBoardEditField("Subtasks").value = formatBoardSubtasksForEdit(
    task.subtasks,
  );
}


/**
 * Deletes the active task and re-renders the board.
 */
async function handleBoardDeleteClick() {
  if (!activeBoardTaskId) return;
  try {
    await deleteTaskFromStore(activeBoardTaskId);
    closeBoardTaskDetail();
    await initBoardTasks();
    showBoardToast("Task successfully deleted");
  } catch (error) {
    showBoardToast("Task could not be deleted.");
  }
}


/**
 * Saves the edited task and refreshes the board and detail view.
 * @param {Event} event - The form submit event.
 */
async function handleBoardEditSubmit(event) {
  event.preventDefault();
  const task = getActiveBoardTask();
  if (!task || !validateBoardEditForm()) return;
  await saveBoardEdit(getBoardEditedTask(task));
}


/**
 * Persists a valid board edit and restores the submit state afterwards.
 * @param {Object} updatedTask - The validated task data to save.
 */
async function saveBoardEdit(updatedTask) {
  setBoardEditPending(true);
  try {
    await updateTaskInStore(updatedTask);
    await refreshBoardAfterEdit(updatedTask.id);
    showBoardToast("Task successfully updated");
  } catch (error) {
    showBoardToast("Task could not be updated.");
  } finally {
    setBoardEditPending(false);
  }
}


/**
 * Adds field-level validation to the board edit form.
 */
function initBoardEditValidation() {
  const form = getBoardEditForm();
  form.addEventListener("focusout", handleBoardEditValidationEvent);
  form.addEventListener("input", handleBoardEditValidationEvent);
}


/**
 * Validates required fields after blur and clears visible errors while typing.
 * @param {Event} event - Input or focusout event from the edit form.
 */
function handleBoardEditValidationEvent(event) {
  const fieldName = boardEditFieldNames[event.target.id];
  if (!fieldName) return;
  const shouldValidate =
    event.type === "focusout" || event.target.getAttribute("aria-invalid") === "true";
  if (shouldValidate) validateBoardEditField(fieldName);
}


/**
 * Validates all required edit fields and focuses the first invalid input.
 * @returns {boolean} True when every required field is valid.
 */
function validateBoardEditForm() {
  const isValid = Object.values(boardEditFieldNames)
    .map(validateBoardEditField)
    .every(Boolean);
  if (!isValid) focusFirstInvalidBoardEditField();
  return isValid;
}


/**
 * Validates one board edit field and renders its inline message.
 * @param {string} fieldName - Board edit field suffix.
 * @returns {boolean} True when the field is valid.
 */
function validateBoardEditField(fieldName) {
  const message = getBoardEditFieldError(fieldName);
  setBoardEditFieldError(fieldName, message);
  return !message;
}


/**
 * Returns the validation message for one required board edit field.
 * @param {string} fieldName - Board edit field suffix.
 * @returns {string} Error text or an empty string.
 */
function getBoardEditFieldError(fieldName) {
  const value = getBoardEditField(fieldName).value.trim();
  if (fieldName === "Title") return value ? "" : "Please enter a title.";
  if (!value) return "Please enter a due date.";
  return normalizeTaskDueDate(value) ? "" : "Please enter a valid due date.";
}


/**
 * Updates one field's accessibility state and inline error text.
 * @param {string} fieldName - Board edit field suffix.
 * @param {string} message - Error text or an empty string.
 */
function setBoardEditFieldError(fieldName, message) {
  const field = getBoardEditField(fieldName);
  const error = document.getElementById(`boardTaskEdit${fieldName}Error`);
  field.setAttribute("aria-invalid", String(Boolean(message)));
  error.textContent = message;
  error.hidden = !message;
}


/**
 * Clears both board edit validation messages.
 */
function resetBoardEditValidation() {
  Object.values(boardEditFieldNames).forEach((fieldName) => {
    setBoardEditFieldError(fieldName, "");
  });
}


/**
 * Focuses the first invalid field after a failed submit.
 */
function focusFirstInvalidBoardEditField() {
  getBoardEditForm().querySelector('[aria-invalid="true"]')?.focus();
}


/**
 * Locks the board edit submit button while its save request is pending.
 * @param {boolean} isPending - True while the task is being saved.
 */
function setBoardEditPending(isPending) {
  const button = getBoardEditForm().querySelector('[type="submit"]');
  button.disabled = isPending;
  button.setAttribute("aria-busy", String(isPending));
}


/**
 * Builds the updated task object from the edit form values.
 * @param {Object} task - The original task being edited.
 * @returns {Object} The task with the edited values applied.
 */
function getBoardEditedTask(task) {
  return {
    ...task,
    title: getBoardEditField("Title").value.trim(),
    description: getBoardEditField("Description").value.trim(),
    dueDate: normalizeTaskDueDate(getBoardEditField("DueDate").value),
    category: getBoardEditField("Category").value,
    priority: getBoardEditField("Priority").value,
    status: getBoardEditField("Status").value,
    assignedTo: getBoardEditedAssignees(),
    subtasks: getBoardEditedSubtasks(),
  };
}


/**
 * Reads the subtasks from the edit form, keeping the done state of existing ones.
 * @returns {Object[]} The edited subtasks.
 */
function getBoardEditedSubtasks() {
  const previousSubtasks = getActiveBoardSubtasks();
  return getBoardEditField("Subtasks")
    .value.split("\n")
    .map(getTrimmedText)
    .filter(Boolean)
    .map((title) => toBoardSubtask(title, previousSubtasks));
}


/**
 * Returns the subtasks of the active task or an empty array.
 * @returns {Object[]} The subtasks of the active task.
 */
function getActiveBoardSubtasks() {
  const activeTask = getActiveBoardTask();
  return activeTask && Array.isArray(activeTask.subtasks)
    ? activeTask.subtasks
    : [];
}


/**
 * Returns the assignees selected in the edit form.
 * @returns {Object[]} Stable references to the selected contacts.
 */
function getBoardEditedAssignees() {
  return getBoardEditedAssigneesFromContacts();
}


/**
 * Removes leading and trailing whitespace from a text.
 * @param {string} text - The text to trim.
 * @returns {string} The trimmed text.
 */
function getTrimmedText(text) {
  return text.trim();
}


/**
 * Reloads the board after an edit and reopens the edited task's detail view.
 * @param {string} taskId - The id of the edited task.
 */
async function refreshBoardAfterEdit(taskId) {
  activeBoardTasks = await loadTasksFromStore();
  renderBoardColumns(activeBoardTasks);
  initBoardTaskDetails(activeBoardTasks);
  openBoardTaskDetail(taskId, activeBoardTasks);
}


/**
 * Converts the subtasks into the line-based text used by the edit form.
 * @param {Object[]} subtasks - The subtasks of the task.
 * @returns {string} One subtask title per line.
 */
function formatBoardSubtasksForEdit(subtasks) {
  if (!subtasks || !subtasks.length) return "";
  return subtasks.map(getBoardSubtaskTitle).filter(Boolean).join("\n");
}


/**
 * Returns the edit button of the task detail dialog.
 * @returns {HTMLElement} The edit button.
 */
function getBoardEditButton() {
  return document.getElementById("boardTaskEditButton");
}


/**
 * Returns the delete button of the task detail dialog.
 * @returns {HTMLElement} The delete button.
 */
function getBoardDeleteButton() {
  return document.getElementById("boardTaskDeleteButton");
}


/**
 * Returns the cancel button of the task edit form.
 * @returns {HTMLElement} The cancel button.
 */
function getBoardEditCancelButton() {
  return document.getElementById("boardTaskEditCancel");
}


/**
 * Returns the form element of the task edit mode.
 * @returns {HTMLElement} The edit form.
 */
function getBoardEditForm() {
  return document.getElementById("boardTaskEditForm");
}


/**
 * Returns an input element of the edit form by its field name.
 * @param {string} fieldName - The suffix of the field's element id.
 * @returns {HTMLElement} The form field element.
 */
function getBoardEditField(fieldName) {
  return document.getElementById(`boardTaskEdit${fieldName}`);
}
