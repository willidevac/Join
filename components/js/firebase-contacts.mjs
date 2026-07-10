import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";


/**
 * Loads all contacts from Firestore with the document id attached.
 */
async function loadContacts() {
  const db = window.joinFirestore;
  const snapshot = await getDocs(collection(db, "contacts"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

window.joinFirebaseContacts = { loadContacts };
