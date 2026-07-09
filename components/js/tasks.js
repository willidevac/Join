const TASK_STORAGE_KEY = "joinTasks";

/**
 * Reads the locally saved task list for the temporary localStorage step.
 */
function getStoredTasks() {
  const storedTasks = localStorage.getItem(TASK_STORAGE_KEY);
  return storedTasks ? JSON.parse(storedTasks) : [];
}

/**
 * Saves the complete task list in localStorage.
 */
function saveStoredTasks(tasks) {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

/**
 * Adds one new task to the locally saved task list.
 */
function saveCreatedTask(task) {
  const tasks = getStoredTasks();
  tasks.push(task);
  saveStoredTasks(tasks);
}

/**
 * Replaces one existing task after it was edited on the board.
 */
function updateStoredTask(updatedTask) {
  const tasks = getStoredTasks();
  const updatedTasks = tasks.map((task) => (task.id === updatedTask.id ? updatedTask : task));
  saveStoredTasks(updatedTasks);
}
