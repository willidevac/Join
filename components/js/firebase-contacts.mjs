import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


/**
 * Loads all contacts from Firestore with the document id attached.
 */
async function loadContacts() {
  const db = window.joinFirestore;
  const snapshot = await getDocs(collection(db, "contacts"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}


/**
 * Creates one contact in Firestore and adds server timestamps.
 */
async function createContact(contact) {
  const db = window.joinFirestore;
  const contactRef = await addDoc(collection(db, "contacts"), {
    ...contact,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return { id: contactRef.id, ...contact };
}


/**
 * Creates the account contact under a stable id and removes email duplicates.
 */
async function upsertAccountContact(contactId, duplicateIds, contact) {
  const db = window.joinFirestore;
  return runTransaction(db, (transaction) =>
    saveAccountContact(transaction, db, contactId, duplicateIds, contact),
  );
}


async function saveAccountContact(
  transaction,
  db,
  contactId,
  duplicateIds,
  contact,
) {
  const accountRef = doc(db, "contacts", contactId);
  const snapshot = await transaction.get(accountRef);
  if (!snapshot.exists()) transaction.set(accountRef, getNewContactData(contact));
  deleteDuplicateContacts(transaction, db, duplicateIds, contactId);
  return snapshot.exists()
    ? { id: snapshot.id, ...snapshot.data() }
    : { id: contactId, ...contact };
}


function deleteDuplicateContacts(transaction, db, duplicateIds, accountId) {
  duplicateIds
    .filter((contactId) => contactId !== accountId)
    .forEach((contactId) => transaction.delete(doc(db, "contacts", contactId)));
}


function getNewContactData(contact) {
  return {
    ...contact,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}


/**
 * Updates one contact in Firestore without saving the local id field.
 */
async function updateContact(contactId, contact) {
  const db = window.joinFirestore;
  const { id, ...contactData } = contact;
  await updateDoc(doc(db, "contacts", contactId), {
    ...contactData,
    updatedAt: serverTimestamp(),
  });
}


/**
 * Deletes one contact from Firestore.
 */
async function deleteContact(contactId) {
  const db = window.joinFirestore;
  await deleteDoc(doc(db, "contacts", contactId));
}

window.joinFirebaseContacts = {
  loadContacts,
  createContact,
  upsertAccountContact,
  updateContact,
  deleteContact,
};
