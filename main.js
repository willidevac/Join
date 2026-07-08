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
    // Protected route: requires the temporary dummy user until Firebase/Auth is added.
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

  if (shouldStartWithSignupTransition()) {
    await renderSignupWithTransition();
    return;
  }

  await renderCurrentPage();
}

async function renderCurrentPage(options = {}) {
  const page = getAuthorizedPage();
  const route = routes[page];
  const response = await fetch(route.template);

  document.title = route.title;
  renderPageContent(await response.text(), options.animate);
  initPage(page);
}

function renderPageContent(content, shouldAnimate) {
  const app = document.getElementById("app");
  const animatePage = Boolean(shouldAnimate);

  app.classList.toggle("app-view--entering", animatePage);
  app.classList.remove("app-view--visible");
  app.innerHTML = content;
  bindPageLinks();

  if (animatePage) {
    requestAnimationFrame(() => {
      app.classList.add("app-view--visible");
      app.classList.remove("app-view--entering");
    });
  }
}

function bindPageLinks() {
  document.querySelectorAll("[data-page]").forEach((link) => {
    link.addEventListener("click", handlePageLinkClick);
  });
}

function getValidPage() {
  const page = new URLSearchParams(window.location.search).get("page");
  return routes[page] ? page : "login";
}

function getAuthorizedPage() {
  const page = getValidPage();
  if (isProtectedPage(page) && !getStoredUser()) return redirectToLoginPage();
  return page;
}

function isProtectedPage(page) {
  return Boolean(routes[page].protected);
}

function redirectToLoginPage() {
  window.history.replaceState({}, "", "?page=login");
  return "login";
}

function handlePageLinkClick(event) {
  const target = event.target.nodeType === Node.ELEMENT_NODE
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

  if (pageTransitionRunning) {
    return;
  }

  if (shouldAnimateSignup) {
    window.history.pushState({}, "", `?${query.toString()}`);
    await renderSignupWithTransition();
    return;
  }

  window.history.pushState({}, "", `?${query.toString()}`);
  await renderCurrentPage({ animate: shouldAnimateSignup });
}

function initPage(page) {
  if (page === "login") initLoginValidation();
  if (page === "signup") initSignupValidation();
  if (page === "privacy-policy") initPrivacyLanguageSwitch();
}

window.navigateToPage = navigateToPage;

async function renderSignupWithTransition() {
  pageTransitionRunning = true;
  const loader = await createSignupTransitionLoader();

  setTransitionOverflow(true);
  document.body.append(loader);
  requestAnimationFrame(() => loader.classList.add("is-active"));

  try {
    await wait(signupTransition.renderDelay);
    await renderCurrentPage({ animate: true });
    await wait(signupTransition.exitDelay);
  } finally {
    removeTransitionLoader(loader);
    cleanSignupTransitionParam();
    pageTransitionRunning = false;
  }
}

function shouldStartWithSignupTransition() {
  const params = new URLSearchParams(window.location.search);
  return params.get("page") === "signup" && params.get("transition") === "signup";
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

async function createSignupTransitionLoader() {
  const response = await fetch(signupTransition.template);
  const wrapper = document.createElement("div");

  wrapper.innerHTML = await response.text();
  return wrapper.firstElementChild;
}

function wait(duration) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}
