/**
 * QA Portfolio Public Website Frontend Logic
 * Consumes Task 5 Public APIs: Profile, Skills, Projects, Experiences, Contacts
 */

// Utility: Prevent XSS by escaping HTML entities
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Global State
const state = {
  profile: null,
  skills: [],
  categories: [],
  projects: [],
  activeCategory: 'all',
  searchQuery: '',
  featuredOnly: false,
  experiences: [],
};

// -----------------------------------------------------------------------------
// 1. Hero Section (GET /api/profile)
// -----------------------------------------------------------------------------
async function loadProfile() {
  const heroEl = document.getElementById('hero-content');
  if (!heroEl) return;

  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const profile = body.data || {};
    state.profile = profile;

    // Build truth-adhering content for Muhammad Irfan Trinugroho
    const isMockOrAdmin =
      !profile.name ||
      profile.name === 'QA Portfolio Admin' ||
      profile.name === 'QA Portfolio' ||
      profile.name === 'Admin';

    const rawName = isMockOrAdmin ? 'Muhammad Irfan Trinugroho' : profile.name;
    const rawTitle = (!profile.title || profile.title === 'QA Engineer')
      ? 'Quality Assurance Enthusiast'
      : profile.title;
    const rawBio = (!profile.bio || profile.bio === 'QA Portfolio and Test Automation Showcase')
      ? 'Informatics graduate with hands-on QA experience across freelance and internship roles at Noctura Kreasi Sistema, PT Len Industri (Persero), and PT Vortex Buana Edumedia. Skilled in manual functional testing, UAT support, test scenario design, defect tracking, and automation testing using Katalon Studio, Cypress, and Postman.'
      : profile.bio;

    const name = escapeHtml(rawName);
    const title = escapeHtml(rawTitle);
    const bio = escapeHtml(rawBio);

    // Only render location if truthy and non-empty
    const rawLocation = profile.location || 'Sleman, Yogyakarta, Indonesia';
    const locationHtml = `
      <div class="hero-meta-item">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>${escapeHtml(rawLocation)}</span>
      </div>`;

    // Social links (ensure all standard links are present)
    const github = profile.socialLinks?.github || 'https://github.com/phannstastic';
    const linkedin = profile.socialLinks?.linkedin || 'https://www.linkedin.com/in/muhirfant/';
    const instagram = profile.socialLinks?.instagram || 'https://www.instagram.com/irfantrinugroho/';

    let socialLinksHtml = '<div class="hero-social-links" style="display:flex; gap:0.5rem; justify-content:center; margin-top:1rem;">';
    socialLinksHtml += `
      <a href="${escapeHtml(github)}" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="GitHub Profile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
      </a>`;
    socialLinksHtml += `
      <a href="${escapeHtml(linkedin)}" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="LinkedIn Profile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
      </a>`;
    socialLinksHtml += `
      <a href="${escapeHtml(instagram)}" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="Instagram Profile">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
      </a>`;
    socialLinksHtml += '</div>';

    heroEl.innerHTML = `
      <h1 class="hero-title">${name}</h1>
      <p class="hero-subtitle">${title}</p>
      <p class="hero-bio">${bio}</p>
      ${locationHtml ? `<div class="hero-meta-row">${locationHtml}</div>` : ''}
      <div class="hero-cta-group">
        <a href="#projects" class="btn btn-primary">
          <span>Explore Projects</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
        </a>
        <a href="/docs/cv-muhammad-irfan-trinugroho.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          <span>Download CV</span>
        </a>
        <a href="/docs/portfolio-muhammad-irfan-trinugroho.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>
          <span>Portfolio PDF</span>
        </a>
        <a href="#contact" class="btn btn-secondary">Get in Touch</a>
      </div>
      ${socialLinksHtml}
    `;
  } catch (err) {
    console.error('Failed to load profile:', err);
    heroEl.innerHTML = `
      <h1 class="hero-title">Muhammad Irfan Trinugroho</h1>
      <p class="hero-subtitle">Quality Assurance Enthusiast</p>
      <p class="hero-bio">Informatics graduate with hands-on QA experience across freelance and internship roles at Noctura Kreasi Sistema, PT Len Industri (Persero), and PT Vortex Buana Edumedia.</p>
      <div class="hero-cta-group">
        <a href="#projects" class="btn btn-primary">Explore Projects</a>
        <a href="#contact" class="btn btn-secondary">Contact</a>
      </div>
      <div class="hero-social-links" style="display:flex; gap:0.5rem; justify-content:center; margin-top:1rem;">
        <a href="https://github.com/phannstastic" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="GitHub Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        </a>
        <a href="https://www.linkedin.com/in/muhirfant/" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="LinkedIn Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
        </a>
        <a href="https://www.instagram.com/irfantrinugroho/" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="Instagram Profile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
        </a>
      </div>
    `;
  }
}

