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
 * Stops the dummy form from reloading and prepares the task data for a later Firebase step.
 */
function handleAddTaskSubmit(event) {
  event.preventDefault();
  if (!isAddTaskFormValid()) return;

  window.joinPreparedTask = getAddTaskData();
}

/**
 * Clears the prepared dummy task after the form was reset.
 */
function handleAddTaskReset() {
  window.joinPreparedTask = null;
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
 * Checks only the current required dummy fields. Saving follows later.
 */
function isAddTaskFormValid() {
  return Boolean(getAddTaskTitle() && getAddTaskDueDate() && getAddTaskCategory());
}

/**
 * Reads the current form values and creates the task object for the next implementation step.
 */
function getAddTaskData() {
  return {
    title: getAddTaskTitle(),
    description: getAddTaskDescription(),
    dueDate: getAddTaskDueDate(),
    priority: getAddTaskPriority(),
    assignedTo: getAddTaskAssignee(),
    category: getAddTaskCategory(),
    subtasks: getAddTaskSubtasks(),
  };
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
