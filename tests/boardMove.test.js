const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");


test("offers the adjacent board columns as move targets", () => {
  const context = loadBrowserScripts(["components/js/boardTemplates.js"]);

  assert.deepEqual(
    Array.from(
      context.getBoardMoveTargets("in-progress"),
      (target) => target.value,
    ),
    ["todo", "feedback"],
  );
});


test("uses directional icons relative to the current board column", () => {
  const context = loadBrowserScripts(["components/js/boardTemplates.js"]);
  const targets = context.getBoardMoveTargets("feedback");

  assert.deepEqual(
    Array.from(targets, (target) => target.icon),
    ["arrow_upward", "arrow_downward"],
  );
});


test("renders a moved task immediately and persists its new status", async () => {
  const task = { id: "task-1", status: "todo" };
  const state = { renders: 0, savedStatus: "" };
  const context = loadBrowserScripts(["components/js/boardDnd.js"], {
    activeBoardTasks: [task],
    renderBoardColumns: () => { state.renders += 1; },
    initBoardTaskDetails() {},
    updateTaskInStore: async (updatedTask) => {
      state.savedStatus = updatedTask.status;
    },
  });

  await context.moveBoardTaskToStatus(task, "done");

  assert.equal(task.status, "done");
  assert.equal(state.renders, 1);
  assert.equal(state.savedStatus, "done");
});
