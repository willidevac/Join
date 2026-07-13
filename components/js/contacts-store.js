const CONTACT_STORAGE_KEY = "joinContacts";


/**
 * Reads contacts from Firestore when available, otherwise from localStorage.
 */
async function loadContactsFromStore() {
  if (isContactFirestoreReady())
    return window.joinFirebaseContacts.loadContacts();
  return getLocalContacts();
}


/**
 * Creates one contact in Firestore or localStorage and returns it with an id.
 */
async function createContactInStore(contact) {
  if (isContactFirestoreReady())
    return window.joinFirebaseContacts.createContact(contact);
  const newContact = { id: Date.now().toString(), ...contact };
  saveLocalContacts([...getLocalContacts(), newContact]);
  return newContact;
}


/**
 * Updates one contact in Firestore or localStorage.
 */
async function updateContactInStore(contactId, contact) {
  if (isContactFirestoreReady()) {
    await window.joinFirebaseContacts.updateContact(contactId, contact);
    return;
  }
  const contacts = getLocalContacts().map((item) =>
    item.id === contactId ? { ...item, ...contact } : item,
  );
  saveLocalContacts(contacts);
}


/**
 * Deletes one contact from Firestore or localStorage.
 */
async function deleteContactFromStore(contactId) {
  if (isContactFirestoreReady()) {
    await window.joinFirebaseContacts.deleteContact(contactId);
    return;
  }
  saveLocalContacts(
    getLocalContacts().filter((contact) => contact.id !== contactId),
  );
}


/**
 * Checks whether the Firestore contact API is loaded and available.
 */
function isContactFirestoreReady() {
  return Boolean(window.joinFirebaseContacts);
}


/**
 * Reads and parses the stored contacts from localStorage.
 */
function getLocalContacts() {
  const storedContact = localStorage.getItem(CONTACT_STORAGE_KEY);
  return storedContact ? JSON.parse(storedContact) : [];
}


/**
 * Writes the given contact list as JSON into localStorage.
 */
function saveLocalContacts(contacts) {
  localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(contacts));
}
