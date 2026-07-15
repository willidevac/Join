let categoryOutsideClickReady = false;

/**
 * Prepares the single-select category dropdown of the add-task form.
 */
function initAddTaskCategory() {
  bindCategoryDropdown();
  bindCategoryOptions();
}


/**
 * Wires dropdown opening once and keeps the document outside-click listener unique.
 */
function bindCategoryDropdown() {
  getCategoryButton().addEventListener("click", toggleCategoryDropdown);
  if (categoryOutsideClickReady) return;
  document.addEventListener("click", closeCategoryDropdownOnOutsideClick);
  categoryOutsideClickReady = true;
}


/**
 * Registers the click handling for every static category option.
 */
function bindCategoryOptions() {
  getCategoryPanel().querySelectorAll("[data-category-value]").forEach((option) => {
    option.addEventListener("click", () => selectAddTaskCategory(option));
  });
}


/**
 * Applies a picked category to the hidden input, button text and option list.
 * @param {HTMLElement} option - The clicked category option.
 */
function selectAddTaskCategory(option) {
  getCategoryInput().value = option.dataset.categoryValue;
  getCategoryButton().textContent = option.textContent.trim();
  markSelectedCategoryOption(option);
  setCategoryDropdownOpen(false);
  handleAddTaskValidationChange("taskCategory");
  handleAddTaskFormChange();
}


/**
 * Highlights the picked option inside the panel.
 * @param {HTMLElement|null} selectedOption - The option to mark, or null to clear.
 */
function markSelectedCategoryOption(selectedOption) {
  getCategoryPanel().querySelectorAll("[data-category-value]").forEach((option) => {
    option.classList.toggle("is-selected", option === selectedOption);
  });
}


/**
 * Opens or closes the dropdown from the trigger button.
 */
function toggleCategoryDropdown() {
  setCategoryDropdownOpen(getCategoryPanel().hidden);
}


/**
 * Closes the dropdown when the user clicks outside of the component.
 * @param {MouseEvent} event - Document click event.
 */
function closeCategoryDropdownOnOutsideClick(event) {
  const dropdown = getCategoryDropdown();
  if (dropdown && !dropdown.contains(event.target)) setCategoryDropdownOpen(false);
}


/**
 * Applies the visual and accessibility state for the category dropdown.
 * @param {boolean} isOpen - True to open, false to close the dropdown.
 */
function setCategoryDropdownOpen(isOpen) {
  getCategoryDropdown().classList.toggle("is-open", isOpen);
  getCategoryPanel().hidden = !isOpen;
  getCategoryButton().setAttribute("aria-expanded", String(isOpen));
}


/**
 * Clears the category selection after form reset or successful task creation.
 */
function resetAddTaskCategory() {
  getCategoryInput().value = "";
  getCategoryButton().textContent = "Select task category";
  markSelectedCategoryOption(null);
  setCategoryDropdownOpen(false);
}


/**
 * @returns {HTMLElement} The category dropdown container.
 */
function getCategoryDropdown() {
  return document.getElementById("taskCategoryDropdown");
}


/**
 * @returns {HTMLElement} The button that toggles the category dropdown.
 */
function getCategoryButton() {
  return document.getElementById("taskCategoryButton");
}


/**
 * @returns {HTMLElement} The panel that lists the category options.
 */
function getCategoryPanel() {
  return document.getElementById("taskCategoryPanel");
}


/**
 * @returns {HTMLElement} The hidden input that stores the picked category.
 */
function getCategoryInput() {
  return document.getElementById("taskCategory");
}
