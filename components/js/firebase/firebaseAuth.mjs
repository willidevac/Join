import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
const app = initializeApp(window.joinFirebaseConfig);
const auth = getAuth(app);
const authPersistenceReady = setPersistence(auth, browserLocalPersistence);
const authReady = authPersistenceReady.then(watchFirebaseAuthState);


/**
 * Creates a Firebase user with email/password and stores the display name.
 */
async function registerFirebaseUser(name, email, password) {
  await authPersistenceReady;
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(userCredential.user, { displayName: name });
  return getStoredFirebaseUser(userCredential.user, "firebase-signup");
}


/**
 * Signs in an existing Firebase user with email and password.
 */
async function loginFirebaseUser(email, password) {
  await authPersistenceReady;
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return getStoredFirebaseUser(userCredential.user, "firebase-login");
}


/**
 * Creates an anonymous Firebase session for the guest login.
 */
async function loginGuestFirebaseUser() {
  await authPersistenceReady;
  const userCredential = await signInAnonymously(auth);
  return getStoredFirebaseUser(userCredential.user, "firebase-guest");
}


/**
 * Ends the current Firebase session.
 */
async function logoutFirebaseUser() {
  await signOut(auth);
}


/**
 * Waits for Firebase to tell us whether a user is logged in or logged out.
 */
function watchFirebaseAuthState() {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      syncStoredFirebaseUser(user);
      resolve(user);
    });
  });
}


/**
 * Mirrors the Firebase auth state into localStorage for the existing router.
 */
function syncStoredFirebaseUser(user) {
  if (!user) {
    clearStoredUser();
    return;
  }
  saveStoredUser(getStoredFirebaseUser(user, getFirebaseUserType(user)));
}


/**
 * Marks anonymous users as guests and regular Firebase users as normal users.
 */
function getFirebaseUserType(user) {
  return user.isAnonymous ? "firebase-guest" : "firebase-user";
}


/**
 * Converts the Firebase user object into the small user object used by Join.
 */
function getStoredFirebaseUser(user, type) {
  return {
    name: user.displayName || user.email || "Guest",
    email: user.email || "",
    uid: user.uid,
    type,
  };
}


window.joinFirebaseAuth = {
  loginFirebaseUser,
  loginGuestFirebaseUser,
  logoutFirebaseUser,
  registerFirebaseUser,
  waitForAuthReady: () => authReady,
};
