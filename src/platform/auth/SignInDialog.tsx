import { useEffect, useState, useActionState } from "react";
import { signIn, signUp } from "./useAuth";

type Tab = "sign-in" | "sign-up";

interface FormState {
  error?: string;
  success?: boolean;
}

async function handleSignIn(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  if (!email || !password) return { error: "Email and password are required." };
  const result = await signIn(email, password);
  if (result.error) return { error: result.error };
  return { success: true };
}

async function handleSignUp(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const displayName = formData.get("displayName") as string;
  if (!email || !password) return { error: "Email and password are required." };
  const result = await signUp(email, password, displayName || "");
  if (result.error) return { error: result.error };
  return { success: true };
}

/**
 * SignInDialog — modal with sign-in / sign-up tabs.
 *
 * Uses React 19 useActionState for form actions. CSS transitions
 * (not framer-motion) so it works in hidden-tab headless preview.
 * Mirrors AboutModal's mount/visible pattern.
 */
export function SignInDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("sign-in");
  const [signInState, signInAction, signInPending] = useActionState(
    handleSignIn,
    {}
  );
  const [signUpState, signUpAction, signUpPending] = useActionState(
    handleSignUp,
    {}
  );

  // Mount/unmount with exit delay for fade-out
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(id);
    }
    setVisible(false);
    const t = setTimeout(() => setMounted(false), 200);
    return () => clearTimeout(t);
  }, [open]);

  // Close on success
  useEffect(() => {
    if (signInState.success || signUpState.success) onClose();
  }, [signInState.success, signUpState.success, onClose]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const isSignIn = tab === "sign-in";
  const pending = isSignIn ? signInPending : signUpPending;
  const error = isSignIn ? signInState.error : signUpState.error;

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center p-4 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-dialog-heading"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-sb-ink/60 backdrop-blur-sm cursor-pointer"
      />

      <div
        className={`
          relative w-full max-w-[400px]
          rounded-[22px] bg-sb-card border border-sb-border
          p-7 sm:p-9
          shadow-2xl shadow-sb-ink/30
          transition-all duration-200 ease-out
          ${visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"}
        `}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="
            absolute top-4 right-4
            w-8 h-8 rounded-full border border-sb-border
            bg-sb-surface hover:bg-sb-paper
            flex items-center justify-center text-sb-ink
            transition-colors duration-200
            focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent
          "
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        {/* Tabs */}
        <div className="flex gap-1 mb-6">
          <TabButton
            active={isSignIn}
            onClick={() => setTab("sign-in")}
            label="Sign in"
          />
          <TabButton
            active={!isSignIn}
            onClick={() => setTab("sign-up")}
            label="Sign up"
          />
        </div>

        <h2
          id="auth-dialog-heading"
          className="font-mono font-bold text-xl tracking-[-0.01em] text-sb-ink mb-5"
        >
          {isSignIn ? "Welcome back" : "Create your account"}
        </h2>

        {/* Sign-in form */}
        {isSignIn && (
          <form action={signInAction} className="space-y-4">
            <Input name="email" type="email" label="Email" autoFocus />
            <Input name="password" type="password" label="Password" />
            {error && <ErrorMessage message={error} />}
            <SubmitButton pending={pending} label="Sign in" />
          </form>
        )}

        {/* Sign-up form */}
        {!isSignIn && (
          <form action={signUpAction} className="space-y-4">
            <Input name="displayName" type="text" label="Display name" autoFocus />
            <Input name="email" type="email" label="Email" />
            <Input name="password" type="password" label="Password" />
            {error && <ErrorMessage message={error} />}
            <SubmitButton pending={pending} label="Create account" />
          </form>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        font-mono text-xs uppercase tracking-[0.18em] px-3 py-1.5 rounded-full
        transition-colors duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent
        ${active ? "bg-sb-ink text-white" : "text-sb-muted hover:text-sb-ink"}
      `}
    >
      {label}
    </button>
  );
}

function Input({
  name,
  type,
  label,
  autoFocus,
}: {
  name: string;
  type: string;
  label: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-sb-muted mb-1 block">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoFocus={autoFocus}
        required={name !== "displayName"}
        className="
          w-full px-3 py-2.5 rounded-xl
          bg-sb-surface border border-sb-border
          font-sans text-sm text-sb-ink
          placeholder:text-sb-muted/50
          transition-colors duration-200
          focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:border-sb-accent
        "
      />
    </label>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="text-sm text-red-600 font-sans" role="alert">
      {message}
    </p>
  );
}

function SubmitButton({
  pending,
  label,
}: {
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="
        w-full py-3 rounded-xl
        font-mono font-bold text-sm uppercase tracking-[0.18em]
        bg-sb-ink text-white
        hover:bg-sb-ink/90
        disabled:opacity-60 disabled:cursor-not-allowed
        transition-all duration-200
        focus:outline-none focus-visible:ring-2 focus-visible:ring-sb-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sb-card
      "
    >
      {pending ? "..." : label}
    </button>
  );
}
