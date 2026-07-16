const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");

const fields = {
  boardTaskEditTitle: { value: "" },
  boardTaskEditDueDate: { value: "" },
};

const document = {
  getElementById(id) {
    return fields[id] || null;
  },
};

const context = loadBrowserScripts(
  ["components/js/tasks.js", "components/js/boardEdit.js"],
  { document },
);


test("accepts a valid board edit due date", () => {
  fields.boardTaskEditDueDate.value = "2026-07-16";
  assert.equal(context.getBoardEditFieldError("DueDate"), "");
});


test("distinguishes a missing board edit due date", () => {
  fields.boardTaskEditDueDate.value = "";
  assert.equal(
    context.getBoardEditFieldError("DueDate"),
    "Please enter a due date.",
  );
});


test("rejects an impossible board edit due date before saving", () => {
  fields.boardTaskEditDueDate.value = "2026-02-31";
  assert.equal(
    context.getBoardEditFieldError("DueDate"),
    "Please enter a valid due date.",
  );
});
