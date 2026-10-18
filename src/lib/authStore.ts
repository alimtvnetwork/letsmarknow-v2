import { useState, useEffect, useSyncExternalStore } from "react";
import { api, ApiError } from "./apiClient";

export const AUTH_STORAGE_KEY = "lmn_auth_session_v1";

export interface AuthSession {
  account_id: string;
  email: string;
  name?: string;
  default_organization_id: string;
  access_token: string;
  expires_in?: number;
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
  created_at: string;
}

// In-memory auth cache with subscriber notification
let currentSession: AuthSession | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach((callback) => callback());
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
  notifySubscribers();
}

// Initialize on file import
if (typeof window !== "undefined") {
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
  if (currentSession && res.data.name && res.data.name !== currentSession.name) {
    setStoredAuth({
      ...currentSession,
      name: res.data.name,
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

export function useAuth() {
  const session = useSyncExternalStore(
    (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    },
    () => getStoredAuth(),
    () => null
  );

  return {
    session,
    isAuthenticated: Boolean(session && session.access_token),
    account: session,
    signin: signinUser,
    signup: signupUser,
    signout: signoutUser,
    refreshProfile: fetchCurrentAccount,
    updateProfile: updateCurrentAccount,
  };
}
