const CONTACT_STORAGE_KEY = "joinContacts";
let activeContactId = "";


/**
 * Renders the alphabetically grouped contact list on the contacts page.
 */
function initContacts() {
  const contactsList = document.getElementById("contactsList");
  if (!contactsList) return;
  const contacts = getContacts();
  const groups = groupContactsByLetter(sortContactsByName(contacts));
  contactsList.innerHTML = Object.keys(groups)
  .map((letter) => getContactGroupTemplate(letter, groups[letter]))
  .join("");
  initContactDetails(contacts);
  initContactActions();
}


/**
 * Reads the locally saved contact list for the temporary localStorage step.
 */
function getContacts() {
  const storedContact = localStorage.getItem(CONTACT_STORAGE_KEY);
  return storedContact ? JSON.parse(storedContact) : [];
}


/**
 * Builds the avatar initials from the first and last name part.
 */
function getContactInitials(name) {
  const parts = name.split(" ");
  const initials = parts[0].charAt(0) + parts[parts.length - 1].charAt(0);
  return initials.toUpperCase();
}


/**
 * Returns a copy of the contact list sorted alphabetically by name.
 */
function sortContactsByName(contacts) {
  return [...contacts].sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Groups sorted contacts by the first letter of their name.
 */
function groupContactsByLetter(contacts) {
  const groups = {};
  for (const contact of contacts) {
    const letter = contact.name.charAt(0).toUpperCase();
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(contact);
  }
  return groups;
}


/**
 * Adds click handling to every contact list entry for opening its details.
 */
function initContactDetails(contacts) {
  document.querySelectorAll(".contacts-item").forEach((item) => {
    item.addEventListener("click", () => openContactDetail(item.dataset.contactId, contacts));
  });
}


/**
 * Writes the contact data into the static detail view elements.
 */
function fillContactDetail(contact) {
  const avatar = document.getElementById("contactDetailAvatar");
  avatar.textContent = getContactInitials(contact.name);
  avatar.style.backgroundColor = contact.color;
  document.getElementById("contactDetailName").textContent = contact.name;      
  document.getElementById("contactDetailPhone").textContent = contact.phone;    
  const email = document.getElementById("contactDetailEmail");                  
  email.textContent = contact.email;                                            
  email.href = "mailto:" + contact.email;                                       
}


/**
 * Looks up the clicked contact and shows its filled detail view.
 */
function openContactDetail(contactId, contacts) {
  const contact = contacts.find((currentContact) => currentContact.id === contactId);
  if (!contact) return;
  activeContactId = contact.id;
  fillContactDetail(contact);
  document.getElementById("contactDetail").hidden = false;
}

/**
 * Saves the complete contact list in localStorage.
 */
function saveContacts(contacts) {
  localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contacts));
}

/**
 * Removes the currently shown contact and refreshes the list.
 */
function deleteActiveContact() {
  const remainingContacts = getContacts().filter((contact) => contact.id !== activeContactId);
  saveContacts(remainingContacts);
  activeContactId = "";
  document.getElementById("contactDetail").hidden = true;
  initContacts();
  showContactToast("Contact successfully deleted");
}


/**
 * Wires the static contact controls once per page load.
 */
function initContactActions() {
  const deleteButton = document.getElementById("contactDeleteButton");
  if (!deleteButton || deleteButton.dataset.eventsReady === "true") return;
  deleteButton.addEventListener("click", deleteActiveContact);
  document.getElementById("contactEditButton").addEventListener("click", openContactEditDialog);
  document.getElementById("contactEditClose").addEventListener("click", closeContactEditDialog);
  document.getElementById("contactEditOverlay").addEventListener("click", handleContactOverlayClick);
  document.getElementById("contactEditForm").addEventListener("submit", handleContactEditSubmit);
  document.getElementById("contactEditDelete").addEventListener("click", handleContactEditDelete);
  deleteButton.dataset.eventsReady = "true";
}

/**
 * Opens the edit dialog prefilled with the active contact.
 */
function openContactEditDialog() {
  const contact = getContacts().find((currentContact) => currentContact.id === activeContactId);
  if (!contact) return;
  fillContactEditForm(contact);
  document.getElementById("contactEditOverlay").hidden = false;
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
 * Validates the edit form and saves the contact on success.
 */
function handleContactEditSubmit(event) {
  event.preventDefault();
  const errorMessage = getContactEditErrorMessage();
  document.getElementById("contactEditError").textContent = errorMessage;
  if (errorMessage) return;
  saveEditedContact();
}

/**
 * Returns the first validation error of the edit form or an empty string.
 */
function getContactEditErrorMessage() {
  const name = document.getElementById("contactEditName").value.trim();
  const email = document.getElementById("contactEditEmail").value.trim();
  const phone = document.getElementById("contactEditPhone").value.trim();
  if (!name) return "Please enter a name.";
  if (!email.includes("@") || !email.includes(".")) return "Please enter a valid email address.";
  if (!phone) return "Please enter a phone number.";
  return "";
}

/**
 * Combines the stored contact with the edited form values.
 */
function getEditedContact(contact) {
  return {
    ...contact,
    name: document.getElementById("contactEditName").value.trim(),
    email: document.getElementById("contactEditEmail").value.trim(),
    phone: document.getElementById("contactEditPhone").value.trim(),
  };
}

/**
 * Updates the active contact, refreshes the page and closes the dialog.
 */
function saveEditedContact() {
  const updatedContacts = getContacts().map((contact) =>
    contact.id === activeContactId ? getEditedContact(contact) : contact
  );
  saveContacts(updatedContacts);
  initContacts();
  openContactDetail(activeContactId, getContacts());
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
 * Shows a short feedback popup that hides itself after three seconds.
 */
function showContactToast(message) {
  const toast = document.getElementById("contactToast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  setTimeout(() => (toast.hidden = true), 3000);
}
