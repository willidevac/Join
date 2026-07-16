let boardEditSubtaskItems = [];
let boardEditSubtaskEditingIndex = -1;


/**
 * Loads the task subtasks into the edit state and renders the list.
 * @param {Array} subtasks - Raw subtasks stored on the task.
 */
function initBoardEditSubtasks(subtasks) {
  boardEditSubtaskItems = getNormalizedBoardSubtasks(subtasks);
  boardEditSubtaskEditingIndex = -1;
  getBoardEditSubtaskInput().value = "";
  updateBoardEditSubtaskAddState();
  renderBoardEditSubtasks();
  bindBoardEditSubtaskControls();
}


/**
 * Wires the subtask input and list events once.
 */
function bindBoardEditSubtaskControls() {
  const input = getBoardEditSubtaskInput();
  if (input.dataset.eventsReady === "true") return;
  input.addEventListener("keydown", handleBoardEditSubtaskInputKey);
  input.addEventListener("input", updateBoardEditSubtaskAddState);
  getBoardEditSubtaskList().addEventListener(
    "click",
    handleBoardEditSubtaskListClick,
  );
  getBoardEditSubtaskList().addEventListener(
    "keydown",
    handleBoardEditSubtaskListKey,
  );
  bindBoardEditSubtaskAddButton();
  input.dataset.eventsReady = "true";
}


/**
 * Wires the plus button that adds the typed subtask.
 */
function bindBoardEditSubtaskAddButton() {
  getBoardEditSubtaskAddButton().addEventListener(
    "click",
    addBoardEditSubtask,
  );
}


/**
 * @param {string} title - Trimmed subtask title.
 * @returns {boolean} True when the title has at least four characters.
 */
function isValidBoardEditSubtaskTitle(title) {
  return title.length >= 4;
}


/**
 * Enables the plus button only while the input holds a valid title.
 */
function updateBoardEditSubtaskAddState() {
  getBoardEditSubtaskAddButton().disabled = !isValidBoardEditSubtaskTitle(
    getBoardEditSubtaskInput().value.trim(),
  );
}


/**
 * Adds a subtask on Enter without submitting the edit form.
 * @param {KeyboardEvent} event - Keydown event of the subtask input.
 */
function handleBoardEditSubtaskInputKey(event) {
  if (event.key !== "Enter") return;
  event.preventDefault();
  addBoardEditSubtask();
}


/**
 * Appends a new open subtask when the input holds a valid title.
 */
function addBoardEditSubtask() {
  const input = getBoardEditSubtaskInput();
  const title = input.value.trim();
  if (!isValidBoardEditSubtaskTitle(title)) return;
  boardEditSubtaskItems.push({ title, done: false });
  input.value = "";
  updateBoardEditSubtaskAddState();
  renderBoardEditSubtasks();
  input.focus();
}


/**
 * Starts editing, deletes or saves a subtask from the row buttons.
 * @param {MouseEvent} event - Click event inside the subtask list.
 */
function handleBoardEditSubtaskListClick(event) {
  const button = event.target.closest("[data-subtask-action]");
  if (!button) return;
  const index = Number(
    button.closest("[data-subtask-index]").dataset.subtaskIndex,
  );
  const action = button.dataset.subtaskAction;
  if (action === "save") return saveBoardEditSubtask(index);
  if (action === "edit") boardEditSubtaskEditingIndex = index;
  if (action === "delete") deleteBoardEditSubtask(index);
  renderBoardEditSubtasks();
}


/**
 * Removes one subtask and leaves edit mode when it was being edited.
 * @param {number} index - Position of the subtask to remove.
 */
function deleteBoardEditSubtask(index) {
  boardEditSubtaskItems.splice(index, 1);
  if (boardEditSubtaskEditingIndex === index) boardEditSubtaskEditingIndex = -1;
}


/**
 * Saves the inline edit on Enter without submitting the edit form.
 * @param {KeyboardEvent} event - Keydown event inside the subtask list.
 */
