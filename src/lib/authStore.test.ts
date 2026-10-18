import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  AUTH_STORAGE_KEY,
  getStoredAuth,
  setStoredAuth,
  signupUser,
  signinUser,
  signoutUser,
  type AuthSession,
} from "./authStore";
import { api } from "./apiClient";

describe("authStore", () => {
  beforeEach(() => {
    localStorage.clear();
    setStoredAuth(null);
    vi.restoreAllMocks();
  });

  const mockSession: AuthSession = {
    account_id: "0190a4f1-6c5e-7c2a-9b3f-1234567890ab",
    email: "test@letsmarknow.com",
    name: "Test User",
    default_organization_id: "0190a4f1-6c5e-7c2a-9b3f-000000000001",
    access_token: "mock_jwt_token",
    expires_in: 900,
  };

  it("stores and retrieves auth session from localStorage", () => {
    expect(getStoredAuth()).toBeNull();

    setStoredAuth(mockSession);
    const retrieved = getStoredAuth();

    expect(retrieved).toEqual(mockSession);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain("0190a4f1");
  });

  it("clears auth session and resets apiClient on null", () => {
    setStoredAuth(mockSession);
    expect(getStoredAuth()).not.toBeNull();

    setStoredAuth(null);
    expect(getStoredAuth()).toBeNull();
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it("signupUser calls api.post and saves session", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        account_id: mockSession.account_id,
        email_verified: false,
        default_organization_id: mockSession.default_organization_id,
        access_token: mockSession.access_token,
        expires_in: 900,
      },
    });

    const session = await signupUser({
      name: "New User",
      email: "new@example.com",
      password: "Password123!",
    });

    expect(session.account_id).toBe(mockSession.account_id);
    expect(session.email).toBe("new@example.com");
    expect(getStoredAuth()?.account_id).toBe(mockSession.account_id);
  });

  it("signinUser calls api.post and saves session", async () => {
    vi.spyOn(api, "post").mockResolvedValueOnce({
      data: {
        account_id: mockSession.account_id,
        default_organization_id: mockSession.default_organization_id,
        mfa_required: false,
        mfa_challenge_id: null,
        access_token: mockSession.access_token,
        expires_in: 900,
      },
    });

    const session = await signinUser({
      email: "test@letsmarknow.com",
      password: "Password123!",
    });

    expect(session.account_id).toBe(mockSession.account_id);
    expect(getStoredAuth()?.access_token).toBe(mockSession.access_token);
  });

  it("signoutUser clears stored session", async () => {
    setStoredAuth(mockSession);
    vi.spyOn(api, "post").mockResolvedValueOnce({});

    await signoutUser();

    expect(getStoredAuth()).toBeNull();
  });
});
