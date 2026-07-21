const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");

const elements = {
  taskTitle: { value: "  Prepare release  " },
  taskDescription: { value: "  Verify the final build  " },
  taskDueDate: { value: "  2026-07-25  " },
  taskCategory: { value: "  technical-task  " },
};
const document = {
  getElementById: (id) => elements[id],
  querySelector: () => ({ value: "  urgent  " }),
};
const context = loadBrowserScripts([
  "components/js/tasks.js", "components/js/addTask.js",
], { document });


test("trims Add Task strings before building the task", () => {
  assert.equal(context.getAddTaskTitle(), "Prepare release");
  assert.equal(context.getAddTaskDescription(), "Verify the final build");
  assert.equal(context.getAddTaskDueDate(), "2026-07-25");
  assert.equal(context.getAddTaskPriority(), "urgent");
  assert.equal(context.getAddTaskCategory(), "technical-task");
});


test("treats whitespace-only required Add Task strings as empty", () => {
  elements.taskTitle.value = "   ";
  elements.taskCategory.value = "   ";
  assert.equal(context.getAddTaskTitle(), "");
  assert.equal(context.getAddTaskCategory(), "");
});
