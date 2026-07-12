const CONTACT_COLORS = ["#FF7A00", "#9327FF", "#6E52FF", "#FC71FF", "#FFBB2B", "#1FD7C1", "#FF4646", "#00BEE8", "#FF745E", "#0038FF"];


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
  const contact = activeContacts.find((currentContact) => currentContact.id === activeContactId);
  if (!contact) return;
  fillContactEditForm(contact);
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
  const values = getContactFormValues("contactEdit");
  const errorMessage = getContactErrorMessage(values);
  document.getElementById("contactEditError").textContent = errorMessage;
  if (errorMessage) return;
  setSubmitButtonDisabled(event.target, true);
  try {
    await saveEditedContact();
  } catch (error) {
    document.getElementById("contactEditError").textContent = "Contact could not be saved.";
  } finally {
    setSubmitButtonDisabled(event.target, false);
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
  const contact = activeContacts.find((currentContact) => currentContact.id === activeContactId);
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
  const values = getContactFormValues("contactAdd");
  const errorMessage = getContactErrorMessage(values);
  document.getElementById("contactAddError").textContent = errorMessage;
  if (errorMessage) return;
  setSubmitButtonDisabled(event.target, true);
  try {
    await createContact(values);
  } catch (error) {
    document.getElementById("contactAddError").textContent = "Contact could not be created.";
  } finally {
    setSubmitButtonDisabled(event.target, false);
  }
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
  return CONTACT_COLORS[Math.floor(Math.random() * CONTACT_COLORS.length)];
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
  if (!values.email.includes("@") || !values.email.includes(".")) return "Please enter a valid email address.";
  if (!values.phone) return "Please enter a phone number.";
  return "";
}


/**
 * Enables or disables the submit button of the given form.
 */
function setSubmitButtonDisabled(form, isDisabled) {
  form.querySelector('button[type="submit"]').disabled = isDisabled;
}