// -----------------------------------------------------------------------------
// 2. Skills Section (GET /api/skills)
// -----------------------------------------------------------------------------
async function loadSkills() {
  const container = document.getElementById('skills-container');
  if (!container) return;

  try {
    const res = await fetch('/api/skills');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const data = body.data || {};

    const categories = data.categories || [];
    const skills = data.skills || [];
    state.categories = categories;
    state.skills = skills;

    if (categories.length === 0 && skills.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p>No technical skills currently recorded.</p>
        </div>`;
      return;
    }

    // Render category cards
    let html = '';
    for (const cat of categories) {
      const items = cat.items || [];
      html += `
        <article class="skill-category-card">
          <div class="skill-card-header">
            <h3 class="skill-card-title">${escapeHtml(cat.category)}</h3>
            <span class="skill-badge-count">${items.length} skills</span>
          </div>
          <div class="skill-chips-wrap">
            ${items.map(item => `<span class="skill-chip">${escapeHtml(item)}</span>`).join('')}
          </div>
        </article>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load skills:', err);
    container.innerHTML = `
      <div class="error-state" style="grid-column: 1 / -1;">
        <p>Failed to load technical skills. Please try again later.</p>
        <button class="btn btn-secondary btn-sm" onclick="loadSkills()" style="margin-top:0.75rem;">Retry</button>
      </div>`;
  }
}

// -----------------------------------------------------------------------------
// 3. Projects Section (GET /api/projects) & Search/Filter
// -----------------------------------------------------------------------------
async function loadProjects() {
  const container = document.getElementById('projects-container');
  if (!container) return;

  container.innerHTML = `
    <div class="skeleton" style="height: 280px; border-radius: var(--radius-lg);"></div>
    <div class="skeleton" style="height: 280px; border-radius: var(--radius-lg);"></div>
    <div class="skeleton" style="height: 280px; border-radius: var(--radius-lg);"></div>
  `;

  try {
    const params = new URLSearchParams();
    if (state.searchQuery.trim()) {
      params.append('q', state.searchQuery.trim());
    }
    if (state.activeCategory && state.activeCategory !== 'all') {
      params.append('category', state.activeCategory);
    }
    if (state.featuredOnly) {
      params.append('featured', 'true');
    }

    const url = `/api/projects${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const projects = body.data || [];
    state.projects = projects;

    renderProjects(projects);
  } catch (err) {
    console.error('Failed to load projects:', err);
    container.innerHTML = `
      <div class="error-state" style="grid-column: 1 / -1;">
        <p>Failed to load projects. Please try again.</p>
        <button class="btn btn-secondary btn-sm" onclick="loadProjects()" style="margin-top:0.75rem;">Retry</button>
      </div>`;
  }
}

function renderProjects(projects) {
  const container = document.getElementById('projects-container');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 0.75rem;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <p style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">No matching projects found</p>
        <p>Try refining your search terms or clearing the category filter.</p>
      </div>`;
    return;
  }

  let html = '';
  for (const p of projects) {
    const techItems = (p.techStack || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    html += `
      <article class="project-card">
        <div class="project-card-header">
          <span class="project-category-tag">${escapeHtml(p.category)}</span>
          ${p.isFeatured ? '<span class="featured-badge">&starf; Featured</span>' : ''}
        </div>
        <h3 class="project-card-title">${escapeHtml(p.title)}</h3>
        <p class="project-card-desc">${escapeHtml(p.description)}</p>
        <div class="project-tech-stack">
          ${techItems.slice(0, 5).map(t => `<span class="tech-tag">${escapeHtml(t)}</span>`).join('')}
          ${techItems.length > 5 ? `<span class="tech-tag">+${techItems.length - 5}</span>` : ''}
        </div>
        <div class="project-card-footer">
          <button class="btn btn-secondary btn-sm view-detail-btn" data-slug="${escapeHtml(p.slug)}">
            View Details
          </button>
          <div class="project-links">
            ${p.githubUrl ? `
              <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="GitHub Repository">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
              </a>` : ''}
            ${p.liveDemoUrl ? `
              <a href="${escapeHtml(p.liveDemoUrl)}" target="_blank" rel="noopener noreferrer" class="icon-link" aria-label="Live Demo or Source Code">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
              </a>` : ''}
          </div>
        </div>
      </article>`;
  }

  container.innerHTML = html;

  // Attach click listeners to view detail buttons
  container.querySelectorAll('.view-detail-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const slug = e.currentTarget.getAttribute('data-slug');
      if (slug) openProjectModal(slug);
    });
  });
}

