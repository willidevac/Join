/**
 * Returns the list item markup for a single contact.
 */
function getContactItemTemplate(contact) {
  const fullName = escapeHtmlText(contact.name);
  const shortName = escapeHtmlText(getAbbreviatedContactName(contact.name));

  return `
  <li class="contacts-item" data-contact-id="${contact.id}">
    <span
      class="contacts-item-avatar"
      style="background-color: ${contact.color}"
    >
      ${getInitials(contact.name)}
    </span>
    <div class="contacts-item-info">
      <p class="contacts-item-name" title="${fullName}">
        <span class="contacts-item-name__full">${fullName}</span>
        <span class="contacts-item-name__short">
          ${shortName}
        </span>
      </p>
      <a class="contacts-item-email">${escapeHtmlText(contact.email)}</a>
    </div>
  </li>
  `;
}


/**
 * Loads an HTML template file and returns its first root element.
 */
async function createTemplateElement(templatePath) {
  const response = await fetch(templatePath);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = await response.text();
  return wrapper.firstElementChild;
}


/**
 * Abbreviates every name part after the first name.
 * @param {string} name - Complete contact name.
 * @returns {string} Short name for the mobile contact list.
 */
function getAbbreviatedContactName(name) {
  const nameParts = normalizeText(name).split(/\s+/).filter(Boolean);
  if (nameParts.length < 2) return nameParts[0] || "";
  const initials = nameParts
    .slice(1)
    .map((namePart) => `${namePart.charAt(0).toUpperCase()}.`);
  return `${nameParts[0]} ${initials.join(" ")}`;
}


/**
 * Returns one letter section with its contact list items.
 */
function getContactGroupTemplate(letter, contacts) {
  return `
  <li class="contacts-group">
    <span class="contacts-group-letter">${letter}</span>
    <ul class="contacts-group-list">${contacts.map(getContactItemTemplate).join("")}</ul>
  </li>`;
}
