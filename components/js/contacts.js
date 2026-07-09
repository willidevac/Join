const CONTACT_STORAGE_KEY = "joinContacts";

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
  fillContactDetail(contact);
  document.getElementById("contactDetail").hidden = false;
}


