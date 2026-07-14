const ADD_TASK_FIELD_VALIDATORS = {
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
  const fieldId = event.target.id;
  if (!getAddTaskFieldValidator(fieldId)) return;
  validateAddTaskField(fieldId);
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
  const isValid = Object.keys(ADD_TASK_FIELD_VALIDATORS)
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
  document.getElementById(fieldId).setAttribute("aria-invalid", String(Boolean(message)));
  document.getElementById(errorId).textContent = message;
}


/**
 * Looks up the validator configuration for a field.
 *
 * @param {string} fieldId - Id of a form field.
 * @returns {Object|undefined} Validator entry, if the field is required.
 */
function getAddTaskFieldValidator(fieldId) {
  return ADD_TASK_FIELD_VALIDATORS[fieldId];
}


/**
 * Returns the error message element for a validator entry.
 *
 * @param {Object} validator - Entry from ADD_TASK_FIELD_VALIDATORS.
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
  if (!input) return "Please enter a due date.";
  return getAddTaskDueDate() ? "" : "Enter a valid date in dd/mm/yyyy.";
}


/**
 * @returns {string} Error message for a missing category, or an empty string.
 */
function getAddTaskCategoryError() {
  return getAddTaskCategory() ? "" : "Please select a category.";
}


/**
 * Disables the create button while the task is being saved.
 *
 * @param {boolean} isPending - True while the save request is running.
 */
function setAddTaskSubmitPending(isPending) {
  const button = document.getElementById("createTaskButton");
  button.disabled = isPending;
  button.setAttribute("aria-busy", String(isPending));
}


/**
 * Clears all visible errors and the failed-submit state after a form reset.
 */
function resetAddTaskFieldValidation() {
  addTaskValidationAttempted = false;
  Object.entries(ADD_TASK_FIELD_VALIDATORS).forEach(([fieldId, validator]) => {
    setAddTaskFieldError(fieldId, validator.errorId, "");
  });
}
