const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");


test("completes local logout when Firebase logout fails", async () => {
  let cleared = false;
  let destination = "";
  const context = loadBrowserScripts(["components/js/auth.js"], {
    console: { error() {} },
    window: {
      joinFirebaseAuth: {
        async logoutFirebaseUser() { throw new Error("offline"); },
      },
    },
    clearStoredUser: () => { cleared = true; },
    navigateToPage: (page) => { destination = page; },
  });

  await context.handleLogout();

  assert.equal(cleared, true);
  assert.equal(destination, "login");
});


test("shows feedback when initial summary loading fails", async () => {
  const error = { textContent: "", hidden: true };
  const context = loadBrowserScripts(["components/js/summary.js"], {
    document: { getElementById: () => error },
    loadTasksFromStore: async () => { throw new Error("offline"); },
  });

  await context.initSummaryMetrics();

  assert.equal(error.textContent, "Task overview could not be loaded.");
  assert.equal(error.hidden, false);
});


test("shows feedback when initial board loading fails", async () => {
  const toast = { textContent: "", hidden: true };
  const context = loadBrowserScripts(["components/js/board.js"], {
    document: {
      querySelectorAll: () => [{}],
      getElementById: () => toast,
    },
    loadTasksFromStore: async () => { throw new Error("offline"); },
    setTimeout: () => 0,
  });

  await context.initBoardTasks();

  assert.equal(toast.textContent, "Board tasks could not be loaded.");
  assert.equal(toast.hidden, false);
});


function createBoardActionContext(task) {
  const messages = [];
  const context = loadBrowserScripts(["components/js/boardDetail.js"], {
    getActiveBoardTask: () => task,
    updateTaskInStore: async () => { throw new Error("offline"); },
    showBoardToast: (message) => messages.push(message),
  });
  return { context, messages };
}


test("restores a subtask checkbox and reports a failed update", async () => {
  const task = { id: "task-1", subtasks: [{ title: "Test", done: false }] };
  const { context, messages } = createBoardActionContext(task);
  const checkbox = {
    checked: true,
    dataset: { detailSubtaskIndex: "0" },
    matches: () => true,
  };

  await context.handleBoardDetailSubtaskChange({ target: checkbox });

  assert.equal(checkbox.checked, false);
  assert.deepEqual(messages, ["Subtask could not be updated."]);
});


test("restores mobile status and reports a failed update", async () => {
  const task = { id: "task-1", status: "todo" };
  const { context, messages } = createBoardActionContext(task);
  const select = { value: "done" };

  await context.handleBoardMobileStatusChange({ target: select });

  assert.equal(select.value, "todo");
  assert.deepEqual(messages, ["Task status could not be updated."]);
});