function handleBoardEditSubtaskListKey(event) {
  if (event.key !== "Enter" || !event.target.matches("[data-subtask-edit]"))
    return;
  event.preventDefault();
  saveBoardEditSubtask(boardEditSubtaskEditingIndex);
}


/**
 * Applies the edited title to the subtask and leaves edit mode.
 * @param {number} index - Position of the edited subtask.
 */
function saveBoardEditSubtask(index) {
  const input = getBoardEditSubtaskList().querySelector("[data-subtask-edit]");
  const title = input.value.trim();
  if (title) {
    boardEditSubtaskItems[index] = { ...boardEditSubtaskItems[index], title };
  }
  boardEditSubtaskEditingIndex = -1;
  renderBoardEditSubtasks();
}


/**
 * Renders all subtask rows in view or inline edit mode.
 */
function renderBoardEditSubtasks() {
  getBoardEditSubtaskList().innerHTML = boardEditSubtaskItems
    .map(getBoardEditSubtaskTemplate)
    .join("");
}


/**
 * Returns the markup for one subtask row, using the shared add-task styles.
 * @param {Object} subtask - Subtask with title and done flag.
 * @param {number} index - Position of the subtask in the edit state.
 * @returns {string} HTML markup for the row.
 */
function getBoardEditSubtaskTemplate(subtask, index) {
  if (index === boardEditSubtaskEditingIndex) {
    return getBoardEditSubtaskEditTemplate(subtask, index);
  }
  return `
    <li class="add-task-subtask" data-subtask-index="${index}">
      <span class="add-task-subtask__title">${escapeBoardText(subtask.title)}</span>
      <span class="add-task-subtask__actions">
        <button type="button" class="add-task-subtask__action" data-subtask-action="edit" aria-label="Edit subtask">
          <img src="./components/assets/img/icons/edit.svg" alt="" />
        </button>
        <span class="add-task-subtask__divider" aria-hidden="true"></span>
        <button type="button" class="add-task-subtask__action" data-subtask-action="delete" aria-label="Delete subtask">
          <img src="./components/assets/img/icons/delete.svg" alt="" />
        </button>
      </span>
    </li>`;
}


/**
 * Returns the inline edit markup for the subtask that is being changed.
 * @param {Object} subtask - Subtask with title and done flag.
 * @param {number} index - Position of the subtask in the edit state.
 * @returns {string} HTML markup for the edit row.
 */
function getBoardEditSubtaskEditTemplate(subtask, index) {
  return `
    <li class="add-task-subtask add-task-subtask--editing" data-subtask-index="${index}">
      <input class="add-task-subtask__edit" type="text" value="${escapeBoardText(subtask.title)}" data-subtask-edit aria-label="Edit subtask" />
      <span class="add-task-subtask__actions">
        <button type="button" class="add-task-subtask__action" data-subtask-action="delete" aria-label="Delete subtask">
          <img src="./components/assets/img/icons/delete.svg" alt="" />
        </button>
        <span class="add-task-subtask__divider" aria-hidden="true"></span>
        <button type="button" class="add-task-subtask__action" data-subtask-action="save" aria-label="Save subtask">
          <img src="./components/assets/img/icons/check_edit_subtask.svg" alt="" />
        </button>
      </span>
    </li>`;
}


/**
 * @returns {Object[]} Copy of the edited subtasks with kept done states.
 */
function getBoardEditSubtaskItems() {
  return [...boardEditSubtaskItems];
}


/**
 * @returns {HTMLElement} The input for new subtasks in the edit form.
 */
function getBoardEditSubtaskInput() {
  return document.getElementById("boardTaskEditSubtaskInput");
}


/**
 * @returns {HTMLElement} The list container for the edit subtask rows.
 */
function getBoardEditSubtaskList() {
  return document.getElementById("boardTaskEditSubtaskList");
}


/**
 * @returns {HTMLElement} The plus button of the subtask input.
 */
function getBoardEditSubtaskAddButton() {
  return document.getElementById("boardEditSubtaskAdd");
}
