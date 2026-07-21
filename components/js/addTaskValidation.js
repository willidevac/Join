const addTaskFieldValidators = {
  taskTitle: {
    errorId: "taskTitleError",
    getMessage: getAddTaskTitleError,
  },
  taskDueDate: {
    errorId: "taskDueDateError",
    getMessage: getAddTaskDueDateError,
  },
  taskCategory: {
    errorId: "taskCategoryError",
    getMessage: getAddTaskCategoryError,
  },
};

let addTaskValidationAttempted = false;


/** Returns today's local date in the ISO format used for task storage. */
function getTodayTaskDueDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}


/** Returns whether a normalized due date lies before the given local date. */
function isPastAddTaskDueDate(dueDate, today = getTodayTaskDueDate()) {
  return dueDate < today;
}


/**
 * Adds field-level validation without relying on native browser messages.
 */
function initAddTaskFieldValidation(form) {
  form.addEventListener("focusout", handleAddTaskFieldBlur);
}


/**
 * Validates a required field as soon as the user leaves it.
 *
 * @param {FocusEvent} event - Focusout event coming from the form.
 */
function handleAddTaskFieldBlur(event) {
  const fieldId = getAddTaskBlurFieldId(event);
  if (!getAddTaskFieldValidator(fieldId)) return;
  validateAddTaskField(fieldId);
}


/** Maps native and custom form controls to the field they validate. */
function getAddTaskBlurFieldId(event) {
  if (event.target.id !== "taskCategoryButton") return event.target.id;
  const dropdown = document.getElementById("taskCategoryDropdown");
  return dropdown.contains(event.relatedTarget) ? "" : "taskCategory";
}


/**
 * Revalidates a field while editing so stale errors disappear immediately.
 *
 * @param {string} [fieldId] - Id of the field that triggered the change.
 */
function handleAddTaskValidationChange(fieldId) {
  if (shouldRevalidateAddTaskField(fieldId)) validateAddTaskField(fieldId);
}


/**
 * Decides whether live revalidation should run for a field.
 *
 * @param {string} [fieldId] - Id of the edited field.
 * @returns {boolean} True after a failed submit or while an error is visible.
 */
function shouldRevalidateAddTaskField(fieldId) {
  const validator = getAddTaskFieldValidator(fieldId);
  if (!validator) return false;
  return addTaskValidationAttempted || Boolean(getAddTaskError(validator).textContent);
}


/**
 * Shows all required-field errors and reports whether saving may continue.
 */
function validateAddTaskForm() {
  addTaskValidationAttempted = true;
  const isValid = Object.keys(addTaskFieldValidators)
    .map(validateAddTaskField)
    .every(Boolean);
  if (!isValid) focusFirstInvalidAddTaskField();
  return isValid;
}


/**
 * Moves keyboard focus to the first field that is marked invalid.
 */
function focusFirstInvalidAddTaskField() {
  document.querySelector('.add-task-field [aria-invalid="true"]')?.focus();
}


/**
 * Validates one required field and updates its visible error message.
 *
 * @param {string} fieldId - Id of the field to validate.
 * @returns {boolean} True if the field is valid.
 */
function validateAddTaskField(fieldId) {
  const validator = getAddTaskFieldValidator(fieldId);
  const message = validator.getMessage();
  setAddTaskFieldError(fieldId, validator.errorId, message);
  return !message;
}


/**
 * Writes the error text and the aria-invalid state for one field.
 *
 * @param {string} fieldId - Id of the validated input element.
 * @param {string} errorId - Id of the matching error message element.
 * @param {string} message - Error text, or an empty string to clear it.
 */
function setAddTaskFieldError(fieldId, errorId, message) {
  getAddTaskValidationControl(fieldId).setAttribute("aria-invalid", String(Boolean(message)));
  document.getElementById(errorId).textContent = message;
}


/** Returns the visible control that owns a field's validation state. */
function getAddTaskValidationControl(fieldId) {
  const controlId = fieldId === "taskCategory" ? "taskCategoryButton" : fieldId;
  return document.getElementById(controlId);
}


/**
 * Looks up the validator configuration for a field.
 *
 * @param {string} fieldId - Id of a form field.
 * @returns {Object|undefined} Validator entry, if the field is required.
 */
function getAddTaskFieldValidator(fieldId) {
  return addTaskFieldValidators[fieldId];
}


/**
 * Returns the error message element for a validator entry.
 *
 * @param {Object} validator - Entry from addTaskFieldValidators.
 * @returns {HTMLElement} The matching error message element.
 */
function getAddTaskError(validator) {
  return document.getElementById(validator.errorId);
}


/**
 * @returns {string} Error message for a missing title, or an empty string.
 */
function getAddTaskTitleError() {
  return getAddTaskTitle() ? "" : "Please enter a title.";
}


/**
 * @returns {string} Error message for a missing or invalid due date, or an empty string.
 */
function getAddTaskDueDateError() {
  const input = document.getElementById("taskDueDate").value.trim();
  if (!input) return "Please select a due date.";
  return getValidatedAddTaskDueDateError(getAddTaskDueDate());
}


/** Returns validation feedback for a normalized Add Task due date. */
function getValidatedAddTaskDueDateError(dueDate) {
  if (!dueDate) return "Please select a valid due date.";
  return isPastAddTaskDueDate(dueDate) ? "Please select today or a future date." : "";
}


/**
 * @returns {string} Error message for a missing category, or an empty string.
 */
function getAddTaskCategoryError() {
  return getAddTaskCategory() ? "" : "Please select a category.";
}


/**
 * Locks every form control and shows an overlay while the task is being saved.
 *
 * @param {boolean} isPending - True while the save request is running.
 */
function setAddTaskSubmitPending(isPending) {
  const fieldset = document.getElementById("addTaskFormFieldset");
  fieldset.disabled = isPending;
  fieldset.setAttribute("aria-busy", String(isPending));
  document.getElementById("addTaskFormOverlay").hidden = !isPending;
}


/**
 * Clears all visible errors and the failed-submit state after a form reset.
 */
function resetAddTaskFieldValidation() {
  addTaskValidationAttempted = false;
  Object.entries(addTaskFieldValidators).forEach(([fieldId, validator]) => {
    setAddTaskFieldError(fieldId, validator.errorId, "");
  });
}
