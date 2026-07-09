/**
 * Loads an HTML template file and returns its first root element.
 */
async function createTemplateElement(templatePath) {
  const response = await fetch(templatePath);
  const wrapper = document.createElement("div");

  wrapper.innerHTML = await response.text();
  return wrapper.firstElementChild;
}
