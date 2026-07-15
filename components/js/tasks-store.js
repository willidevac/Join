/**
 * Loads tasks from Firestore when available, otherwise from localStorage.
 */
async function loadTasksFromStore() {
  const tasks = isTaskFirestoreReady()
    ? await window.joinFirebaseTasks.loadTasks()
    : getStoredTasks();
  return migrateTaskAssigneeReferences(tasks);
}


/**
 * Replaces legacy assignee names with stable contact references where possible.
 * @param {Object[]} tasks - Tasks loaded from the active store.
 * @returns {Promise<Object[]>} Tasks with normalized assignments.
 */
async function migrateTaskAssigneeReferences(tasks) {
  const contacts = await loadTaskMigrationContacts();
  const migratedTasks = tasks.map((task) => migrateTaskAssignees(task, contacts));
  const changedTasks = migratedTasks.filter((task, index) =>
    hasTaskAssignmentsChanged(tasks[index], task),
  );
  await Promise.all(changedTasks.map(updateTaskInStore));
  return migratedTasks;
}


/**
 * Loads contacts for the legacy migration without blocking task rendering.
 * @returns {Promise<Object[]>} Contacts or an empty fallback.
 */
async function loadTaskMigrationContacts() {
  try {
    return await loadContactsFromStore();
  } catch (error) {
    return [];
  }
}


/**
 * Returns one task with every assignee in the current reference format.
 * @param {Object} task - Task to normalize.
 * @param {Object[]} contacts - Contacts used to resolve legacy names.
 * @returns {Object} Normalized task copy.
 */
function migrateTaskAssignees(task, contacts) {
  const assignedTo = getTaskAssigneeReferences(task.assignedTo).map((assignee) =>
    resolveTaskAssigneeContact(assignee, contacts),
  );
  return { ...task, assignedTo };
}


/**
 * Resolves one legacy name only when exactly one contact matches it.
 * @param {Object} assignee - Normalized assignee reference.
 * @param {Object[]} contacts - Available contacts.
 * @returns {Object} Reference with a stable id whenever it can be resolved.
 */
function resolveTaskAssigneeContact(assignee, contacts) {
  if (assignee.id) return assignee;
  const matches = contacts.filter((contact) => contact.name === assignee.name);
  return matches.length === 1
    ? createTaskAssigneeReference(matches[0])
    : assignee;
}


/**
 * Checks whether migration changed the persisted assignment representation.
 * @param {Object} originalTask - Task before migration.
 * @param {Object} migratedTask - Task after migration.
 * @returns {boolean} True when the assignment list needs to be saved.
 */
function hasTaskAssignmentsChanged(originalTask, migratedTask) {
  return (
    JSON.stringify(originalTask.assignedTo || []) !==
    JSON.stringify(migratedTask.assignedTo)
  );
}


/**
 * Creates one task in Firestore or localStorage and returns it with an id.
 */
async function createTaskInStore(task) {
  if (isTaskFirestoreReady()) return window.joinFirebaseTasks.createTask(task);
  saveCreatedTask(task);
  return task;
}


/**
 * Updates one task in Firestore or localStorage.
 */
async function updateTaskInStore(task) {
  if (isTaskFirestoreReady()) {
    await window.joinFirebaseTasks.updateTask(task.id, task);
    return;
  }
  updateStoredTask(task);
}


/**
 * Deletes one task from Firestore or localStorage.
 */
async function deleteTaskFromStore(taskId) {
  if (isTaskFirestoreReady()) {
    await window.joinFirebaseTasks.deleteTask(taskId);
    return;
  }
  deleteStoredTask(taskId);
}


/**
 * @returns {boolean} True when the Firebase task helpers are available.
 */
function isTaskFirestoreReady() {
  return Boolean(window.joinFirebaseTasks);
}
