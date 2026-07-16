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
