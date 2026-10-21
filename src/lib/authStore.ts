import { useState, useEffect, useSyncExternalStore } from "react";
import { api, ApiError } from "./apiClient";

export const AUTH_STORAGE_KEY = "lmn_auth_session_v1";

export interface AuthSession {
  account_id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  default_organization_id: string;
  access_token: string;
  expires_in?: number;
  auth_provider?: string;
  has_password?: boolean;
}

interface AuthResponseEnvelope<T> {
  data: T;
}

interface SignupData {
  account_id: string;
  email_verified: boolean;
  default_organization_id: string;
  access_token: string;
  expires_in: number;
}

interface SigninData {
  account_id: string;
  default_organization_id: string;
  mfa_required: boolean;
  mfa_challenge_id: string | null;
  access_token: string;
  expires_in: number;
}

interface AccountData {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  email_verified: boolean;
  auth_provider?: string;
  has_password?: boolean;
  created_at: string;
}

// In-memory auth cache with subscriber notification
let currentSession: AuthSession | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
}

function isSameAuthSession(a: AuthSession | null, b: AuthSession | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    a.account_id === b.account_id &&
    a.access_token === b.access_token &&
    a.email === b.email &&
    a.default_organization_id === b.default_organization_id
  );
}

export function isTokenExpired(token?: string, bufferSeconds: number = 30): boolean {
  if (!token) return true;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonStr);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000 - bufferSeconds * 1000;
  } catch {
    return false;
  }
}

let authChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    authChannel = new BroadcastChannel("lmn_auth_channel");
    authChannel.onmessage = (event) => {
      if (event.data?.type === "SESSION_SYNC") {
        const next = event.data.session || null;
        if (isSameAuthSession(next, currentSession)) return;
        currentSession = next;
        if (next?.access_token) {
          api.setAccessToken(next.access_token);
          api.setActiveOrgId(next.default_organization_id);
        } else {
          api.setAccessToken(undefined);
          api.setActiveOrgId(undefined);
        }
        notifySubscribers();
      }
    };
  } catch {
    // BroadcastChannel unsupported or blocked
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === AUTH_STORAGE_KEY) {
      try {
        const next = event.newValue ? JSON.parse(event.newValue) : null;
        if (isSameAuthSession(next, currentSession)) return;
        currentSession = next;
        if (next?.access_token) {
          api.setAccessToken(next.access_token);
          api.setActiveOrgId(next.default_organization_id);
        } else {
          api.setAccessToken(undefined);
          api.setActiveOrgId(undefined);
        }
        notifySubscribers();
      } catch {
        // ignore
      }
    }
  });

  window.addEventListener("message", (event) => {
    if (event.data?.type === "LMN_AUTH_SYNC_EVENT" && event.data.session) {
      const next = event.data.session;
      if (next?.access_token && next.account_id) {
        if (!isSameAuthSession(next, currentSession)) {
          setStoredAuth(next);
        }
      }
    } else if (event.data?.type === "LMN_AUTH_LOGOUT_EVENT") {
      if (currentSession !== null) {
        setStoredAuth(null);
      }
    }
  });
}

/**
 * Ingests auth_sync tokens passed via URL fragment or query parameter
 * when transitioning between extension and web dashboard.
 */
export function ingestUrlAuthSync(): AuthSession | null {
  if (typeof window === "undefined" || !window.location) return null;

  try {
    const hash = window.location.hash || "";
    const search = window.location.search || "";

    let syncRaw: string | null = null;
    if (hash.includes("auth_sync=")) {
      const match = hash.match(/auth_sync=([^&]+)/);
      if (match && match[1]) syncRaw = decodeURIComponent(match[1]);
    } else if (search.includes("auth_sync=")) {
      const params = new URLSearchParams(search);
      syncRaw = params.get("auth_sync");
    }

    if (syncRaw) {
      const parsed = JSON.parse(syncRaw);
      if (
        parsed &&
        typeof parsed.access_token === "string" &&
        typeof parsed.account_id === "string"
      ) {
        setStoredAuth(parsed);

        try {
          if (window.history && window.history.replaceState) {
            let cleanSearch = window.location.search.replace(/[?&]auth_sync=[^&]+/, "");
            if (cleanSearch.startsWith("&")) cleanSearch = `?${cleanSearch.slice(1)}`;
            let cleanHash = window.location.hash.replace(/[#&]auth_sync=[^&]+/, "");
            if (cleanHash.startsWith("&")) cleanHash = `#${cleanHash.slice(1)}`;
            if (cleanHash === "#") cleanHash = "";
            const cleanUrl = `${window.location.pathname}${cleanSearch}${cleanHash}`;
            window.history.replaceState(null, "", cleanUrl);
          }
        } catch {
          // ignore history update failures
        }

        return parsed;
      }
    }
  } catch (err) {
    console.warn("Failed to ingest auth_sync payload:", err);
  }
  return null;
}

export function getStoredAuth(): AuthSession | null {
  if (currentSession) return currentSession;
  if (typeof window === "undefined" || !window.localStorage) return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.access_token === "string" && typeof parsed.account_id === "string") {
      currentSession = parsed;
      api.setAccessToken(parsed.access_token);
      api.setActiveOrgId(parsed.default_organization_id);
      return parsed;
    }
  } catch {
    // Malformed storage
  }
  return null;
}

