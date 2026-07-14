const ADD_TASK_REDIRECT_DELAY = 900;
const ADD_TASK_STATUSES = ["todo", "in-progress", "feedback", "done"];
let addTaskRedirectTimer;


/**
 * Initializes the Add Task form and its dynamic contact dropdown.
 */
async function initAddTaskValidation() {
  const form = document.getElementById("addTaskForm");
  if (!form) return;

  await initAddTaskAssignees();
  initAddTaskSubtasks();
  initAddTaskFieldValidation(form);
  form.addEventListener("input", handleAddTaskFormChange);
  form.addEventListener("change", handleAddTaskFormChange);
  form.addEventListener("reset", handleAddTaskReset);
  form.addEventListener("submit", handleAddTaskSubmit);
}


/**
 * Saves the task through the task store and opens the board after success.
 *
 * @param {SubmitEvent} event - Submit event of the add task form.
 */
async function handleAddTaskSubmit(event) {
  event.preventDefault();
  if (!validateAddTaskForm()) return;
  const form = event.currentTarget;
  setAddTaskSubmitPending(true);
  hideAddTaskErrorMessage();
  try {
    await createTaskInStore(getAddTaskData());
    completeAddTaskSubmit(form);
  } catch {
    failAddTaskSubmit();
  }
}


/**
 * Finishes a successful save with user feedback and the board redirect.
 *
 * @param {HTMLFormElement} form - The submitted add task form.
 */
function completeAddTaskSubmit(form) {
  form.reset();
  resetAddTaskAssignees();
  showAddTaskSuccessMessage();
  redirectToBoardAfterSuccess();
}


/**
 * Re-enables the form and shows the error feedback after a failed save.
 */
function failAddTaskSubmit() {
  setAddTaskSubmitPending(false);
  showAddTaskErrorMessage();
}


/**
 * Clears stale success feedback when the user edits the form again.
 *
 * @param {Event} [event] - Input or change event; omitted for assignee updates.
 */
function handleAddTaskFormChange(event) {
  hideAddTaskSuccessMessage();
  hideAddTaskErrorMessage();
  clearAddTaskRedirect();
  handleAddTaskValidationChange(event?.target?.id);
}


/**
 * Clears assignees, subtasks and field errors after the form was reset.
 */
function handleAddTaskReset() {
  setTimeout(() => {
    resetAddTaskAssignees();
    resetAddTaskSubtasks();
    resetAddTaskFieldValidation();
  }, 0);
}


/**
 * Shows the short confirmation before the board route opens.
 */
function showAddTaskSuccessMessage() {
  const message = getAddTaskSuccessMessage();
  if (!message) return;

  message.hidden = false;
}


/**
 * Hides the confirmation while the form is being edited.
 */
function hideAddTaskSuccessMessage() {
  const message = getAddTaskSuccessMessage();
  if (!message) return;

  message.hidden = true;
}


/**
 * Shows the save-failed feedback below the form actions.
 */
function showAddTaskErrorMessage() {
  const message = document.getElementById("addTaskErrorMessage");
  if (message) message.hidden = false;
}


/**
 * Hides the save-failed feedback while the form is being edited.
 */
function hideAddTaskErrorMessage() {
  const message = document.getElementById("addTaskErrorMessage");
  if (message) message.hidden = true;
}


/**
 * Opens the board after the user had a short moment to see the confirmation.
 */
function redirectToBoardAfterSuccess() {
  clearAddTaskRedirect();
  addTaskRedirectTimer = setTimeout(() => navigateToPage("board"), ADD_TASK_REDIRECT_DELAY);
}


/**
 * Cancels a pending board redirect, e.g. when the user keeps editing.
 */
function clearAddTaskRedirect() {
  if (addTaskRedirectTimer) clearTimeout(addTaskRedirectTimer);
}


/**
 * @returns {HTMLElement|null} The success message element of the form.
 */
function getAddTaskSuccessMessage() {
  return document.getElementById("addTaskSuccessMessage");
}


/**
 * Reads the current form values and creates the task object used by the board.
 */
function getAddTaskData() {
  return {
    id: createTaskId(),
    title: getAddTaskTitle(),
    description: getAddTaskDescription(),
    dueDate: getAddTaskDueDate(),
    priority: getAddTaskPriority(),
    assignedTo: getAddTaskAssignee(),
    category: getAddTaskCategory(),
    subtasks: getAddTaskSubtasks(),
    status: getAddTaskStatus(),
    createdAt: new Date().toISOString(),
  };
}


/**
 * Uses a valid status passed by a board column and defaults to To do.
 */
function getAddTaskStatus() {
  const status = new URLSearchParams(window.location.search).get("status");
  return ADD_TASK_STATUSES.includes(status) ? status : "todo";
}


/**
 * @returns {string} A unique task id based on the current timestamp.
 */
function createTaskId() {
  return `task-${Date.now()}`;
}


/**
 * @returns {string} The trimmed task title from the form.
 */
function getAddTaskTitle() {
  return document.getElementById("taskTitle").value.trim();
}


/**
 * @returns {string} The trimmed optional description from the form.
 */
function getAddTaskDescription() {
  return document.getElementById("taskDescription").value.trim();
}


/**
 * @returns {string} The normalized due date, or an empty string if invalid.
 */
function getAddTaskDueDate() {
  const dueDate = document.getElementById("taskDueDate").value.trim();
  return normalizeTaskDueDate(dueDate);
}


/**
 * @returns {string} The selected priority; "medium" is preselected by default.
 */
function getAddTaskPriority() {
  return document.querySelector('input[name="taskPriority"]:checked').value;
}


/**
 * @returns {string[]} Names of all currently selected contacts.
 */
function getAddTaskAssignee() {
  return selectedTaskAssignees.map((contact) => contact.name);
}


/**
 * @returns {string} The selected category value, or an empty string.
 */
function getAddTaskCategory() {
  return document.getElementById("taskCategory").value;
}



