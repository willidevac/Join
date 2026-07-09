const ADD_TASK_REDIRECT_DELAY = 900;
let addTaskRedirectTimer;

/**
 * Wires the Add Task dummy form so Create Task unlocks only when required fields are filled.
 */
function initAddTaskValidation() {
  const form = document.getElementById("addTaskForm");
  if (!form) return;

  form.addEventListener("input", handleAddTaskFormChange);
  form.addEventListener("change", handleAddTaskFormChange);
  form.addEventListener("reset", handleAddTaskReset);
  form.addEventListener("submit", handleAddTaskSubmit);
  updateCreateTaskButton();
}

/**
 * Stops the form reload, saves the task locally and shows feedback before opening the board.
 */
function handleAddTaskSubmit(event) {
  event.preventDefault();
  if (!isAddTaskFormValid()) return;

  saveCreatedTask(getAddTaskData());
  event.target.reset();
  showAddTaskSuccessMessage();
  redirectToBoardAfterSuccess();
}

/**
 * Clears stale success feedback when the user edits the form again.
 */
function handleAddTaskFormChange() {
  hideAddTaskSuccessMessage();
  clearAddTaskRedirect();
  updateCreateTaskButton();
}

/**
 * Updates the button state after the form was reset.
 */
function handleAddTaskReset() {
  setTimeout(updateCreateTaskButton, 0);
}

/**
 * Enables Create Task when Title, Due date and Category have values.
 */
function updateCreateTaskButton() {
  const button = document.getElementById("createTaskButton");
  if (!button) return;

  button.disabled = !isAddTaskFormValid();
}

/**
 * Checks only the current required dummy fields. Firebase saving follows later.
 */
function isAddTaskFormValid() {
  return Boolean(getAddTaskTitle() && getAddTaskDueDate() && getAddTaskCategory());
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
 * Opens the board after the user had a short moment to see the confirmation.
 */
function redirectToBoardAfterSuccess() {
  clearAddTaskRedirect();
  addTaskRedirectTimer = setTimeout(() => navigateToPage("board"), ADD_TASK_REDIRECT_DELAY);
}

function clearAddTaskRedirect() {
  if (addTaskRedirectTimer) clearTimeout(addTaskRedirectTimer);
}

function getAddTaskSuccessMessage() {
  return document.getElementById("addTaskSuccessMessage");
}

/**
 * Reads the current form values and creates the task object for local test data.
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
    status: "todo",
    createdAt: new Date().toISOString(),
  };
}

function createTaskId() {
  return `task-${Date.now()}`;
}

function getAddTaskTitle() {
  return document.getElementById("taskTitle").value.trim();
}

function getAddTaskDescription() {
  return document.getElementById("taskDescription").value.trim();
}

function getAddTaskDueDate() {
  return document.getElementById("taskDueDate").value.trim();
}

function getAddTaskPriority() {
  return document.querySelector('input[name="taskPriority"]:checked').value;
}

function getAddTaskAssignee() {
  return document.getElementById("taskAssignees").value;
}

function getAddTaskCategory() {
  return document.getElementById("taskCategory").value;
}

function getAddTaskSubtasks() {
  const subtask = document.getElementById("taskSubtasks").value.trim();
  return subtask ? [subtask] : [];
}