// -----------------------------------------------------------------------------
// 4. Project Detail Modal (GET /api/projects/:slug)
// -----------------------------------------------------------------------------
async function openProjectModal(slug) {
  const modalBackdrop = document.getElementById('project-modal');
  const modalContent = document.getElementById('modal-body');
  if (!modalBackdrop || !modalContent) return;

  modalBackdrop.classList.add('open');
  modalContent.innerHTML = `
    <div style="text-align: center; padding: 2rem;">
      <p style="color: var(--text-secondary);">Loading project details...</p>
    </div>`;

  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(slug)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const p = body.data || {};

    const techItems = (p.techStack || '').split(',').map(s => s.trim()).filter(Boolean);

    modalContent.innerHTML = `
      <div style="margin-bottom: 1.25rem;">
        <span class="project-category-tag" style="margin-right: 0.5rem;">${escapeHtml(p.category)}</span>
        ${p.isFeatured ? '<span class="featured-badge">&starf; Featured Project</span>' : ''}
      </div>
      <h2 style="font-size: 1.75rem; margin-bottom: 1rem;">${escapeHtml(p.title)}</h2>
      <p style="color: var(--text-secondary); line-height: 1.7; margin-bottom: 1.5rem; white-space: pre-line;">${escapeHtml(p.description)}</p>
      
      <div style="margin-bottom: 1.75rem;">
        <h4 style="font-size: 0.95rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem;">Technologies &amp; Tools</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 0.4rem;">
          ${techItems.map(t => `<span class="skill-chip">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; padding-top: 1.25rem; border-top: 1px solid var(--border-subtle);">
        ${p.githubUrl ? `
          <a href="${escapeHtml(p.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
            <span>GitHub Repository</span>
          </a>` : ''}
        ${p.liveDemoUrl ? `
          <a href="${escapeHtml(p.liveDemoUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
            <span>Project Repository / Demo</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>` : ''}
      </div>
    `;
  } catch (err) {
    console.error('Failed to open project modal:', err);
    modalContent.innerHTML = `
      <div class="error-state">
        <p>Failed to retrieve project details. Please try again.</p>
      </div>`;
  }
}

function closeProjectModal() {
  const modalBackdrop = document.getElementById('project-modal');
  if (modalBackdrop) modalBackdrop.classList.remove('open');
}

// -----------------------------------------------------------------------------
// 5. Experiences Section (GET /api/experiences)
// -----------------------------------------------------------------------------
async function loadExperiences() {
  const container = document.getElementById('experiences-container');
  if (!container) return;

  try {
    const res = await fetch('/api/experiences');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.json();
    const experiences = body.data || [];
    state.experiences = experiences;

    if (experiences.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>No career experiences recorded yet.</p>
        </div>`;
      return;
    }

    let html = '';
    for (const exp of experiences) {
      const periodText = exp.isCurrent
        ? `${escapeHtml(exp.startDate)} &mdash; Present`
        : `${escapeHtml(exp.startDate)} &mdash; ${escapeHtml(exp.endDate || 'N/A')}`;

      html += `
        <div class="timeline-item">
          <div class="timeline-marker ${exp.isCurrent ? 'active' : ''}"></div>
          <article class="timeline-card">
            <div class="timeline-header">
              <div>
                <h3 class="timeline-role">${escapeHtml(exp.role)}</h3>
                <p class="timeline-company">${escapeHtml(exp.company)}</p>
              </div>
              ${exp.isCurrent ? '<span class="timeline-current-badge">Current Position</span>' : ''}
            </div>
            <div class="timeline-meta">
              <span class="timeline-period">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${periodText}
              </span>
              ${exp.location ? `<span>&bull;</span><span>${escapeHtml(exp.location)}</span>` : ''}
            </div>
            <p class="timeline-desc">${escapeHtml(exp.description)}</p>
            ${exp.company && exp.company.includes('Len Industri') ? `
              <div style="margin-top: 1rem;">
                <a href="/docs/certificates/sertifikat-magang-len-industri.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  <span>Sertifikat OJT Resmi (Nilai 91.67 / Grade A)</span>
                </a>
              </div>` : ''}
            ${exp.company && exp.company.includes('Vortex') ? `
              <div style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <a href="/docs/certificates/sertifikat-magang-vortex-buana-edumedia.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  <span>Sertifikat Magang Batch 4</span>
                </a>
                <a href="/docs/certificates/surat-pengalaman-magang-vortex.pdf" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:0.4rem;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  <span>Surat Keterangan Magang</span>
                </a>
              </div>` : ''}
          </article>
        </div>`;
    }

    container.innerHTML = html;
  } catch (err) {
    console.error('Failed to load experiences:', err);
    container.innerHTML = `
      <div class="error-state">
        <p>Failed to load experiences timeline.</p>
        <button class="btn btn-secondary btn-sm" onclick="loadExperiences()" style="margin-top:0.75rem;">Retry</button>
      </div>`;
  }
}

