/**
 * Wires the edit dialog controls.
 */
function initContactEditEvents() {
  document.getElementById("contactEditButton").addEventListener("click", openContactEditDialog);
  document.getElementById("contactEditClose").addEventListener("click", closeContactEditDialog);
  document.getElementById("contactEditOverlay").addEventListener("click", handleContactOverlayClick);
  document.getElementById("contactEditForm").addEventListener("submit", handleContactEditSubmit);
  document.getElementById("contactEditDelete").addEventListener("click", handleContactEditDelete);
}


/**
 * Wires the add dialog controls.
 */
function initContactAddEvents() {
  document.getElementById("contactAddButton").addEventListener("click", openContactAddDialog);
  document.getElementById("contactAddClose").addEventListener("click", closeContactAddDialog);
  document.getElementById("contactAddCancel").addEventListener("click", closeContactAddDialog);
  document.getElementById("contactAddOverlay").addEventListener("click", handleContactAddOverlayClick);
  document.getElementById("contactAddForm").addEventListener("submit", handleContactAddSubmit);
}


/**
 * Opens the edit dialog prefilled with the active contact.
 */
function openContactEditDialog() {
  const contact = getActiveContact();
  if (!contact) return;
  fillContactEditForm(contact);
  document.getElementById("contactEditDelete").hidden =
    isOwnAccountContact(contact);
  document.getElementById("contactEditOverlay").hidden = false;
  closeContactMenu();
}


/**
 * Hides the edit contact dialog.
 */
function closeContactEditDialog() {
  document.getElementById("contactEditOverlay").hidden = true;
}


/**
 * Closes the dialog only when the dark backdrop itself is clicked.
 */
function handleContactOverlayClick(event) {
  if (event.target === document.getElementById("contactEditOverlay")) closeContactEditDialog();
}


/**
 * Writes the contact data into the edit form fields.
 */
function fillContactEditForm(contact) {
  const avatar = document.getElementById("contactEditAvatar");
  avatar.textContent = getContactInitials(contact.name);
  avatar.style.backgroundColor = contact.color;
  document.getElementById("contactEditName").value = contact.name;
  document.getElementById("contactEditEmail").value = contact.email;
  document.getElementById("contactEditPhone").value = contact.phone;
}


/**
 * Validates the edit form and saves the contact while the submit button is disabled.
 */
async function handleContactEditSubmit(event) {
  event.preventDefault();
  if (!getValidatedContactValues("contactEdit")) return;
  await submitContactForm(
    event.target,
    "contactEditError",
    "Contact could not be saved.",
    saveEditedContact,
  );
}


/**
 * Reads the form values, shows a validation error and returns the values.
 * @param {string} prefix - The form field id prefix, e.g. "contactEdit".
 * @returns {Object|null} The entered values, or null when they are invalid.
 */
function getValidatedContactValues(prefix) {
  const values = getContactFormValues(prefix);
  const errorMessage = getContactErrorMessage(values);
  document.getElementById(`${prefix}Error`).textContent = errorMessage;
  return errorMessage ? null : values;
}


/**
 * Runs a save action with the submit button disabled and shows save errors.
 * @param {HTMLFormElement} form - The submitted contact form.
 * @param {string} errorId - The id of the error output element.
 * @param {string} failMessage - The message shown when saving fails.
 * @param {Function} action - The async save action to run.
 */
async function submitContactForm(form, errorId, failMessage, action) {
  setSubmitButtonDisabled(form, true);
  try {
    await action();
  } catch (error) {
    document.getElementById(errorId).textContent = failMessage;
  } finally {
    setSubmitButtonDisabled(form, false);
  }
}


/**
 * Combines the stored contact with the edited form values.
 */
function getEditedContact(contact) {
  return { ...contact, ...getContactFormValues("contactEdit") };
}


/**
 * Updates the active contact, refreshes the page and closes the dialog.
 */
async function saveEditedContact() {
  const contact = getActiveContact();
  if (!contact) return;
  await updateContactInStore(activeContactId, getEditedContact(contact));
  await initContacts();
  openContactDetail(activeContactId);
  closeContactEditDialog();
  showContactToast("Contact successfully edited");
}


/**
 * Deletes the active contact from the edit dialog.
 */
function handleContactEditDelete() {
  closeContactEditDialog();
  deleteActiveContact();
}


/**
 * Opens the add dialog with cleared form fields.
 */
function openContactAddDialog() {
  document.getElementById("contactAddForm").reset();
  document.getElementById("contactAddError").textContent = "";
  document.getElementById("contactAddOverlay").hidden = false;
}


/**
 * Hides the add contact dialog.
 */
function closeContactAddDialog() {
  document.getElementById("contactAddOverlay").hidden = true;
}


/**
 * Closes the add dialog only when the dark backdrop itself is clicked.
 */
function handleContactAddOverlayClick(event) {
  if (event.target === document.getElementById("contactAddOverlay")) closeContactAddDialog();
}


/**
 * Validates the add form and creates the contact while the submit button is disabled.
 */
async function handleContactAddSubmit(event) {
  event.preventDefault();
  const values = getValidatedContactValues("contactAdd");
  if (!values) return;
  await submitContactForm(
    event.target,
    "contactAddError",
    "Contact could not be created.",
    () => createContact(values),
  );
}


/**
 * Creates a new contact, saves it and opens its detail view.
 */
async function createContact(values) {
  const newContact = await createContactInStore({ color: getRandomContactColor(), ...values });
  await initContacts();
  openContactDetail(newContact.id);
  closeContactAddDialog();
  showContactToast("Contact successfully created");
}


/**
 * Picks a random avatar color for a new contact.
 */
function getRandomContactColor() {
  return contactColors[Math.floor(Math.random() * contactColors.length)];
}


/**
 * Reads the trimmed form values for the given dialog id prefix.
 */
function getContactFormValues(idPrefix) {
  return {
    name: document.getElementById(idPrefix + "Name").value.trim(),
    email: document.getElementById(idPrefix + "Email").value.trim(),
    phone: document.getElementById(idPrefix + "Phone").value.trim(),
  };
}


/**
 * Returns the first validation error of the given values or an empty string.
 */
function getContactErrorMessage(values) {
  if (!values.name) return "Please enter a name.";
  if (!isEmailAddressValid(values.email)) return "Please enter a valid email address.";
  if (!values.phone) return "Please enter a phone number.";
  return "";
}


/**
 * Enables or disables the submit button of the given form.
 */
function setSubmitButtonDisabled(form, isDisabled) {
  form.querySelector('button[type="submit"]').disabled = isDisabled;
}
