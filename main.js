const routes = {
  login: {
    title: "Join | Log in",
    template: "./components/html/pages/login.html",
  },
  signup: {
    title: "Join | Sign up",
    template: "./components/html/pages/signup.html",
  },
  "privacy-policy": {
    title: "Join | Privacy Policy",
    template: "./components/html/pages/privacy-policy.html",
  },
  "legal-notice": {
    title: "Join | Legal Notice",
    template: "./components/html/pages/legal-notice.html",
  },
  summary: {
    title: "Join | Summary",
    template: "./components/html/pages/summary.html",
    protected: true,
  },
  "add-task": {
    title: "Join | Add Task",
    template: "./components/html/pages/add-task.html",
    protected: true,
  },
  board: {
    title: "Join | Board",
    template: "./components/html/pages/board.html",
    protected: true,
  },
  contacts: {
    title: "Join | Contacts",
    template: "./components/html/pages/contacts.html",
    protected: true,
  },
  help: {
    title: "Join | Help",
    template: "./components/html/pages/help.html",
    protected: true,
  },
};

const signupTransition = {
  renderDelay: 240,
  exitDelay: 600,
  template: "./components/html/molecules/signup-transition-loader.html",
};

let pageTransitionRunning = false;

document.addEventListener("DOMContentLoaded", initApp);
window.addEventListener("popstate", () => renderCurrentPage());

async function initApp() {
  document.addEventListener("click", handlePageLinkClick);

  if (shouldStartWithSignupTransition() || shouldStartWithLoginTransition()) {
    await renderSignupWithTransition();
    return;
  }

  await renderCurrentPage();
}

async function renderCurrentPage(options = {}) {
  await waitForFirebaseAuth();
  const page = getAuthorizedPage();
  const route = routes[page];
  const response = await fetch(route.template);

  document.title = route.title;
  await renderPageContent(await response.text(), options.animate, page);
  await initPage(page);
}

async function renderPageContent(content, shouldAnimate, page) {
  const app = document.getElementById("app");
  const animatePage = Boolean(shouldAnimate);

  preparePageAnimation(app, animatePage);
  app.innerHTML = content;
  await hydrateHtmlIncludes(app);
  setActiveNavigation(page);
  showRenderedPage(app, animatePage);
}

function preparePageAnimation(app, animatePage) {
  app.classList.toggle("app-view--entering", animatePage);
  app.classList.remove("app-view--visible");
}

async function hydrateHtmlIncludes(root) {
  let includes = [...root.querySelectorAll("[data-include]")];

  while (includes.length) {
    await Promise.all(includes.map(replaceHtmlInclude));
    includes = [...root.querySelectorAll("[data-include]")];
  }
}

async function replaceHtmlInclude(placeholder) {
  const response = await fetch(placeholder.dataset.include);
  placeholder.outerHTML = await response.text();
}

function setActiveNavigation(page) {
  document.querySelectorAll(".summary-nav__item").forEach((link) => {
    link.classList.toggle("summary-nav__item--active", link.dataset.page === page);
  });
}

function showRenderedPage(app, animatePage) {
  if (!animatePage) return;

  requestAnimationFrame(() => {
    app.classList.add("app-view--visible");
    app.classList.remove("app-view--entering");
  });
}

function getValidPage() {
  const page = new URLSearchParams(window.location.search).get("page");
  return routes[page] ? page : "login";
}

function getAuthorizedPage() {
  const page = getValidPage();
  if (isProtectedPage(page) && !isUserAuthenticated())
    return redirectToLoginPage();
  return page;
}

function isUserAuthenticated() {
  return Boolean(getStoredUser());
}

async function waitForFirebaseAuth() {
  if (window.joinFirebaseReady) await window.joinFirebaseReady;
}

/**
 * Reads the route config and tells whether a page needs login.
 */
function isProtectedPage(page) {
  return Boolean(routes[page].protected);
}

/**
 * Replaces the URL with the login page when access is not allowed.
 */
function redirectToLoginPage() {
  window.history.replaceState({}, "", "?page=login");
  return "login";
}

function handlePageLinkClick(event) {
  const target =
    event.target.nodeType === Node.ELEMENT_NODE
      ? event.target
      : event.target.parentElement;
  const link = target.closest("[data-page]");

  if (!link) {
    return;
  }

  event.preventDefault();
  navigateToPage(link.dataset.page, getLinkParams(link));
}

function getLinkParams(link) {
  if (link.dataset.transition === "signup") {
    return { transition: "signup" };
  }

  if (link.dataset.privacyOpened !== "true") {
    return {};
  }

  return { privacy: "opened" };
}

async function navigateToPage(page, params = {}) {
  const query = new URLSearchParams({ page, ...params });
  const shouldAnimateSignup = page === "signup" && getValidPage() !== "signup";

  if (pageTransitionRunning) return;

  if (shouldAnimateSignup) {
    await navigateWithSignupTransition(query);
    return;
  }

  window.history.pushState({}, "", `?${query.toString()}`);
  await renderCurrentPage({ animate: shouldAnimateSignup });
}

async function navigateWithSignupTransition(query) {
  window.history.pushState({}, "", `?${query.toString()}`);
  await renderSignupWithTransition();
}

async function initPage(page) {
  if (page === "login") initLoginValidation();
  if (page === "signup") initSignupValidation();
  if (page === "contacts") await initContacts();
  if (usesAppShell(page)) initSummaryUser();
  if (page === "summary") initSummaryMetrics();
  if (page === "add-task") initAddTaskValidation();
  if (page === "board") initBoardTasks();
  if (page === "privacy-policy") initPrivacyLanguageSwitch();
}

function usesAppShell(page) {
  return ["summary", "add-task", "board", "contacts", "help"].includes(page);
}


window.navigateToPage = navigateToPage;

async function renderSignupWithTransition() {
  pageTransitionRunning = true;
  const loader = await createSignupTransitionLoader();

  showTransitionLoader(loader);

  try {
    await wait(signupTransition.renderDelay);
    await renderCurrentPage({ animate: true });
    await wait(signupTransition.exitDelay);
  } finally {
    finishSignupTransition(loader);
  }
}

function finishSignupTransition(loader) {
  removeTransitionLoader(loader);
  cleanSignupTransitionParam();
  pageTransitionRunning = false;
}

function showTransitionLoader(loader) {
  setTransitionOverflow(true);
  document.body.append(loader);
  requestAnimationFrame(() => loader.classList.add("is-active"));
}

function shouldStartWithSignupTransition() {
  const params = new URLSearchParams(window.location.search);
  return (
    params.get("page") === "signup" && params.get("transition") === "signup"
  );
}

/**
 * Tells whether the intro transition should run for a fresh login page load.
 */
function shouldStartWithLoginTransition() {
  return getValidPage() === "login";
}

function cleanSignupTransitionParam() {
  const params = new URLSearchParams(window.location.search);

  if (params.get("transition") !== "signup") {
    return;
  }

  params.delete("transition");
  window.history.replaceState({}, "", `?${params.toString()}`);
}

function removeTransitionLoader(loader) {
  loader.classList.add("is-leaving");
  setTimeout(() => {
    loader.remove();
    setTransitionOverflow(false);
  }, 180);
}

function setTransitionOverflow(isLocked) {
  document.documentElement.classList.toggle("is-page-transitioning", isLocked);
  document.body.classList.toggle("is-page-transitioning", isLocked);
}

function createSignupTransitionLoader() {
  return createTemplateElement(signupTransition.template);
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
