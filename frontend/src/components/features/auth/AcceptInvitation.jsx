"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { acceptInvitation } from "@/services/invitationsService";
import { getApiErrorMessage } from "@/lib/apiErrors";
import AuthGateCard from "@/components/ui/AuthGateCard";
import AuthField from "@/components/ui/AuthField";
import AuthSubmitButton from "@/components/ui/AuthSubmitButton";
import { Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function AcceptInvitation() {
  const { isAuthenticated, logout } = useAuth();
  const [credentials, setCredentials] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [gender, setGender] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedbackAvailable, setFeedbackAvailable] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    setCredentials({ id: params.get("id"), token: params.get("token") });
  }, []);

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const response = await acceptInvitation({ ...credentials, password, confirm_password: confirm, gender });
      setFeedbackAvailable(Boolean(response.data?.feedback_available));
      setDone(true);
      setPassword("");
      setConfirm("");
      setCredentials(null);
      window.history.replaceState(null, "", window.location.pathname);
    } catch (err) { setError(getApiErrorMessage(err)); }
    finally { setBusy(false); }
  }

  return <AuthGateCard icon={Lock} title={done ? "Your account is ready" : "Complete your invitation"} subtitle={done ? (feedbackAvailable ? "Sign in with your invited email and new password to share your feedback." : "Sign in with your invited email and new password to access your account.") : "Choose a password to activate your invited account."}>
    {isAuthenticated ? <div className="space-y-4"><p className="text-sm">You are already signed in. Sign out before setting up the invited account.</p><button disabled={busy} className="rounded-xl bg-pine px-5 py-3 text-white disabled:opacity-50" onClick={async () => { setBusy(true); try { await logout(); } catch (err) { setError(getApiErrorMessage(err)); } finally { setBusy(false); } }}>Sign out to continue</button>{error && <p role="alert" className="text-sm text-rose-700">{error}</p>}</div>
      : done ? <Link href={feedbackAvailable ? "/login?next=/feedback" : "/login"} className="block rounded-xl bg-pine p-3 text-center text-white">{feedbackAvailable ? "Sign in & share feedback" : "Sign in to your account"}</Link>
      : credentials && (!credentials.id || !credentials.token) ? <p role="alert" className="text-sm text-rose-700">This setup link is incomplete. Please ask your admin for a new invitation link.</p>
      : <form onSubmit={submit} className="space-y-4">
        <AuthField id="invitation-password" label="Password" aria-label="Password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" showPasswordToggle value={password} onChange={(event) => setPassword(event.target.value)} />
        <p className="text-xs text-muted">Use at least 8 characters. Avoid common passwords, all numbers, and personal details.</p>
        <AuthField id="invitation-confirm" label="Confirm password" aria-label="Confirm password" type="password" required maxLength={128} autoComplete="new-password" showPasswordToggle value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        <label className="block text-sm space-y-2"><span>Gender</span><select required className="w-full rounded-xl border border-line bg-paper p-3" value={gender} onChange={(event) => setGender(event.target.value)}><option value="">Select</option><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other / prefer not to say</option></select></label>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        <AuthSubmitButton isSubmitting={busy} disabled={!credentials || busy} label="Activate account" loadingLabel="Activating…" />
      </form>}
  </AuthGateCard>;
}
