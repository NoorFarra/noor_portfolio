import emailjs from "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/+esm";
import { supabase, ensureSupabase } from "./supabase-client.js";
import { EMAILJS_PUBLIC_KEY, EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID } from "./config.js";
import { escapeHtml, formatProjectCount, qs, setMessage, setupReveal, setupSiteChrome } from "./utils.js";

setupSiteChrome();
setupReveal();

const grid = qs("#projectsGrid");
const count = qs("#projectCount");
const contactForm = qs("#contactForm");
const contactMessage = qs("#contactMessage");
const contactSubmit = qs("#contactSubmit");

function setProjectsMarkup(html) {
  if (grid) grid.innerHTML = html;
}

function renderProjects(projects) {
  if (!grid || !count) return;

  if (!projects.length) {
    count.textContent = "00 / 00 selected";
    setProjectsMarkup(`
      <div class="empty-projects" style="display:block;grid-column:1 / -1;">
        <h3>No projects yet</h3>
        <p>Add your first project from the dashboard and it will appear here automatically.</p>
      </div>
    `);
    return;
  }

  count.textContent = formatProjectCount(projects.length);

  setProjectsMarkup(
    projects
      .map((project, index) => {
        const title = escapeHtml(project.title);
        const description = escapeHtml(project.description);
        const imageUrl = escapeHtml(project.image_url);
        const liveUrl = escapeHtml(project.live_url);
        const tag = project.is_featured ? "Featured Project" : "Selected Work";
        const isLarge = index === 0;

        return isLarge
          ? `
            <article class="project-card project-card-large reveal visible show">
              <img src="${imageUrl}" alt="${title}" loading="lazy" />
              <div class="project-overlay">
                <p class="project-tag">${tag}</p>
                <h3>${title}</h3>
                <p>${description}</p>
                <a href="${liveUrl}" target="_blank" rel="noreferrer" class="btn btn-secondary small-btn">View Project</a>
              </div>
            </article>
          `
          : `
            <article class="project-card reveal visible show">
              <img src="${imageUrl}" alt="${title}" loading="lazy" />
              <div class="project-overlay compact">
                <h3>${title}</h3>
                <a href="${liveUrl}" target="_blank" rel="noreferrer" class="text-link">Details</a>
              </div>
            </article>
          `;
      })
      .join("")
  );
}

async function loadProjects() {
  try {
    ensureSupabase();
    if (!grid || !count) return;

    count.textContent = "Loading...";

    const { data, error } = await supabase
      .from("projects")
      .select("id, title, description, image_url, live_url, is_featured, is_published, display_order, created_at")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw error;
    renderProjects(data || []);
  } catch (error) {
    console.error(error);
    if (count) count.textContent = "Projects unavailable";
    setProjectsMarkup(`
      <div class="empty-projects" style="display:block;grid-column:1 / -1;">
        <h3>Unable to load projects</h3>
        <p>${escapeHtml(error.message)}</p>
      </div>
    `);
  }
}

function emailJsConfigured() {
  return (
    EMAILJS_PUBLIC_KEY &&
    EMAILJS_SERVICE_ID &&
    EMAILJS_TEMPLATE_ID &&
    !EMAILJS_PUBLIC_KEY.includes("PASTE_") &&
    !EMAILJS_SERVICE_ID.includes("PASTE_") &&
    !EMAILJS_TEMPLATE_ID.includes("PASTE_")
  );
}

if (emailJsConfigured()) {
  emailjs.init({
    publicKey: EMAILJS_PUBLIC_KEY,
    limitRate: {
      id: "contact-form",
      throttle: 10000,
    },
  });
}

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!emailJsConfigured()) {
    setMessage(contactMessage, "EmailJS keys are missing. Add them in js/config.js first.", "error");
    return;
  }

  const originalText = contactSubmit?.textContent || "Send Transmission";

  try {
    if (contactSubmit) {
      contactSubmit.disabled = true;
      contactSubmit.textContent = "Sending...";
    }
    setMessage(contactMessage, "Sending your message...", "");

    await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, contactForm);

    contactForm.reset();
    setMessage(contactMessage, "Message sent successfully. Thank you!", "success");
  } catch (error) {
    console.error(error);
    setMessage(contactMessage, "Message failed to send. Check EmailJS settings and try again.", "error");
  } finally {
    if (contactSubmit) {
      contactSubmit.disabled = false;
      contactSubmit.textContent = originalText;
    }
  }
});

loadProjects();
