import { supabase, ensureSupabase } from "./supabase-client.js";
import { qs, setMessage } from "./utils.js";

const form = qs("#loginForm");
const messageEl = qs("#loginMessage");

async function requireAdministrator(user) {
  const { data, error } = await supabase.from('portfolio_admins')
    .select('user_id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('This account does not have access to the portfolio dashboard.');
}

async function redirectIfLoggedIn() {
  try {
    ensureSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error?.name === 'AuthSessionMissingError') return;
    if (error) throw error;
    if (data.user) {
      await requireAdministrator(data.user);
      window.location.href = 'dashboard.html';
    }
  } catch (error) {
    setMessage(messageEl, error.message, "error");
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(messageEl, "Signing in...");

  try {
    ensureSupabase();

    const email = qs("#email")?.value.trim();
    const password = qs("#password")?.value ?? "";

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await requireAdministrator(data.user);

    setMessage(messageEl, "Login successful. Redirecting...", "success");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    setMessage(messageEl, error.message || "Login failed.", "error");
  }
});

redirectIfLoggedIn();