// -----------------------------------------------------------------------------
// 6. Contact Form (POST /api/contacts)
// -----------------------------------------------------------------------------
function setupContactForm() {
  const form = document.getElementById('contact-form');
  const messageInput = document.getElementById('contact-message');
  const counterEl = document.getElementById('char-counter');
  const banner = document.getElementById('contact-feedback');
  const submitBtn = document.getElementById('contact-submit-btn');

  if (!form || !messageInput) return;

  // Live character counter
  messageInput.addEventListener('input', () => {
    const len = messageInput.value.length;
    if (counterEl) {
      counterEl.textContent = `${len} / 500 characters (minimum 10)`;
      counterEl.style.color = (len < 10 || len > 500) ? 'var(--accent-rose)' : 'var(--text-muted)';
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('contact-name')?.value.trim() || '';
    const email = document.getElementById('contact-email')?.value.trim() || '';
    const message = messageInput.value.trim();

    // Client-side validations
    if (!name) {
      showFeedback('Please provide your name.', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showFeedback('Please provide a valid email address.', 'error');
      return;
    }

    if (message.length < 10 || message.length > 500) {
      showFeedback('Message must be between 10 and 500 characters.', 'error');
      return;
    }

    // Set submitting UI state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending message...';
    hideFeedback();

    try {
      // Intentionally omitting subject as it is optional per Task 5 PRD contract
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });

      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message || 'Failed to submit contact message.');
      }

      showFeedback('Thank you! Your message has been sent successfully.', 'success');
      form.reset();
      if (counterEl) counterEl.textContent = '0 / 500 characters (minimum 10)';
    } catch (err) {
      console.error('Contact form submission error:', err);
      showFeedback(err.message || 'Failed to send message. Please try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });

  function showFeedback(msg, type) {
    if (!banner) return;
    banner.className = `feedback-banner ${type}`;
    banner.textContent = msg;
    banner.style.display = 'flex';
  }

  function hideFeedback() {
    if (banner) banner.style.display = 'none';
  }
}

// -----------------------------------------------------------------------------
// 7. Interactive Controls & Initialization
// -----------------------------------------------------------------------------
function setupInteractiveControls() {
  // Search input debounce
  const searchInput = document.getElementById('project-search');
  if (searchInput) {
    let timeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        state.searchQuery = e.target.value;
        loadProjects();
      }, 300);
    });
  }

  // Category filter pills
  const filterPills = document.querySelectorAll('.filter-pill');
  filterPills.forEach(pill => {
    pill.addEventListener('click', (e) => {
      filterPills.forEach(p => p.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.activeCategory = e.currentTarget.getAttribute('data-category') || 'all';
      loadProjects();
    });
  });

  // Featured toggle
  const featuredCheckbox = document.getElementById('featured-toggle');
  if (featuredCheckbox) {
    featuredCheckbox.addEventListener('change', (e) => {
      state.featuredOnly = e.target.checked;
      loadProjects();
    });
  }

  // Modal close button and ESC listener
  const modalCloseBtn = document.getElementById('modal-close-btn');
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeProjectModal);
  }

  const modalBackdrop = document.getElementById('project-modal');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeProjectModal();
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeProjectModal();
  });

  // Mobile navigation hamburger toggle
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const navLinks = document.getElementById('nav-links');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
      });
    });
  }
}

// Bootstrap upon DOM loaded
document.addEventListener('DOMContentLoaded', () => {
  loadProfile();
  loadSkills();
  loadProjects();
  loadExperiences();
  setupContactForm();
  setupInteractiveControls();
});
