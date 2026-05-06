import { supabase, ensureSupabase } from "./supabase-client.js";
import { qs, setMessage } from "./utils.js";

const form = qs("#loginForm");
const messageEl = qs("#loginMessage");

async function redirectIfLoggedIn() {
  try {
    ensureSupabase();
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) window.location.href = "dashboard.html";
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

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    setMessage(messageEl, "Login successful. Redirecting...", "success");
    window.location.href = "dashboard.html";
  } catch (error) {
    console.error(error);
    setMessage(messageEl, error.message || "Login failed.", "error");
  }
});

redirectIfLoggedIn();