export function setStoredAuth(session: AuthSession | null): void {
  if (isSameAuthSession(session, currentSession)) {
    return;
  }
  currentSession = session;
  if (typeof window !== "undefined" && window.localStorage) {
    if (session) {
      window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
      api.setAccessToken(session.access_token);
      api.setActiveOrgId(session.default_organization_id);
    } else {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      api.setAccessToken(undefined);
      api.setActiveOrgId(undefined);
    }
  }

  // Also persist in extension storage if available
  if (typeof chrome !== "undefined" && chrome?.storage?.local) {
    try {
      if (session) {
        chrome.storage.local.set({ [AUTH_STORAGE_KEY]: session });
      } else {
        chrome.storage.local.remove([AUTH_STORAGE_KEY]);
      }
    } catch {
      // ignore
    }
  }

  // Synchronize across tabs using BroadcastChannel
  if (authChannel) {
    try {
      authChannel.postMessage({ type: "SESSION_SYNC", session });
    } catch {
      // ignore
    }
  }

  // Bridge to content scripts and parent window
  if (typeof window !== "undefined") {
    try {
      window.postMessage(
        session
          ? { type: "LMN_WEB_AUTH_LOGIN", session }
          : { type: "LMN_WEB_AUTH_LOGOUT" },
        "*"
      );
    } catch {
      // ignore
    }
  }

  notifySubscribers();
}

/**
 * Automatically attempts to restore an authenticated session on the web or extension.
 * Checks in priority order:
 * 1. URL auth_sync payload (passed when opening web tabs from extension).
 * 2. In-memory session or localStorage session.
 * 3. Extension storage (if chrome.storage is available).
 * 4. Backend refresh token cookie (/auth/token with credentials include).
 */
export async function attemptAutoLogin(): Promise<AuthSession | null> {
  // If we have a live valid session that is NOT expired, return it immediately
  if (currentSession && !isTokenExpired(currentSession.access_token)) {
    return currentSession;
  }

  // 1. Ingest URL auth_sync
  const urlSession = ingestUrlAuthSync();
  if (urlSession && !isTokenExpired(urlSession.access_token)) {
    return urlSession;
  }

  // 2. LocalStorage session
  const stored = getStoredAuth();
  if (stored && !isTokenExpired(stored.access_token)) {
    return stored;
  }

  // 3. Extension storage (if running inside extension or popup)
  if (typeof chrome !== "undefined" && chrome?.storage?.local) {
    try {
      const extSession = await new Promise<AuthSession | null>((resolve) => {
        chrome.storage.local.get([AUTH_STORAGE_KEY], (res) => {
          resolve((res?.[AUTH_STORAGE_KEY] as AuthSession) || null);
        });
      });
      if (extSession?.access_token && !isTokenExpired(extSession.access_token)) {
        setStoredAuth(extSession);
        return extSession;
      }
    } catch {
      // ignore
    }
  }

  // 4. Try backend session refresh via HTTP-only cookie
  try {
    const timeoutSignal =
      typeof AbortSignal !== "undefined" && typeof AbortSignal.timeout === "function"
        ? AbortSignal.timeout(1500)
        : undefined;

    const res = await api.post<
      AuthResponseEnvelope<{
        access_token: string;
        expires_in: number;
        active_organization_id: string;
      }>
    >("/auth/token", {}, { signal: timeoutSignal } as any);

    if (res.data?.access_token) {
      api.setAccessToken(res.data.access_token);
      api.setActiveOrgId(res.data.active_organization_id);

      const accRes = await api.get<AuthResponseEnvelope<AccountData>>("/account");
      if (accRes.data) {
        const session: AuthSession = {
          account_id: accRes.data.id,
          email: accRes.data.email,
          name: accRes.data.name || accRes.data.email.split("@")[0],
          avatar_url: accRes.data.avatar_url,
          default_organization_id: res.data.active_organization_id,
          access_token: res.data.access_token,
          expires_in: res.data.expires_in,
          auth_provider: accRes.data.auth_provider,
          has_password: accRes.data.has_password,
        };
        setStoredAuth(session);
        return session;
      }
    }
  } catch {
    // Cookie not present or expired
  }

  // If token was expired but we have an ingested or stored profile, retain it for UI
  return currentSession || urlSession || stored || null;
}

