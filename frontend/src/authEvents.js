// A full page reload after login was the root cause of the "empty
// feed on first load" bug: it created a special code path (fresh
// reload) that behaved subtly differently from ordinary client-side
// navigation (which always worked correctly). This event bus lets
// login/logout notify the rest of the app (specifically, the socket
// connection in App.jsx) WITHOUT reloading the page -- so the very
// first feed load after login goes through the exact same, proven
// code path as every subsequent navigation.
export function notifyAuthChanged() {
  window.dispatchEvent(new Event("skypost:auth-changed"));
}

export function onAuthChanged(handler) {
  window.addEventListener("skypost:auth-changed", handler);
  return () => window.removeEventListener("skypost:auth-changed", handler);
}
