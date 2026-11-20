import { supabase, ensureSupabase } from "./supabase-client.js";
import { STORAGE_BUCKET } from "./config.js";
import { escapeHtml, qs, setMessage, formatProjectCount, setupReveal } from "./utils.js";
import { normalizeGithubUrl } from './project-links.js';

setupReveal();

const els = {
  sidebar: qs("#sidebar"),
  mobileOverlay: qs("#mobileOverlay"),
  menuToggle: qs("#menuToggle"),
  openModalBtn: qs("#openModalBtn"),
  openModalBtnTop: qs("#openModalBtnTop"),
  closeModalBtn: qs("#closeModalBtn"),
  cancelModalBtn: qs("#cancelModalBtn"),
  modalBackdrop: qs("#modalBackdrop"),
  projectModal: qs("#projectModal"),
  projectForm: qs("#projectForm"),
  message: qs("#dashboardMessage"),
  grid: qs("#dashboardProjectsGrid"),
  emptyState: qs("#dashboardEmptyState"),
  count: qs("#dashboardCount"),
  dashboardUser: qs("#dashboardUser"),
  searchInput: qs("#searchInput"),
  logoutLink: qs("#logoutLink"),
  imageInput: qs("#projectImage"),
  previewWrap: qs("#imagePreviewWrap"),
  previewImg: qs("#imagePreview"),
  saveBtn: qs("#saveProjectBtn"),
  modalTitle: qs("#modalTitle"),
  modalEyebrow: qs("#modalEyebrow"),
};

const fields = {
  id: qs("#projectId"),
  title: qs("#projectTitle"),
  description: qs("#projectDescription"),
  liveUrl: qs("#projectLiveUrl"),
  githubUrl: qs('#projectGithubUrl'),
  isFeatured: qs("#projectFeatured"),
};

let currentUser = null;
let allProjects = [];
let currentPreviewUrl = "";

function toggleSidebar() {
  els.sidebar?.classList.toggle("open");
  els.mobileOverlay?.classList.toggle("show");
}

function openModal(editMode = false) {
  els.projectModal?.classList.remove("hidden");
  els.projectModal?.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = "hidden";
  if (els.modalTitle) els.modalTitle.textContent = editMode ? "Edit Entry" : "New Entry";
  if (els.modalEyebrow) els.modalEyebrow.textContent = editMode ? "Edit Project" : "New Project";
  if (els.saveBtn) els.saveBtn.textContent = editMode ? "Save Changes" : "Create Entry";
  fields.title?.focus();
}

function closeModal() {
  els.projectModal?.classList.add("hidden");
  els.projectModal?.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = "";
  els.projectForm?.reset();
  if (fields.id) fields.id.value = "";
  fields.githubUrl?.setCustomValidity('');
  currentPreviewUrl = "";
  els.previewImg?.removeAttribute("src");
  els.previewWrap?.classList.add("hidden");
  setMessage(els.message, "");
}

function extractStoragePathFromPublicUrl(publicUrl) {
  if (!publicUrl || !publicUrl.includes(`/storage/v1/object/public/${STORAGE_BUCKET}/`)) return null;
  return publicUrl.split(`/storage/v1/object/public/${STORAGE_BUCKET}/`)[1] || null;
}

async function removeStoredImage(publicUrl) {
  const path = extractStoragePathFromPublicUrl(publicUrl);
  if (!path) return;
  await supabase.storage.from(STORAGE_BUCKET).remove([path]);
}

async function requireAuth() {
  ensureSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error?.name === 'AuthSessionMissingError') {
    window.location.href = 'login.html';
    return false;
  }
  if (error) throw error;
  if (!data.user) {
    window.location.href = "login.html";
    return false;
  }
  const { data: admin, error: adminError } = await supabase.from('portfolio_admins')
    .select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (adminError) throw adminError;
  if (!admin) {
    window.location.href = 'login.html?access=denied';
    return false;
  }
  currentUser = data.user;
  if (els.dashboardUser) els.dashboardUser.textContent = currentUser.email;
  return true;
}

