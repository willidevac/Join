/**
 * Wires the Add Task dummy form so Create Task unlocks only when required fields are filled.
 */
function initAddTaskValidation() {
  const form = document.getElementById("addTaskForm");
  if (!form) return;

  form.addEventListener("input", updateCreateTaskButton);
  form.addEventListener("change", updateCreateTaskButton);
  form.addEventListener("reset", handleAddTaskReset);
  form.addEventListener("submit", handleAddTaskSubmit);
  updateCreateTaskButton();
}

/**
 * Stops the form reload, saves the task locally and resets the dummy form.
 */
function handleAddTaskSubmit(event) {
  event.preventDefault();
  if (!isAddTaskFormValid()) return;

  const task = getAddTaskData();
  saveCreatedTask(task);
  event.target.reset();
}

/**
 * Updates the button state after the form was reset.
 */
function handleAddTaskReset() {
  setTimeout(updateCreateTaskButton);
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