// Initialize on file import
if (typeof window !== "undefined") {
  ingestUrlAuthSync();
  getStoredAuth();
}

export async function signupUser(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthSession> {
  const res = await api.post<AuthResponseEnvelope<SignupData>>("/auth/signup", {
    email: params.email,
    password: params.password,
    name: params.name,
  });

  const session: AuthSession = {
    account_id: res.data.account_id,
    email: params.email,
    name: params.name || params.email.split("@")[0],
    default_organization_id: res.data.default_organization_id,
    access_token: res.data.access_token,
    expires_in: res.data.expires_in,
  };

  setStoredAuth(session);
  return session;
}

export async function signinUser(params: {
  email: string;
  password: string;
}): Promise<AuthSession> {
  const res = await api.post<AuthResponseEnvelope<SigninData>>("/auth/signin", {
    email: params.email,
    password: params.password,
  });

  const session: AuthSession = {
    account_id: res.data.account_id,
    email: params.email,
    default_organization_id: res.data.default_organization_id,
    access_token: res.data.access_token,
    expires_in: res.data.expires_in,
  };

  setStoredAuth(session);
  return session;
}

export async function signoutUser(): Promise<void> {
  try {
    await api.post("/auth/signout");
  } catch {
    // Ignore network error on signout
  } finally {
    setStoredAuth(null);
  }
}

export async function fetchCurrentAccount(): Promise<AccountData> {
  const res = await api.get<AuthResponseEnvelope<AccountData>>("/account");
  if (currentSession) {
    setStoredAuth({
      ...currentSession,
      name: res.data.name || currentSession.name,
      avatar_url: res.data.avatar_url || currentSession.avatar_url,
      auth_provider: res.data.auth_provider || currentSession.auth_provider,
      has_password: res.data.has_password,
    });
  }
  return res.data;
}

export async function updateCurrentAccount(params: {
  name?: string;
  avatar_url?: string;
}): Promise<AccountData> {
  const res = await api.patch<AuthResponseEnvelope<AccountData>>("/account", params);
  if (currentSession) {
    setStoredAuth({
      ...currentSession,
      name: res.data.name || currentSession.name,
    });
  }
  return res.data;
}

export interface GoogleAuthParams {
  credential?: string;
  token?: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  mock_profile?: {
    email: string;
    name?: string;
    avatar_url?: string;
    sub?: string;
  };
}

/**
 * Launches the official Google Identity Services popup on the web to authenticate with Google.
 */
export async function launchGoogleWebAuth(clientId: string): Promise<string> {
  if (typeof window === "undefined") {
    throw new Error("Web Google auth is only available in browser environments.");
  }

  // Ensure Google Identity Services script is loaded
  if (!(window as any).google?.accounts?.oauth2) {
    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );
      if (existing) {
        if ((window as any).google?.accounts?.oauth2) return resolve();
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("Failed to load Google Identity Services script")),
          { once: true }
        );
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error("Unable to load Google Identity Services. Check adblockers or network."));
      document.head.appendChild(script);
    });
  }

  const google = (window as any).google;
  if (!google?.accounts?.oauth2) {
    throw new Error("Google Identity Services is not available.");
  }

  return new Promise<string>((resolve, reject) => {
    try {
      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "openid email profile",
        callback: (tokenRes: any) => {
          if (tokenRes.error) {
            reject(new Error(tokenRes.error_description || tokenRes.error));
          } else if (tokenRes.access_token) {
            resolve(tokenRes.access_token);
          } else {
            reject(new Error("No access token returned from Google."));
          }
        },
        error_callback: (err: any) => {
          reject(new Error(err?.message || "Google sign-in popup was closed or blocked."));
        },
      });

      tokenClient.requestAccessToken({ prompt: "select_account" });
    } catch (err) {
      reject(err);
    }
  });
}

