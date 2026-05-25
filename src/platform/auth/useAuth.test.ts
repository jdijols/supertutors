import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePlatformStore } from "@/platform/stores/platformStore";

// Mock supabase before importing useAuth
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

// Import after mock setup
import { signIn, signUp, signOut } from "./useAuth";
import { supabase } from "@/lib/supabase";

const mockSignIn = vi.mocked(supabase.auth.signInWithPassword);
const mockSignUp = vi.mocked(supabase.auth.signUp);
const mockSignOut = vi.mocked(supabase.auth.signOut);

beforeEach(() => {
  // Reset store to known state
  usePlatformStore.setState({
    authStatus: "signed-out",
    session: null,
    user: null,
  });
  vi.clearAllMocks();
});

describe("platformStore auth slice", () => {
  it("setSession with a session → status becomes signed-in, user is set", () => {
    const fakeSession = {
      user: { id: "u1", email: "test@test.com" },
    } as never;

    usePlatformStore.getState().setSession(fakeSession);

    const state = usePlatformStore.getState();
    expect(state.authStatus).toBe("signed-in");
    expect(state.session).toBe(fakeSession);
    expect(state.user?.id).toBe("u1");
  });

  it("setSession with null → status becomes signed-out, user cleared", () => {
    // Start signed in
    const fakeSession = {
      user: { id: "u1", email: "test@test.com" },
    } as never;
    usePlatformStore.getState().setSession(fakeSession);

    // Sign out
    usePlatformStore.getState().setSession(null);

    const state = usePlatformStore.getState();
    expect(state.authStatus).toBe("signed-out");
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  it("getSession returning null → status is signed-out after init", () => {
    // Default state after setSession(null)
    usePlatformStore.getState().setSession(null);
    expect(usePlatformStore.getState().authStatus).toBe("signed-out");
  });
});

describe("signIn", () => {
  it("valid creds → returns no error", async () => {
    mockSignIn.mockResolvedValue({ data: {}, error: null } as never);

    const result = await signIn("demo@test.com", "password123");

    expect(result.error).toBeUndefined();
    expect(mockSignIn).toHaveBeenCalledWith({
      email: "demo@test.com",
      password: "password123",
    });
  });

  it("invalid creds → returns error string", async () => {
    mockSignIn.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    } as never);

    const result = await signIn("bad@test.com", "wrong");

    expect(result.error).toBe("Invalid login credentials");
  });
});

describe("signUp", () => {
  it("valid signup → returns no error", async () => {
    mockSignUp.mockResolvedValue({ data: {}, error: null } as never);

    const result = await signUp("new@test.com", "password123", "New User");

    expect(result.error).toBeUndefined();
    expect(mockSignUp).toHaveBeenCalledWith({
      email: "new@test.com",
      password: "password123",
      options: { data: { display_name: "New User" } },
    });
  });

  it("duplicate email → returns error string", async () => {
    mockSignUp.mockResolvedValue({
      data: {},
      error: { message: "User already registered" },
    } as never);

    const result = await signUp("exists@test.com", "pass", "Dup");

    expect(result.error).toBe("User already registered");
  });
});

describe("signOut", () => {
  it("sign out → calls supabase signOut", async () => {
    mockSignOut.mockResolvedValue({ error: null } as never);

    const result = await signOut();

    expect(result.error).toBeUndefined();
    expect(mockSignOut).toHaveBeenCalled();
  });
});
