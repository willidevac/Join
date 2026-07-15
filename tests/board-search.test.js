const assert = require("node:assert/strict");
const test = require("node:test");

const {
  loadBrowserScripts,
  toPlainValue,
} = require("./helpers/scriptContext");

const BOARD_SEARCH_SCRIPT = "components/js/board-search.js";

/**
 * Loads the board search logic with a minimal board and DOM test setup.
 * @param {Object[]} tasks Tasks available on the board.
 * @returns {Object} Search context and observable render state.
 */
function createBoardSearchContext(tasks) {
  const elements = createBoardSearchElements();
  const state = { renderedTasks: [], detailTasks: [] };
  const globals = createBoardSearchGlobals(tasks, elements, state);
  const context = loadBrowserScripts([BOARD_SEARCH_SCRIPT], globals);
  return { ...elements, context, state };
}


/**
 * Creates the observable elements used by the search result display.
 */
function createBoardSearchElements() {
  return {
    noResultsElement: { hidden: true },
    columnsElement: { hidden: false },
  };
}


/**
 * Creates the browser globals required by the board search script.
 */
function createBoardSearchGlobals(tasks, elements, state) {
  return {
    activeBoardTasks: tasks,
    document: createBoardSearchDocument(elements),
    renderBoardColumns: (result) => storeSearchResult(state, "renderedTasks", result),
    initBoardTaskDetails: (result) => storeSearchResult(state, "detailTasks", result),
  };
}


/**
 * Stores one observable search result for later assertions.
 */
function storeSearchResult(state, key, result) {
  state[key] = result;
}


/**
 * Provides only the elements used by the no-results display logic.
 */
function createBoardSearchDocument(elements) {
  return {
    getElementById: (id) =>
      id === "boardSearchNoResults" ? elements.noResultsElement : null,
    querySelector: (selector) =>
      selector === ".board-columns" ? elements.columnsElement : null,
  };
}

const TASKS = [
  { id: "1", title: "Design login", description: "Create the page" },
  { id: "2", title: "Connect board", description: "Load Firestore tasks" },
  { id: "3", title: "Review contacts", description: "Check long names" },
];

test("returns all board tasks for an empty search term", () => {
  const { context } = createBoardSearchContext(TASKS);
  assert.deepEqual(toPlainValue(context.getBoardSearchResults("")), TASKS);
});

test("finds title matches from the first character", () => {
  const { context } = createBoardSearchContext(TASKS);
  const result = context.getBoardSearchResults("v");
  assert.deepEqual(toPlainValue(result), [TASKS[2]]);
});

test("finds tasks by description and handles missing text fields", () => {
  const tasks = [...TASKS, { id: "4" }];
  const { context } = createBoardSearchContext(tasks);
  const result = context.getBoardSearchResults("firestore");
  assert.deepEqual(toPlainValue(result), [TASKS[1]]);
  assert.equal(context.taskMatchesSearch(tasks[3], "firestore"), false);
});

test("normalizes whitespace and letter case before filtering", () => {
  const { context, state } = createBoardSearchContext(TASKS);
  context.handleBoardSearchInput({ target: { value: "  LOGIN  " } });
  assert.deepEqual(toPlainValue(state.renderedTasks), [TASKS[0]]);
  assert.deepEqual(toPlainValue(state.detailTasks), [TASKS[0]]);
});

test("shows the no-results notice only for an unsuccessful search", () => {
  const setup = createBoardSearchContext(TASKS);
  setup.context.handleBoardSearchInput({ target: { value: "missing" } });
  assert.equal(setup.noResultsElement.hidden, false);
  assert.equal(setup.columnsElement.hidden, true);

  setup.context.handleBoardSearchInput({ target: { value: "board" } });
  assert.equal(setup.noResultsElement.hidden, true);
  assert.equal(setup.columnsElement.hidden, false);
});