export async function signInWithGoogle(params?: GoogleAuthParams): Promise<AuthSession> {
  let payload: GoogleAuthParams = params ? { ...params } : {};

  // If email was provided directly
  if (params?.email && !payload.mock_profile) {
    payload.mock_profile = {
      email: params.email.trim().toLowerCase(),
      name: params.name?.trim() || params.email.split("@")[0],
      avatar_url: params.avatar_url,
    };
  }

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // If in Chrome extension with identity API and VITE_GOOGLE_CLIENT_ID is provided
  if (!payload.credential && !payload.token && !payload.mock_profile) {
    if (typeof chrome !== "undefined" && chrome?.identity?.launchWebAuthFlow) {
      if (clientId) {
        try {
          const redirectUri = chrome.identity.getRedirectURL("oauth2");
          const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(
            redirectUri
          )}&scope=openid%20email%20profile`;

          const responseUrl = await new Promise<string>((resolve, reject) => {
            chrome.identity.launchWebAuthFlow(
              { url: authUrl, interactive: true },
              (redirectResponse) => {
                if (chrome.runtime.lastError || !redirectResponse) {
                  reject(chrome.runtime.lastError || new Error("Google sign-in was cancelled or failed"));
                } else {
                  resolve(redirectResponse);
                }
              }
            );
          });

          const fragment = responseUrl.includes("#")
            ? responseUrl.split("#")[1]
            : responseUrl.split("?")[1] || "";
          const urlParams = new URLSearchParams(fragment);
          const error = urlParams.get("error");
          if (error) {
            const desc = urlParams.get("error_description") || error;
            throw new Error(`Google OAuth: ${desc}`);
          }
          const token = urlParams.get("access_token") || urlParams.get("id_token");
          if (token) {
            payload = { token };
          }
        } catch (flowErr) {
          console.warn("Chrome web auth flow warning:", flowErr);
        }
      }
    }
  }

  // If in Web Browser environment without chrome.identity (e.g. localhost:5173/web)
  if (!payload.credential && !payload.token && !payload.mock_profile) {
    const isExtension = typeof chrome !== "undefined" && Boolean(chrome?.identity?.launchWebAuthFlow);
    if (!isExtension && clientId && typeof window !== "undefined") {
      try {
        const token = await launchGoogleWebAuth(clientId);
        if (token) {
          payload = { token };
        }
      } catch (webErr) {
        console.warn("Web Google auth flow warning:", webErr);
        const msg = webErr instanceof Error ? webErr.message : String(webErr);
        throw new Error(msg);
      }
    }
  }

  // If still no token, check if Chrome can provide the logged-in profile email
  if (!payload.credential && !payload.token && !payload.mock_profile) {
    if (typeof chrome !== "undefined" && chrome?.identity?.getProfileUserInfo) {
      try {
        const chromeUser = await new Promise<{ email: string; id: string } | null>((resolve) => {
          chrome.identity.getProfileUserInfo({ accountStatus: "ANY" as any }, (userInfo) => {
            if (userInfo && userInfo.email) resolve(userInfo);
            else resolve(null);
          });
        });
        if (chromeUser?.email) {
          payload.mock_profile = {
            email: chromeUser.email,
            name: chromeUser.email.split("@")[0],
            sub: chromeUser.id,
          };
        }
      } catch {
        // ignore
      }
    }
  }

  if (!payload.credential && !payload.token && !payload.mock_profile?.email) {
    throw new Error("Please enter your Google / Gmail account email to connect.");
  }

  const res = await api.post<
    AuthResponseEnvelope<{
      account_id: string;
      default_organization_id: string;
      access_token: string;
      expires_in: number;
      user?: {
        email: string;
        name?: string;
        avatar_url?: string;
      };
    }>
  >("/auth/google", payload);

  const session: AuthSession = {
    account_id: res.data.account_id,
    email: res.data.user?.email || payload.mock_profile?.email || "user@gmail.com",
    name: res.data.user?.name || payload.mock_profile?.name || "Google User",
    avatar_url: res.data.user?.avatar_url || payload.mock_profile?.avatar_url,
    default_organization_id: res.data.default_organization_id,
    access_token: res.data.access_token,
    expires_in: res.data.expires_in,
  };

  setStoredAuth(session);
  return session;
}

export function useAuth() {
  const session = useSyncExternalStore(
    (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    () => getStoredAuth(),
    () => null
  );

  useEffect(() => {
    if (!session) {
      attemptAutoLogin().catch(() => {});
    }
  }, [session]);

  return {
    session,
    isAuthenticated: Boolean(session && session.access_token),
    account: session,
    signin: signinUser,
    signup: signupUser,
    signInWithGoogle,
    signout: signoutUser,
    refreshProfile: fetchCurrentAccount,
    updateProfile: updateCurrentAccount,
    attemptAutoLogin,
  };
}
