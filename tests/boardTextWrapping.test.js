const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");

const context = loadBrowserScripts([
  "components/js/core/shared.js",
  "components/js/board/boardTemplates.js",
]);


test("keeps a long board URL complete for safe visual wrapping", () => {
  const url = "https://example.com/a-very-long-path-without-natural-spaces-or-breaks";
  assert.equal(context.getBoardShortText(url), url);
});


test("still shortens ordinary long board descriptions", () => {
  const description = "A regular description with enough words to exceed the board preview limit without containing a link.";
  assert.equal(context.getBoardShortText(description).length, 72);
  assert.equal(context.getBoardShortText(description).endsWith("..."), true);
});
