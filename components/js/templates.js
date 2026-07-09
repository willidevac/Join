function getContactItemTemplate(contact) {
  return `
  <li class="contacts-item" data-contact-id="${contact.id}">
    <span
      class="contacts-item-avatar"
      style="background-color: ${contact.color}"
    >
      ${getContactInitials(contact.name)}
    </span>
    <div class="contacts-item-info">
      <p class="contacts-item-name">${escapeHtmlText(contact.name)}</p>
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

function getContactGroupTemplate(letter, contacts) {
  return `
  <li class="contacts-group">
    <span class="contacts-group-letter">${letter}</span>
    <ul class="contacts-group-list">${contacts.map(getContactItemTemplate).join("")}</ul>
  </li>`;
}