async function uploadImage(file) {
  if (!file) return null;

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const filePath = `projects/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

function renderProjects(projects) {
  if (!els.grid || !els.count) return;

  if (!projects.length) {
    els.grid.innerHTML = "";
    els.emptyState?.classList.remove("hidden");
    els.count.textContent = formatProjectCount(0);
    return;
  }

  els.emptyState?.classList.add("hidden");
  els.count.textContent = formatProjectCount(projects.length);

  els.grid.innerHTML = projects
    .map(
      (project) => `
      <article class="project-card ${project.is_featured ? "featured" : ""}">
        <div class="project-panel-actions">
          <button class="icon-btn" data-action="edit" data-id="${project.id}" aria-label="Edit project">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="icon-btn danger" data-action="delete" data-id="${project.id}" aria-label="Delete project">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>

        <div class="project-image-wrap">
          <img src="${escapeHtml(project.image_url)}" alt="${escapeHtml(project.title)}" loading="lazy" />
        </div>

        <div class="project-overlay">
          <p class="project-tag">${project.is_featured ? "Featured" : "Project"}</p>
          <h3>${escapeHtml(project.title)}</h3>
          <p class="project-description">${escapeHtml(project.description)}</p>
          <div class="project-meta">
            <span>${project.is_published ? "Published" : "Draft"}</span>
            <a href="${escapeHtml(project.live_url)}" target="_blank" rel="noreferrer" class="project-link">Live ↗</a>
            ${project.github_url ? `<a href="${escapeHtml(project.github_url)}" target="_blank" rel="noopener noreferrer" class="project-link">GitHub</a>` : ''}
          </div>
        </div>
      </article>
    `
    )
    .join("");
}

async function fetchProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  allProjects = data || [];
  renderProjects(allProjects);
}

function fillForm(project) {
  if (!project) return;
  fields.id.value = project.id;
  fields.title.value = project.title;
  fields.description.value = project.description;
  fields.liveUrl.value = project.live_url;
  fields.githubUrl.value = project.github_url || '';
  fields.githubUrl.setCustomValidity('');
  fields.isFeatured.value = String(project.is_featured);
  currentPreviewUrl = project.image_url || "";

  if (currentPreviewUrl) {
    els.previewImg.src = currentPreviewUrl;
    els.previewWrap?.classList.remove("hidden");
  }
}

async function createProject(payload) {
  const { error } = await supabase.from("projects").insert(payload);
  if (error) throw error;
}

async function updateProject(id, payload) {
  const { error } = await supabase.from("projects").update(payload).eq("id", id);
  if (error) throw error;
}

async function deleteProject(id) {
  const project = allProjects.find((item) => item.id === id);
  if (!project) return;

  const confirmed = window.confirm(`Delete "${project.title}"?`);
  if (!confirmed) return;

  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;

  await removeStoredImage(project.image_url);
  await fetchProjects();
}

els.menuToggle?.addEventListener("click", toggleSidebar);
els.mobileOverlay?.addEventListener("click", toggleSidebar);
[els.openModalBtn, els.openModalBtnTop].forEach((btn) => btn?.addEventListener("click", () => openModal(false)));
[els.closeModalBtn, els.cancelModalBtn, els.modalBackdrop].forEach((el) => el?.addEventListener("click", closeModal));

els.imageInput?.addEventListener("change", () => {
  const file = els.imageInput.files?.[0];
  if (!file) {
    if (!currentPreviewUrl) els.previewWrap?.classList.add("hidden");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") {
      els.previewImg.src = reader.result;
      els.previewWrap?.classList.remove("hidden");
    }
  };
  reader.readAsDataURL(file);
});

els.projectForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  setMessage(els.message, "Saving project...");

  try {
    if (els.saveBtn) els.saveBtn.disabled = true;
    const githubUrl = normalizeGithubUrl(fields.githubUrl.value);
    const id = fields.id.value.trim();
    const file = els.imageInput.files?.[0];
    const existingProject = allProjects.find((item) => item.id === id);
    let imageUrl = currentPreviewUrl || null;

    if (file) {
      imageUrl = await uploadImage(file);
      if (existingProject?.image_url) await removeStoredImage(existingProject.image_url);
    }

    if (!imageUrl) throw new Error("Please upload a project image.");

    const payload = {
      title: fields.title.value.trim(),
      description: fields.description.value.trim(),
      live_url: fields.liveUrl.value.trim(),
      github_url: githubUrl,
      image_url: imageUrl,
      is_featured: fields.isFeatured.value === "true",
      is_published: true,
      updated_at: new Date().toISOString(),
    };

    if (!payload.title || !payload.description || !payload.live_url) {
      throw new Error("Please fill in all required fields.");
    }

    if (id) {
      await updateProject(id, payload);
      setMessage(els.message, "Project updated successfully.", "success");
    } else {
      payload.created_by = currentUser.id;
      payload.display_order = allProjects.length + 1;
      await createProject(payload);
      setMessage(els.message, "Project created successfully.", "success");
    }

    await fetchProjects();
    window.setTimeout(closeModal, 600);
  } catch (error) {
    console.error(error);
    setMessage(els.message, error.message || "Unable to save project.", "error");
  } finally {
    if (els.saveBtn) els.saveBtn.disabled = false;
  }
});

els.grid?.addEventListener("click", async (event) => {
  const actionEl = event.target.closest("[data-action]");
  if (!actionEl) return;

  const { action, id } = actionEl.dataset;
  const project = allProjects.find((item) => item.id === id);

  try {
    if (action === "edit" && project) {
      fillForm(project);
      openModal(true);
    }

    if (action === "delete" && id) {
      await deleteProject(id);
    }
  } catch (error) {
    console.error(error);
    window.alert(error.message || "Action failed.");
  }
});

els.searchInput?.addEventListener("input", (event) => {
  const value = event.target.value.trim().toLowerCase();
  const filtered = allProjects.filter((project) =>
    [project.title, project.description, project.live_url, project.github_url]
      .filter(Boolean)
      .some((item) => item.toLowerCase().includes(value))
  );
  renderProjects(filtered);
});

els.logoutLink?.addEventListener("click", async (event) => {
  event.preventDefault();
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

(async function init() {
  try {
    ensureSupabase();
    const okay = await requireAuth();
    if (!okay) return;
    await Promise.all([fetchProjects(), loadProfilePhoto()]);
  } catch (error) {
    console.error(error);
    window.alert(error.message || "Failed to initialize dashboard.");
  }
})();

fields.githubUrl?.addEventListener('input', () => {
  try {
    normalizeGithubUrl(fields.githubUrl.value);
    fields.githubUrl.setCustomValidity('');
  } catch (error) {
    fields.githubUrl.setCustomValidity(error.message);
  }
});

const photoInput = qs('#profilePhotoFile');
const photoPreview = qs('#profilePhotoPreview');
const photoSave = qs('#saveProfilePhotoBtn');
const photoMessage = qs('#profilePhotoMessage');
let savedProfilePhoto = 'assets/noor-farra.jpg';
let photoPreviewUrl = null;

async function loadProfilePhoto() {
  const { data, error } = await supabase.from('portfolio_settings')
    .select('profile_image_url').eq('id', 'profile').maybeSingle();
  if (error) throw error;
  savedProfilePhoto = data?.profile_image_url || 'assets/noor-farra.jpg';
  if (!photoInput?.files?.length && photoPreview) photoPreview.src = savedProfilePhoto;
}

photoInput?.addEventListener('change', () => {
  if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
  photoPreviewUrl = null;
  const file = photoInput.files?.[0];
  setMessage(photoMessage, '');
  photoSave.disabled = !file;
  if (!file) { photoPreview.src = savedProfilePhoto; return; }
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type) || file.size > 5 * 1024 * 1024) {
    setMessage(photoMessage, 'Choose a JPG, PNG, WebP, or AVIF image up to 5 MB.', 'error');
    photoInput.value = '';
    photoPreview.src = savedProfilePhoto;
    photoSave.disabled = true;
    return;
  }
  photoPreviewUrl = URL.createObjectURL(file);
  photoPreview.src = photoPreviewUrl;
});

qs('#profilePhotoForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const file = photoInput.files?.[0];
  if (!file) return;
  photoSave.disabled = true;
  photoInput.disabled = true;
  let newPath = null;
  try {
    setMessage(photoMessage, 'Saving your photo...');
    const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024) throw new Error('Choose a supported image up to 5 MB.');
    newPath = `profile/${crypto.randomUUID()}.${extensions[file.type]}`;
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET)
      .upload(newPath, file, { cacheControl: '3600', upsert: false });
    if (uploadError) { newPath = null; throw uploadError; }
    const { data: image } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(newPath);
    const { error } = await supabase.from('portfolio_settings').upsert({
      id: 'profile', profile_image_url: image.publicUrl, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
    savedProfilePhoto = image.publicUrl;
    newPath = null;
    photoInput.value = '';
    photoPreview.src = savedProfilePhoto;
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl);
    photoPreviewUrl = null;
    setMessage(photoMessage, 'Profile photo updated. It is now live on your portfolio.', 'success');
  } catch (error) {
    if (newPath) {
      try { await supabase.storage.from(STORAGE_BUCKET).remove([newPath]); }
      catch (cleanupError) { console.error('Could not clean up the unused upload.', cleanupError); }
    }
    setMessage(photoMessage, error.message || 'Unable to save your photo. Please try again.', 'error');
  } finally {
    photoInput.disabled = false;
    photoSave.disabled = !photoInput.files?.length;
  }
});
