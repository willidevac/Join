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

document.addEventListener("DOMContentLoaded", initApp);
window.addEventListener("popstate", () => renderCurrentPage());

async function initApp() {
  document.addEventListener("click", handlePageLinkClick);
  await renderCurrentPage();
}

async function renderCurrentPage() {
  const page = getAuthorizedPage();
  const route = routes[page];
  const response = await fetch(route.template);

  document.title = route.title;
  document.getElementById("app").innerHTML = await response.text();
  initPage(page);
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
  const link = event.target.closest("[data-page]");

  if (!link) {
    return;
  }

  event.preventDefault();
  navigateToPage(link.dataset.page, getLinkParams(link));
}

function getLinkParams(link) {
  if (link.dataset.privacyOpened !== "true") {
    return {};
  }

  return { privacy: "opened" };
}

async function navigateToPage(page, params = {}) {
  const query = new URLSearchParams({ page, ...params });

  window.history.pushState({}, "", `?${query.toString()}`);
  await renderCurrentPage();
}

function initPage(page) {
  if (page === "login") initLoginValidation();
  if (page === "signup") initSignupValidation();
  if (page === "privacy-policy") initPrivacyLanguageSwitch();
}

window.navigateToPage = navigateToPage;
