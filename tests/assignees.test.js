const assert = require("node:assert/strict");
const test = require("node:test");

const {
  loadBrowserScripts,
  toPlainValue,
} = require("./helpers/scriptContext");

const SHARED_SCRIPT = "components/js/shared.js";
const TASK_STORE_SCRIPT = "components/js/tasks-store.js";
const CONTACTS_SCRIPT = "components/js/contacts.js";

/**
 * Loads the shared assignee helpers in isolation.
 * @returns {Object} Context exposing the shared helper functions.
 */
function createSharedContext() {
  return loadBrowserScripts([SHARED_SCRIPT]);
}


/**
 * Creates a Firebase task adapter that records every persisted update.
 * @param {Object[]} updates - Target list for captured updates.
 * @returns {Object} Minimal Firebase task adapter.
 */
function createFirebaseTaskAdapter(updates) {
  return {
    async updateTask(taskId, task) {
      updates.push({ taskId, task: toPlainValue(task) });
    },
  };
}


/**
 * Loads task migration logic with contacts and an observable Firebase adapter.
 * @param {Object[]} contacts - Contacts available during legacy migration.
 * @returns {Object} Migration context and captured task updates.
 */
function createMigrationContext(contacts) {
  const updates = [];
  const window = { joinFirebaseTasks: createFirebaseTaskAdapter(updates) };
  const loadContactsFromStore = async () => contacts;
  const context = loadBrowserScripts(
    [SHARED_SCRIPT, TASK_STORE_SCRIPT],
    { loadContactsFromStore, window },
  );
  return { context, updates };
}


/**
 * Loads the contact cleanup helper with shared assignee behavior.
 * @returns {Object} Context exposing contact task cleanup functions.
 */
function createContactContext() {
  return loadBrowserScripts([SHARED_SCRIPT, CONTACTS_SCRIPT]);
}


test("normalizes legacy strings and current assignee references", () => {
  const context = createSharedContext();
  const assignedTo = ["Anna Schmidt", { id: "contact-2", name: "Ben Mueller" }];
  const actual = context.getTaskAssigneeReferences(assignedTo);
  assert.deepEqual(toPlainValue(actual), [
    { id: "", name: "Anna Schmidt" },
    { id: "contact-2", name: "Ben Mueller" },
  ]);
});


test("migrates a unique legacy name to a stable contact id", async () => {
  const contacts = [{ id: "contact-1", name: "Anna Schmidt" }];
  const { context, updates } = createMigrationContext(contacts);
  const tasks = [{ id: "task-1", assignedTo: ["Anna Schmidt"] }];
  const migrated = await context.migrateTaskAssigneeReferences(tasks);
  assert.deepEqual(toPlainValue(migrated[0].assignedTo), [
    { id: "contact-1", name: "Anna Schmidt" },
  ]);
  assert.equal(updates.length, 1);
});


test("does not rewrite an already normalized assignment", async () => {
  const assignee = { id: "contact-1", name: "Anna Schmidt" };
  const { context, updates } = createMigrationContext([assignee]);
  const tasks = [{ id: "task-1", assignedTo: [assignee] }];
  const migrated = await context.migrateTaskAssigneeReferences(tasks);
  assert.deepEqual(toPlainValue(migrated), tasks);
  assert.equal(updates.length, 0);
});


test("keeps an ambiguous legacy name unresolved", async () => {
  const contacts = [
    { id: "contact-1", name: "Alex Kim" },
    { id: "contact-2", name: "Alex Kim" },
  ];
  const { context } = createMigrationContext(contacts);
  const tasks = [{ id: "task-1", assignedTo: ["Alex Kim"] }];
  const migrated = await context.migrateTaskAssigneeReferences(tasks);
  assert.deepEqual(toPlainValue(migrated[0].assignedTo), [
    { id: "", name: "Alex Kim" },
  ]);
});


test("distinguishes contacts with the same name by id", () => {
  const context = createSharedContext();
  const assignee = { id: "contact-1", name: "Alex Kim" };
  assert.equal(context.isTaskAssigneeContact(assignee, assignee), true);
  assert.equal(
    context.isTaskAssigneeContact(assignee, { id: "contact-2", name: "Alex Kim" }),
    false,
  );
});


test("contact deletion removes only the matching assignee id", () => {
  const context = createContactContext();
  const task = {
    id: "task-1",
    assignedTo: [
      { id: "contact-1", name: "Alex Kim" },
      { id: "contact-2", name: "Alex Kim" },
    ],
  };
  const result = context.removeAssigneeFromTask(task, task.assignedTo[0]);
  assert.deepEqual(toPlainValue(result.assignedTo), [task.assignedTo[1]]);
});
