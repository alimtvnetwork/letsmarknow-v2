/**
 * LetsMarkNow Extension Content Script
 * Synchronizes authentication sessions between the Chrome extension and the web dashboard.
 * Runs on matching web surfaces (localhost, 127.0.0.1, letsmarknow.com).
 */

const AUTH_STORAGE_KEY = "lmn_auth_session_v1";
let lastSyncedToken: string | null = null;

function syncAuthFromExtension(): void {
  if (typeof chrome === "undefined" || !chrome.storage?.local) return;

  chrome.storage.local.get([AUTH_STORAGE_KEY], (res) => {
    const session = res?.[AUTH_STORAGE_KEY];
    if (session && session.access_token && session.account_id) {
      if (session.access_token === lastSyncedToken) return;
      lastSyncedToken = session.access_token;

      // Dispatches to web dashboard auth listener
      window.postMessage({ type: "LMN_AUTH_SYNC_EVENT", session }, "*");

      try {
        window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      } catch {
        // Storage access may be restricted
      }
    }
  });
}

// Initial sync upon script execution
syncAuthFromExtension();

// Ensure extension window is opened alongside web dashboard
try {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "ENSURE_EXTENSION_WINDOW" }).catch(() => {});
  }
} catch {
  // Ignored if runtime unavailable
}

// Listen for storage changes from the extension (e.g. login/logout in popup or sidepanel)
if (typeof chrome !== "undefined" && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[AUTH_STORAGE_KEY]) {
      const nextSession = changes[AUTH_STORAGE_KEY].newValue || null;
      if (nextSession && nextSession.access_token && nextSession.account_id) {
        if (nextSession.access_token === lastSyncedToken) return;
        lastSyncedToken = nextSession.access_token;

        window.postMessage({ type: "LMN_AUTH_SYNC_EVENT", session: nextSession }, "*");
        try {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
        } catch {
          // ignore
        }
      } else {
        if (lastSyncedToken === null) return;
        lastSyncedToken = null;

        window.postMessage({ type: "LMN_AUTH_LOGOUT_EVENT" }, "*");
        try {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        } catch {
          // ignore
        }
      }
    }
  });
}

// Listen for events from web dashboard to sync back to extension storage
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data?.type === "LMN_WEB_AUTH_LOGIN" && event.data.session) {
      const token = event.data.session.access_token;
      if (token && token === lastSyncedToken) return;
      lastSyncedToken = token || null;

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.set({ [AUTH_STORAGE_KEY]: event.data.session });
      }
    } else if (event.data?.type === "LMN_WEB_AUTH_LOGOUT") {
      if (lastSyncedToken === null) return;
      lastSyncedToken = null;

      if (typeof chrome !== "undefined" && chrome.storage?.local) {
        chrome.storage.local.remove([AUTH_STORAGE_KEY]);
      }
    } else if (event.data?.type === "LMN_REQUEST_EXTENSION_AUTH") {
      syncAuthFromExtension();
    }
  });
}
