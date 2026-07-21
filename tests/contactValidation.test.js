const assert = require("node:assert/strict");
const test = require("node:test");

const { loadBrowserScripts } = require("./helpers/scriptContext");

const context = loadBrowserScripts([
  "components/js/shared.js",
  "components/js/contactsDialog.js",
]);

const validContact = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "+49 123 456789",
};


test("accepts a contact email that passes signup validation", () => {
  assert.equal(context.getContactErrorMessage(validContact), "");
});


test("rejects an incomplete contact email", () => {
  const values = { ...validContact, email: "a@.." };
  assert.equal(
    context.getContactErrorMessage(values),
    "Please enter a valid email address.",
  );
});


test("shared email validation handles complete and incomplete addresses", () => {
  assert.equal(context.isEmailAddressValid("user.name+tag@example.co.uk"), true);
  assert.equal(context.isEmailAddressValid("a@.."), false);
});


test("rejects obviously invalid email punctuation locally", () => {
  const invalidEmails = [
    ".user@example.com", "user..name@example.com", "user@-example.com",
  ];
  invalidEmails.forEach((email) => {
    assert.equal(context.isEmailAddressValid(email), false);
  });
});


test("trims every contact form value before validation and storage", () => {
  const elements = {
    contactAddName: { value: "  Ada Lovelace  " },
    contactAddEmail: { value: "  ada@example.com  " },
    contactAddPhone: { value: "  +49 123 456789  " },
  };
  const document = { getElementById: (id) => elements[id] };
  const formContext = loadBrowserScripts([
    "components/js/shared.js", "components/js/contactsDialog.js",
  ], { document });
  assert.deepEqual(JSON.parse(JSON.stringify(formContext.getContactFormValues("contactAdd"))), validContact);
});


test("shows and clears contact email feedback after blur", () => {
  const elements = createContactValidationElements();
  const document = { getElementById: (id) => elements[id] };
  const formContext = loadBrowserScripts([
    "components/js/shared.js", "components/js/contactsDialog.js",
  ], { document });
  formContext.handleContactValidationEvent({ type: "focusout", target: elements.contactAddEmail }, "contactAdd");
  assert.equal(elements.contactAddEmailError.textContent, "Please enter a valid email address.");
  elements.contactAddEmail.value = "ada@example.com";
  formContext.handleContactValidationEvent({ type: "input", target: elements.contactAddEmail }, "contactAdd");
  assert.equal(elements.contactAddEmailError.textContent, "");
});


/** Creates observable fields and messages for contact blur validation. */
function createContactValidationElements() {
  const field = (id, value) => ({
    id, value, attributes: {},
    getAttribute(name) { return this.attributes[name]; },
    setAttribute(name, nextValue) { this.attributes[name] = nextValue; },
  });
  return {
    contactAddEmail: field("contactAddEmail", "invalid-email"),
    contactAddEmailError: { textContent: "" },
    contactAddError: { textContent: "Stored error" },
  };
}
