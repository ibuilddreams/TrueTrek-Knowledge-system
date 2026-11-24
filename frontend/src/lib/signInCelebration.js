// A one-shot "this visitor just signed in" note, handed from the login page to
// whichever portal screen they land on.
//
// It cannot simply be a confetti call in `LoginForm`: signing in is followed
// immediately by `useGuestOnlyRoute` replacing the route, so the burst was
// being thrown on the login page's "Redirecting..." screen and torn down
// mid-flight — the visitor saw a flicker on the page they were leaving rather
// than a welcome on the one they arrived at.
//
// `sessionStorage` rather than Redux or a query param: the flag has to survive
// a full navigation, belongs to this tab alone, and must never be shareable or
// bookmarkable. Every access is wrapped — storage throws in private mode and
// when site data is blocked, and a missed celebration must never be the reason
// a sign-in fails.
const KEY = "truetrek:sign-in-celebration";

// The note is only honoured for a short while. A student who signs in, goes
// through onboarding and wanders off would otherwise be confettied on some
// unrelated visit to their portal half an hour later.
const FRESH_FOR_MS = 5 * 60 * 1000;

export function markSignInCelebration() {
  try {
    window.sessionStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Storage unavailable — skip the celebration, never the sign-in.
  }
}

// Reads and clears in one go, so it can fire exactly once however many times
// it is called — which is what makes React's development double-mount safe.
export function consumeSignInCelebration() {
  try {
    const marked = window.sessionStorage.getItem(KEY);
    if (!marked) return false;
    window.sessionStorage.removeItem(KEY);
    return Date.now() - Number(marked) < FRESH_FOR_MS;
  } catch {
    return false;
  }
}
