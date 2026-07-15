let activeContactId = "";
let activeContacts = [];


/**
 * Renders the alphabetically grouped contact list on the contacts page.
 */
async function initContacts() {
  const contactsList = document.getElementById("contactsList");
  if (!contactsList) return;
  initContactActions();
  activeContacts = await getContactsSafely();
  const groups = groupContactsByLetter(sortContactsByName(activeContacts));
  contactsList.innerHTML = Object.keys(groups)
    .map((letter) => getContactGroupTemplate(letter, groups[letter]))
    .join("");
  initContactDetails(activeContacts);
}


/**
 * Reads contacts through the store layer and keeps the active list in memory.
 */
async function getContacts() {
  activeContacts = await loadContactsFromStore(showAccountContactError);
  return activeContacts;
}


/**
 * Shows feedback if only the signed-in account contact could not be added.
 */
function showAccountContactError() {
  showContactToast("Your account contact could not be loaded.");
}


/**
 * Keeps the contacts page usable if Firestore cannot load contacts.
 */
async function getContactsSafely() {
  try {
    return await getContacts();
  } catch (error) {
    showContactToast("Contacts could not be loaded.");
    return [];
  }
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
    item.addEventListener("click", () =>
      openContactDetail(item.dataset.contactId, contacts),
    );
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
  updateAccountContactActions(contact);
}


/**
 * Hides the delete action while the own account contact is shown.
 * @param {Object} contact - The contact shown in the detail view.
 */
function updateAccountContactActions(contact) {
  document.getElementById("contactDeleteButton").hidden =
    isOwnAccountContact(contact);
}


/**
 * Returns the contact that is currently selected in the detail view.
 */
function getActiveContact() {
  return activeContacts.find(
    (currentContact) => currentContact.id === activeContactId,
  );
}


/**
 * Looks up the clicked contact and shows its filled detail view.
 */
function openContactDetail(contactId, contacts = activeContacts) {
  const contact = contacts.find(
    (currentContact) => currentContact.id === contactId,
  );
  if (!contact) return;
  activeContactId = contact.id;
  markActiveContactItem(contact.id);
  fillContactDetail(contact);
  document.getElementById("contactDetail").hidden = false;
  setMobileDetailView(true);
}


/**
 * Hides the contact detail view and clears the active selection.
 */
function closeContactDetail() {
  activeContactId = "";
  document.getElementById("contactDetail").hidden = true;
  setMobileDetailView(false);
}


/**
 * Removes the shown contact unless it is the own account contact.
 */
async function deleteActiveContact() {
  const contact = getActiveContact();
  if (!contact) return;
  if (isOwnAccountContact(contact)) {
    showContactToast("Your account contact cannot be deleted.");
    return;
  }
  try {
    await performContactDeletion(contact);
  } catch (error) {
    showContactToast("Contact could not be deleted.");
  }
}


/**
 * Deletes the contact, cleans its task assignments and refreshes the list.
 * @param {Object} contact - The contact to delete.
 */
async function performContactDeletion(contact) {
  await deleteContactFromStore(contact.id);
  await removeContactFromTasks(contact.name);
  closeContactDetail();
  await initContacts();
  showContactToast("Contact successfully deleted");
}


/**
 * Removes a deleted contact from the assignee list of all tasks.
 */
async function removeContactFromTasks(contactName) {
  const tasks = await loadTasksFromStore();
  const affectedTasks = tasks.filter(
    (task) =>
      Array.isArray(task.assignedTo) && task.assignedTo.includes(contactName),
  );
  await Promise.all(
    affectedTasks.map((task) =>
      updateTaskInStore(removeAssigneeFromTask(task, contactName)),
    ),
  );
}


/**
 * Returns a task copy without the given contact in its assignee list.
 */
function removeAssigneeFromTask(task, contactName) {
  return {
    ...task,
    assignedTo: task.assignedTo.filter((name) => name !== contactName),
  };
}


/**
 * Wires the static contact controls once per page load.
 */
function initContactActions() {
  const deleteButton = document.getElementById("contactDeleteButton");
  if (!deleteButton || deleteButton.dataset.eventsReady === "true") return;
  deleteButton.addEventListener("click", deleteActiveContact);
  initContactEditEvents();
  initContactAddEvents();
  initContactViewEvents();
  deleteButton.dataset.eventsReady = "true";
}


/**
 * Highlights the selected contact entry in the list.
 */
function markActiveContactItem(contactId) {
  document.querySelectorAll(".contacts-item").forEach((item) => {
    item.classList.toggle(
      "contacts-item--active",
      item.dataset.contactId === contactId,
    );
  });
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


/**
 * Switches the mobile layout between list and detail view and closes the actions menu.
 */
function setMobileDetailView(isOpen) {
  const content = document.querySelector(".contacts-content");
  content.classList.toggle("contacts-content--detail", isOpen);
  closeContactMenu();
}


/**
 * Wires the mobile-only view controls (back arrow and both FABs).
 */
function initContactViewEvents() {
  document
    .getElementById("contactBackButton")
    .addEventListener("click", () => setMobileDetailView(false));
  document
    .getElementById("contactAddFab")
    .addEventListener("click", openContactAddDialog);
  document
    .getElementById("contactMenuFab")
    .addEventListener("click", toggleContactMenu);
}


/**
 * Shows or hides the edit/delete actions behind the mobile menu fab.
 */
function toggleContactMenu() {
  const actions = document.querySelector(".contacts-detail-actions");
  actions.classList.toggle("contacts-detail-actions--open");
}


/**
 * Closes the mobile edit/delete menu if it is open.
 */
function closeContactMenu() {
  const actions = document.querySelector(".contacts-detail-actions");
  actions.classList.remove("contacts-detail-actions--open");
}
