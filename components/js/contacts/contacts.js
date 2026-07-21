let activeContactId = "";
let activeContacts = [];


/**
 * Renders the alphabetically grouped contact list on the contacts page.
 */
async function initContacts() {
  const contactsList = document.getElementById("contactsList");
  if (!contactsList) return;
  initContactActions();
  activeContacts = await loadSortedContactsSafely(
    showAccountContactError,
    () => showTimedFeedback("contactToast", "Contacts could not be loaded."),
  );
  const groups = groupContactsByLetter(sortContactsByName(activeContacts));
  contactsList.innerHTML = Object.keys(groups)
    .map((letter) => getContactGroupTemplate(letter, groups[letter]))
    .join("");
  initContactDetails(activeContacts);
}


/**
 * Shows feedback if only the signed-in account contact could not be added.
 */
function showAccountContactError() {
  showTimedFeedback("contactToast", "Your account contact could not be loaded.");
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
  avatar.textContent = getInitials(contact.name);
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
    showTimedFeedback("contactToast", "Your account contact cannot be deleted.");
    return;
  }
  try {
    await performContactDeletion(contact);
  } catch (error) {
    showTimedFeedback("contactToast", "Contact could not be deleted.");
  }
}


/**
 * Deletes the contact, cleans its task assignments and refreshes the list.
 * @param {Object} contact - The contact to delete.
 */
async function performContactDeletion(contact) {
  const updatedTasks = await getTasksWithoutContact(contact);
  await deleteContactFromStore(contact.id, updatedTasks);
  closeContactDetail();
  await initContacts();
  showTimedFeedback("contactToast", "Contact successfully deleted");
}


/**
 * Builds updated versions of tasks assigned to the deleted contact.
 * @param {Object} contact - The contact to remove from task assignments.
 * @returns {Promise<Object[]>} Changed tasks ready for persistence.
 */
async function getTasksWithoutContact(contact) {
  const tasks = await loadTasksFromStore();
  return tasks
    .filter((task) => hasContactAssignment(task, contact))
    .map((task) => removeAssigneeFromTask(task, contact));
}


/**
 * Checks whether one task is assigned to the given contact.
 */
function hasContactAssignment(task, contact) {
  return getTaskAssigneeReferences(task.assignedTo).some((assignee) =>
    isTaskAssigneeContact(assignee, contact),
  );
}


/**
 * Returns a task copy without the given contact in its assignee list.
 */
function removeAssigneeFromTask(task, contact) {
  return {
    ...task,
    assignedTo: getTaskAssigneeReferences(task.assignedTo).filter(
      (assignee) => !isTaskAssigneeContact(assignee, contact),
    ),
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
