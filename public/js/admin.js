/**
 * ============================================================================
 * QA PORTFOLIO - ADMIN CMS DASHBOARD CONTROLLER
 * Architecture: Vanilla JS, Session-based JWT, Security-conscious API client
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // Security & Utilities
  // --------------------------------------------------------------------------

  /**
   * Escape HTML to prevent DOM-based XSS when rendering user-supplied strings.
   */
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Format ISO date string into readable format.
   */
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  }

  // --------------------------------------------------------------------------
  // Authentication & Session Management
  // --------------------------------------------------------------------------

  const STORAGE_KEY_TOKEN = 'admin_token';
  const STORAGE_KEY_USER = 'admin_user';

  function getToken() {
    return sessionStorage.getItem(STORAGE_KEY_TOKEN);
  }

  function getUser() {
    try {
      const userRaw = sessionStorage.getItem(STORAGE_KEY_USER);
      return userRaw ? JSON.parse(userRaw) : null;
    } catch {
      return null;
    }
  }

  function setSession(token, user) {
    sessionStorage.setItem(STORAGE_KEY_TOKEN, token);
    sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
  }

  function clearSession() {
    sessionStorage.removeItem(STORAGE_KEY_TOKEN);
    sessionStorage.removeItem(STORAGE_KEY_USER);
  }

  function logout() {
    clearSession();
    window.location.href = '/login';
  }

  /**
   * Secure fetch wrapper for Admin API calls.
   * Attaches Bearer token and handles expired/invalid token automatically.
   */
  async function adminFetch(url, options = {}) {
    const token = getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (response.status === 401 || response.status === 403) {
        // Token invalid, expired, or role changed
        clearSession();
        window.location.href = '/login';
        throw new Error('Your session has expired. Please sign in again.');
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.message || data.error || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // --------------------------------------------------------------------------
  // Toast Notifications
  // --------------------------------------------------------------------------

  function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');

    const iconSvg = type === 'success'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';

    toast.innerHTML = `
      ${iconSvg}
      <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.transition = 'opacity 0.25s, transform 0.25s';
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // --------------------------------------------------------------------------
  // Modal Utilities
  // --------------------------------------------------------------------------

  function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function setupModalDismissers() {
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-backdrop');
        if (modal) {
          modal.classList.remove('open');
          document.body.style.overflow = '';
        }
      });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.open').forEach((m) => {
          m.classList.remove('open');
        });
        document.body.style.overflow = '';
      }
    });
  }

  // --------------------------------------------------------------------------
  // Confirm Delete Dialog Helper
  // --------------------------------------------------------------------------

  let confirmDeleteCallback = null;

  function showConfirmDelete(title, message, onConfirm) {
    const titleEl = document.getElementById('confirm-modal-title');
    const msgEl = document.getElementById('confirm-modal-message');
    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    confirmDeleteCallback = onConfirm;
    openModal('confirm-modal');
  }

  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
      if (typeof confirmDeleteCallback === 'function') {
        const cb = confirmDeleteCallback;
        confirmDeleteCallback = null;
        closeModal('confirm-modal');
        await cb();
      }
    });
  }

  // ==========================================================================
  // PAGE CONTROLLERS
  // ==========================================================================

  // Check which page we are on
  const isLoginPage = Boolean(document.getElementById('login-form'));
  const isAdminDashboard = Boolean(document.getElementById('admin-sidebar'));

  // --------------------------------------------------------------------------
  // 1. LOGIN PAGE CONTROLLER
  // --------------------------------------------------------------------------
  if (isLoginPage) {
    // If already logged in, redirect directly to admin dashboard
    if (getToken()) {
      window.location.href = '/admin';
    }

    const loginForm = document.getElementById('login-form');
    const feedbackBanner = document.getElementById('login-feedback');
    const submitBtn = document.getElementById('login-submit-btn');

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email || !password) {
        showLoginError('Please enter both email and password.');
        return;
      }

      // Live validation for basic email format
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showLoginError('Please enter a valid email address.');
        return;
      }

      setLoadingState(submitBtn, true, 'Signing in...');
      hideLoginError();

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errMsg = data.message || data.error || 'Invalid email or password.';
          showLoginError(errMsg);
          setLoadingState(submitBtn, false, 'Sign In to Dashboard');
          return;
        }

        // Store session token securely in sessionStorage
        if (data.data?.token && data.data?.user) {
          setSession(data.data.token, data.data.user);
          showToast('Signed in successfully! Redirecting...', 'success');
          setTimeout(() => {
            window.location.href = '/admin';
          }, 400);
        } else {
          showLoginError('Authentication response incomplete. Please try again.');
          setLoadingState(submitBtn, false, 'Sign In to Dashboard');
        }
      } catch (err) {
        showLoginError('Unable to connect to the authentication service. Please check your network.');
        setLoadingState(submitBtn, false, 'Sign In to Dashboard');
      }
    });

    function showLoginError(msg) {
      if (!feedbackBanner) return;
      feedbackBanner.className = 'feedback-banner error';
      feedbackBanner.style.display = 'flex';
      feedbackBanner.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
        <span>${escapeHtml(msg)}</span>
      `;
    }

    function hideLoginError() {
      if (!feedbackBanner) return;
      feedbackBanner.style.display = 'none';
      feedbackBanner.innerHTML = '';
    }
  }

  // --------------------------------------------------------------------------
  // 2. ADMIN DASHBOARD CONTROLLER
  // --------------------------------------------------------------------------
  if (isAdminDashboard) {
    // Auth Guard: ensure token exists
    if (!getToken()) {
      window.location.href = '/login';
      return;
    }

    // Initialize UI
    setupModalDismissers();
    setupAdminNavigation();
    setupUserBadge();
    setupOverview();
    setupProjectsCRUD();
    setupExperiencesCRUD();
    setupContactsManagement();
    setupMobileSidebar();

    // Initial load: Overview
    handleViewSwitch('overview');
  }

  // --------------------------------------------------------------------------
  // Helper: Button Loading State
  // --------------------------------------------------------------------------
  function setLoadingState(btn, isLoading, text) {
    if (!btn) return;
    btn.disabled = isLoading;
    if (isLoading) {
      btn.setAttribute('data-original-text', btn.innerHTML);
      btn.innerHTML = `<span style="display:inline-block; animation: spin 1s infinite linear;">&#9696;</span> ${escapeHtml(text || 'Processing...')}`;
    } else {
      btn.innerHTML = text || btn.getAttribute('data-original-text') || 'Submit';
    }
  }

  // --------------------------------------------------------------------------
  // Navigation & User Info
  // --------------------------------------------------------------------------
  function setupUserBadge() {
    const user = getUser();
    const nameEl = document.getElementById('user-name');
    const roleEl = document.getElementById('user-role');
    const avatarEl = document.getElementById('user-avatar-initials');

    if (user && user.name) {
      if (nameEl) nameEl.textContent = user.name;
      if (roleEl) roleEl.textContent = (user.role || 'ADMIN').toUpperCase();
      if (avatarEl) {
        avatarEl.textContent = user.name.charAt(0).toUpperCase();
      }
    }

    const logoutTopBtn = document.getElementById('topbar-logout-btn');
    const logoutSideBtn = document.getElementById('sidebar-logout-btn');
    if (logoutTopBtn) logoutTopBtn.addEventListener('click', logout);
    if (logoutSideBtn) logoutSideBtn.addEventListener('click', logout);
  }

  function setupAdminNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-link[data-view]');
    navLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const view = link.getAttribute('data-view');
        handleViewSwitch(view);
      });
    });

    const quickMessagesBtn = document.getElementById('btn-quick-view-messages');
    if (quickMessagesBtn) {
      quickMessagesBtn.addEventListener('click', () => {
        handleViewSwitch('contacts');
      });
    }

    // Hash change support
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (['overview', 'projects', 'experiences', 'contacts'].includes(hash)) {
        handleViewSwitch(hash);
      }
    });
  }

  function handleViewSwitch(viewName) {
    const validViews = ['overview', 'projects', 'experiences', 'contacts'];
    const targetView = validViews.includes(viewName) ? viewName : 'overview';

    // Update Sidebar active state
    document.querySelectorAll('.sidebar-link[data-view]').forEach((l) => {
      if (l.getAttribute('data-view') === targetView) {
        l.classList.add('active');
      } else {
        l.classList.remove('active');
      }
    });

    // Update Views visibility
    document.querySelectorAll('.admin-view').forEach((v) => {
      v.classList.remove('active');
    });

    const targetSection = document.getElementById(`view-${targetView}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    // Update Page Title
    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      const titles = {
        overview: 'Dashboard Overview',
        projects: 'Projects Management',
        experiences: 'Experiences Management',
        contacts: 'Contact Inquiries',
      };
      titleEl.textContent = titles[targetView] || 'Admin Dashboard';
    }

    // Update URL hash without reload
    if (window.location.hash !== `#${targetView}`) {
      history.replaceState(null, '', `#${targetView}`);
    }

    // Close mobile sidebar if open
    closeMobileSidebar();

    // Trigger View Data Reload
    if (targetView === 'overview') loadOverviewData();
    if (targetView === 'projects') loadProjectsData();
    if (targetView === 'experiences') loadExperiencesData();
    if (targetView === 'contacts') loadContactsData();
  }

  function setupMobileSidebar() {
    const toggleBtn = document.getElementById('mobile-sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    if (toggleBtn && sidebar && backdrop) {
      toggleBtn.style.display = 'inline-flex';
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        backdrop.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
      });

      backdrop.addEventListener('click', closeMobileSidebar);
    }
  }

  function closeMobileSidebar() {
    const sidebar = document.getElementById('admin-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    if (sidebar) sidebar.classList.remove('open');
    if (backdrop) backdrop.style.display = 'none';
  }

  // ==========================================================================
  // SECTION 1: OVERVIEW
  // ==========================================================================
  let cachedProjects = [];
  let cachedExperiences = [];
  let cachedContacts = [];

  function setupOverview() {
    // Initial binding
  }

  async function loadOverviewData() {
    try {
      const [projRes, expRes, contactRes] = await Promise.all([
        adminFetch('/api/admin/projects'),
        adminFetch('/api/admin/experiences'),
        adminFetch('/api/admin/contacts'),
      ]);

      cachedProjects = projRes.data || [];
      cachedExperiences = expRes.data || [];
      cachedContacts = contactRes.data || [];

      // Update counters
      const projCountEl = document.getElementById('stat-projects-count');
      const expCountEl = document.getElementById('stat-experiences-count');
      const contactCountEl = document.getElementById('stat-contacts-count');
      const unreadCountEl = document.getElementById('stat-unread-count');
      const sidebarUnreadEl = document.getElementById('sidebar-unread-badge');

      if (projCountEl) projCountEl.textContent = cachedProjects.length;
      if (expCountEl) expCountEl.textContent = cachedExperiences.length;
      if (contactCountEl) contactCountEl.textContent = cachedContacts.length;

      const unreadCount = cachedContacts.filter((c) => c.status === 'unread').length;
      if (unreadCountEl) unreadCountEl.textContent = unreadCount;

      if (sidebarUnreadEl) {
        if (unreadCount > 0) {
          sidebarUnreadEl.textContent = unreadCount;
          sidebarUnreadEl.style.display = 'inline-block';
        } else {
          sidebarUnreadEl.style.display = 'none';
        }
      }

      // Render recent messages (max 5)
      renderOverviewRecentContacts(cachedContacts.slice(0, 5));
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard overview', 'error');
    }
  }

  function renderOverviewRecentContacts(contactsList) {
    const tbody = document.getElementById('overview-contacts-tbody');
    if (!tbody) return;

    if (!contactsList || contactsList.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No contact messages received yet.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = contactsList
      .map(
        (c) => `
        <tr>
          <td>${escapeHtml(formatDate(c.createdAt))}</td>
          <td>
            <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(c.name)}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(c.email)}</div>
          </td>
          <td>${escapeHtml(c.subject || 'General Inquiry')}</td>
          <td>
            <span class="status-badge ${escapeHtml(c.status)}">${escapeHtml(c.status)}</span>
          </td>
          <td>
            <button class="btn btn-secondary btn-sm" onclick="window.viewContactDetail(${c.id})">
              View
            </button>
          </td>
        </tr>
      `
      )
      .join('');
  }

  // ==========================================================================
  // SECTION 2: PROJECTS MANAGEMENT
  // ==========================================================================
  function setupProjectsCRUD() {
    const createBtn = document.getElementById('btn-create-project');
    const projectForm = document.getElementById('project-form');
    const saveBtn = document.getElementById('project-save-btn');

    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openProjectModalForCreate();
      });
    }

    if (projectForm) {
      projectForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('project-form-id').value;
        const title = document.getElementById('project-title').value.trim();
        const slug = document.getElementById('project-slug').value.trim();
        const category = document.getElementById('project-category').value.trim();
        const techStack = document.getElementById('project-tech-stack').value.trim();
        const description = document.getElementById('project-description').value.trim();
        const githubUrl = document.getElementById('project-github-url').value.trim() || null;
        const liveDemoUrl = document.getElementById('project-live-url').value.trim() || null;
        const imageUrl = document.getElementById('project-image-url').value.trim() || null;
        const isFeatured = document.getElementById('project-is-featured').checked;
        const sortOrder = parseInt(document.getElementById('project-sort-order').value, 10) || 0;

        // Validation
        if (!title || !category || !techStack || !description) {
          showToast('Please fill in all required fields marked with *', 'error');
          return;
        }

        const payload = {
          title,
          category,
          techStack,
          description,
          githubUrl,
          liveDemoUrl,
          imageUrl,
          isFeatured,
          sortOrder,
        };

        if (slug) {
          payload.slug = slug;
        }

        setLoadingState(saveBtn, true, 'Saving...');

        try {
          if (id) {
            // Update existing
            await adminFetch(`/api/admin/projects/${id}`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            });
            showToast('Project updated successfully!', 'success');
          } else {
            // Create new
            await adminFetch('/api/admin/projects', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            showToast('Project created successfully!', 'success');
          }

          closeModal('project-modal');
          loadProjectsData();
          loadOverviewData();
        } catch (err) {
          showToast(err.message || 'Operation failed', 'error');
        } finally {
          setLoadingState(saveBtn, false, 'Save Project');
        }
      });
    }
  }

  function openProjectModalForCreate() {
    const modalTitle = document.getElementById('project-modal-title');
    if (modalTitle) modalTitle.textContent = 'Add New Project';

    document.getElementById('project-form-id').value = '';
    document.getElementById('project-title').value = '';
    document.getElementById('project-slug').value = '';
    document.getElementById('project-category').value = '';
    document.getElementById('project-tech-stack').value = '';
    document.getElementById('project-description').value = '';
    document.getElementById('project-github-url').value = '';
    document.getElementById('project-live-url').value = '';
    document.getElementById('project-image-url').value = '';
    document.getElementById('project-is-featured').checked = false;
    document.getElementById('project-sort-order').value = '0';

    openModal('project-modal');
  }

  window.openProjectModalForEdit = function (id) {
    const project = cachedProjects.find((p) => p.id === id);
    if (!project) return;

    const modalTitle = document.getElementById('project-modal-title');
    if (modalTitle) modalTitle.textContent = 'Edit Project';

    document.getElementById('project-form-id').value = project.id;
    document.getElementById('project-title').value = project.title || '';
    document.getElementById('project-slug').value = project.slug || '';
    document.getElementById('project-category').value = project.category || '';
    document.getElementById('project-tech-stack').value = project.techStack || '';
    document.getElementById('project-description').value = project.description || '';
    document.getElementById('project-github-url').value = project.githubUrl || '';
    document.getElementById('project-live-url').value = project.liveDemoUrl || '';
    document.getElementById('project-image-url').value = project.imageUrl || '';
    document.getElementById('project-is-featured').checked = Boolean(project.isFeatured);
    document.getElementById('project-sort-order').value = project.sortOrder ?? 0;

    openModal('project-modal');
  };

  window.confirmDeleteProject = function (id, title) {
    showConfirmDelete(
      'Delete Project',
      `Are you sure you want to delete "${title}"? This cannot be undone.`,
      async () => {
        try {
          await adminFetch(`/api/admin/projects/${id}`, { method: 'DELETE' });
          showToast('Project deleted successfully', 'success');
          loadProjectsData();
          loadOverviewData();
        } catch (err) {
          showToast(err.message || 'Failed to delete project', 'error');
        }
      }
    );
  };

  async function loadProjectsData() {
    const tbody = document.getElementById('projects-tbody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem;">
          <div class="skeleton" style="height: 24px; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 24px;"></div>
        </td>
      </tr>
    `;

    try {
      const res = await adminFetch('/api/admin/projects');
      cachedProjects = res.data || [];

      if (cachedProjects.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              No projects found. Click "+ Add Project" to create your first portfolio entry.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = cachedProjects
        .map((p) => {
          const featuredHtml = p.isFeatured
            ? `<span class="badge-featured">&#9733; Featured</span>`
            : `<span style="color: var(--text-muted); font-size: 0.8rem;">No</span>`;

          const techBadges = (p.techStack || '')
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
            .slice(0, 3)
            .map((t) => `<span style="display:inline-block; font-size: 0.75rem; padding: 0.1rem 0.4rem; background: rgba(255,255,255,0.06); border-radius: 4px; margin: 2px;">${escapeHtml(t)}</span>`)
            .join('');

          return `
            <tr>
              <td><strong>${escapeHtml(p.sortOrder)}</strong></td>
              <td>
                <div style="font-weight: 700; color: var(--text-primary); font-size: 0.95rem;">${escapeHtml(p.title)}</div>
                <div style="font-size: 0.8rem; color: var(--accent-cyan); font-family: monospace;">/${escapeHtml(p.slug)}</div>
              </td>
              <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${escapeHtml(p.category)}</span></td>
              <td>${techBadges}</td>
              <td>${featuredHtml}</td>
              <td style="text-align: right;">
                <div class="action-btn-group" style="justify-content: flex-end;">
                  <button class="btn-icon" title="Edit Project" onclick="window.openProjectModalForEdit(${p.id})">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                  <button class="btn-icon delete" title="Delete Project" onclick="window.confirmDeleteProject(${p.id}, '${escapeHtml(p.title.replace(/'/g, "\\'"))}')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    } catch (err) {
      showToast(err.message || 'Failed to load projects', 'error');
    }
  }

  // ==========================================================================
  // SECTION 3: EXPERIENCES MANAGEMENT
  // ==========================================================================
  function setupExperiencesCRUD() {
    const createBtn = document.getElementById('btn-create-experience');
    const expForm = document.getElementById('experience-form');
    const isCurrentCheckbox = document.getElementById('exp-is-current');
    const endDateGroup = document.getElementById('exp-end-date-group');
    const saveBtn = document.getElementById('experience-save-btn');

    if (isCurrentCheckbox && endDateGroup) {
      isCurrentCheckbox.addEventListener('change', () => {
        if (isCurrentCheckbox.checked) {
          endDateGroup.style.opacity = '0.4';
          document.getElementById('exp-end-date').value = '';
          document.getElementById('exp-end-date').disabled = true;
        } else {
          endDateGroup.style.opacity = '1';
          document.getElementById('exp-end-date').disabled = false;
        }
      });
    }

    if (createBtn) {
      createBtn.addEventListener('click', () => {
        openExperienceModalForCreate();
      });
    }

    if (expForm) {
      expForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('experience-form-id').value;
        const company = document.getElementById('exp-company').value.trim();
        const role = document.getElementById('exp-role').value.trim();
        const location = document.getElementById('exp-location').value.trim() || null;
        const startDate = document.getElementById('exp-start-date').value;
        const isCurrent = document.getElementById('exp-is-current').checked;
        const endDate = isCurrent ? null : document.getElementById('exp-end-date').value || null;
        const description = document.getElementById('exp-description').value.trim();
        const sortOrder = parseInt(document.getElementById('exp-sort-order').value, 10) || 0;

        // Validation
        if (!company || !role || !startDate || !description) {
          showToast('Please fill in all required fields marked with *', 'error');
          return;
        }

        // Date validation: startDate <= endDate
        if (!isCurrent && endDate && startDate > endDate) {
          showToast('Invalid date range: Start date cannot be after end date.', 'error');
          return;
        }

        const payload = {
          company,
          role,
          location,
          startDate,
          endDate,
          isCurrent,
          description,
          sortOrder,
        };

        setLoadingState(saveBtn, true, 'Saving...');

        try {
          if (id) {
            await adminFetch(`/api/admin/experiences/${id}`, {
              method: 'PUT',
              body: JSON.stringify(payload),
            });
            showToast('Experience updated successfully!', 'success');
          } else {
            await adminFetch('/api/admin/experiences', {
              method: 'POST',
              body: JSON.stringify(payload),
            });
            showToast('Experience created successfully!', 'success');
          }

          closeModal('experience-modal');
          loadExperiencesData();
          loadOverviewData();
        } catch (err) {
          showToast(err.message || 'Operation failed', 'error');
        } finally {
          setLoadingState(saveBtn, false, 'Save Experience');
        }
      });
    }
  }

  function openExperienceModalForCreate() {
    const modalTitle = document.getElementById('experience-modal-title');
    if (modalTitle) modalTitle.textContent = 'Add Career Experience';

    document.getElementById('experience-form-id').value = '';
    document.getElementById('exp-company').value = '';
    document.getElementById('exp-role').value = '';
    document.getElementById('exp-location').value = '';
    document.getElementById('exp-start-date').value = '';
    document.getElementById('exp-end-date').value = '';
    document.getElementById('exp-end-date').disabled = false;
    document.getElementById('exp-is-current').checked = false;
    document.getElementById('exp-description').value = '';
    document.getElementById('exp-sort-order').value = '0';

    const endDateGroup = document.getElementById('exp-end-date-group');
    if (endDateGroup) endDateGroup.style.opacity = '1';

    openModal('experience-modal');
  }

  window.openExperienceModalForEdit = function (id) {
    const exp = cachedExperiences.find((e) => e.id === id);
    if (!exp) return;

    const modalTitle = document.getElementById('experience-modal-title');
    if (modalTitle) modalTitle.textContent = 'Edit Experience';

    document.getElementById('experience-form-id').value = exp.id;
    document.getElementById('exp-company').value = exp.company || '';
    document.getElementById('exp-role').value = exp.role || '';
    document.getElementById('exp-location').value = exp.location || '';
    document.getElementById('exp-start-date').value = exp.startDate || '';
    document.getElementById('exp-end-date').value = exp.endDate || '';
    document.getElementById('exp-is-current').checked = Boolean(exp.isCurrent);
    document.getElementById('exp-description').value = exp.description || '';
    document.getElementById('exp-sort-order').value = exp.sortOrder ?? 0;

    const endDateGroup = document.getElementById('exp-end-date-group');
    if (endDateGroup) {
      if (exp.isCurrent) {
        endDateGroup.style.opacity = '0.4';
        document.getElementById('exp-end-date').disabled = true;
      } else {
        endDateGroup.style.opacity = '1';
        document.getElementById('exp-end-date').disabled = false;
      }
    }

    openModal('experience-modal');
  };

  window.confirmDeleteExperience = function (id, company) {
    showConfirmDelete(
      'Delete Experience',
      `Are you sure you want to delete experience at "${company}"? This cannot be undone.`,
      async () => {
        try {
          await adminFetch(`/api/admin/experiences/${id}`, { method: 'DELETE' });
          showToast('Experience deleted successfully', 'success');
          loadExperiencesData();
          loadOverviewData();
        } catch (err) {
          showToast(err.message || 'Failed to delete experience', 'error');
        }
      }
    );
  };

  async function loadExperiencesData() {
    const tbody = document.getElementById('experiences-tbody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem;">
          <div class="skeleton" style="height: 24px; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 24px;"></div>
        </td>
      </tr>
    `;

    try {
      const res = await adminFetch('/api/admin/experiences');
      cachedExperiences = res.data || [];

      if (cachedExperiences.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              No experiences recorded yet. Click "+ Add Experience" to add one.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = cachedExperiences
        .map((e) => {
          const statusBadge = e.isCurrent
            ? `<span class="status-badge current">Current</span>`
            : `<span style="color: var(--text-muted); font-size: 0.8rem;">Past</span>`;

          const periodText = `${formatDate(e.startDate)} &mdash; ${e.isCurrent ? 'Present' : formatDate(e.endDate)}`;

          return `
            <tr>
              <td><strong>${escapeHtml(e.sortOrder)}</strong></td>
              <td>
                <div style="font-weight: 700; color: var(--text-primary);">${escapeHtml(e.company)}</div>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(e.location || 'Remote / Unspecified')}</div>
              </td>
              <td><span style="font-weight: 600; color: var(--accent-cyan); font-size: 0.9rem;">${escapeHtml(e.role)}</span></td>
              <td style="font-size: 0.85rem; color: var(--text-secondary);">${periodText}</td>
              <td>${statusBadge}</td>
              <td style="text-align: right;">
                <div class="action-btn-group" style="justify-content: flex-end;">
                  <button class="btn-icon" title="Edit Experience" onclick="window.openExperienceModalForEdit(${e.id})">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                  <button class="btn-icon delete" title="Delete Experience" onclick="window.confirmDeleteExperience(${e.id}, '${escapeHtml(e.company.replace(/'/g, "\\'"))}')">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    } catch (err) {
      showToast(err.message || 'Failed to load experiences', 'error');
    }
  }

  // ==========================================================================
  // SECTION 4: CONTACT INQUIRIES MANAGEMENT
  // ==========================================================================
  let currentContactFilter = '';

  function setupContactsManagement() {
    const filterButtons = document.querySelectorAll('.filter-btn[data-status]');
    filterButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        filterButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentContactFilter = btn.getAttribute('data-status') || '';
        loadContactsData();
      });
    });
  }

  async function loadContactsData() {
    const tbody = document.getElementById('contacts-tbody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem;">
          <div class="skeleton" style="height: 24px; margin-bottom: 0.5rem;"></div>
          <div class="skeleton" style="height: 24px;"></div>
        </td>
      </tr>
    `;

    try {
      const url = currentContactFilter
        ? `/api/admin/contacts?status=${encodeURIComponent(currentContactFilter)}`
        : '/api/admin/contacts';

      const res = await adminFetch(url);
      cachedContacts = res.data || [];

      if (cachedContacts.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; padding: 3rem; color: var(--text-muted);">
              No messages found${currentContactFilter ? ` with status "${currentContactFilter}"` : ''}.
            </td>
          </tr>
        `;
        return;
      }

      tbody.innerHTML = cachedContacts
        .map(
          (c) => `
          <tr>
            <td>${escapeHtml(formatDate(c.createdAt))}</td>
            <td><strong style="color: var(--text-primary);">${escapeHtml(c.name)}</strong></td>
            <td><a href="mailto:${escapeHtml(c.email)}" style="color: var(--accent-cyan); text-decoration: underline;">${escapeHtml(c.email)}</a></td>
            <td>${escapeHtml(c.subject || 'General Inquiry')}</td>
            <td>
              <span class="status-badge ${escapeHtml(c.status)}">${escapeHtml(c.status)}</span>
            </td>
            <td style="text-align: right;">
              <button class="btn btn-secondary btn-sm" onclick="window.viewContactDetail(${c.id})">
                View Detail
              </button>
            </td>
          </tr>
        `
        )
        .join('');
    } catch (err) {
      showToast(err.message || 'Failed to load contact inquiries', 'error');
    }
  }

  window.viewContactDetail = async function (id) {
    try {
      const res = await adminFetch(`/api/admin/contacts/${id}`);
      const contact = res.data;
      if (!contact) return;

      document.getElementById('detail-sender').textContent = contact.name || 'Anonymous';
      document.getElementById('detail-email').textContent = contact.email || 'N/A';
      document.getElementById('detail-subject').textContent = contact.subject || 'General Inquiry';
      document.getElementById('detail-date').textContent = formatDate(contact.createdAt);

      const statusEl = document.getElementById('detail-status');
      if (statusEl) {
        statusEl.innerHTML = `<span class="status-badge ${escapeHtml(contact.status)}">${escapeHtml(contact.status)}</span>`;
      }

      document.getElementById('detail-message').textContent = contact.message || '(Empty message)';

      // Setup status action buttons
      const actionsEl = document.getElementById('detail-status-actions');
      if (actionsEl) {
        let actionButtonsHtml = '';
        if (contact.status === 'unread') {
          actionButtonsHtml += `
            <button class="btn btn-primary btn-sm" onclick="window.updateContactStatus(${contact.id}, 'read')">
              Mark as Read
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.updateContactStatus(${contact.id}, 'archived')">
              Archive
            </button>
          `;
        } else if (contact.status === 'read') {
          actionButtonsHtml += `
            <button class="btn btn-secondary btn-sm" onclick="window.updateContactStatus(${contact.id}, 'unread')">
              Mark as Unread
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.updateContactStatus(${contact.id}, 'archived')">
              Archive
            </button>
          `;
        } else if (contact.status === 'archived') {
          actionButtonsHtml += `
            <button class="btn btn-secondary btn-sm" onclick="window.updateContactStatus(${contact.id}, 'read')">
              Restore to Read
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.updateContactStatus(${contact.id}, 'unread')">
              Mark as Unread
            </button>
          `;
        }
        actionsEl.innerHTML = actionButtonsHtml;
      }

      openModal('contact-detail-modal');

      // If viewing an unread message, offer prompt or auto update to read
    } catch (err) {
      showToast(err.message || 'Failed to retrieve message details', 'error');
    }
  };

  window.updateContactStatus = async function (id, newStatus) {
    try {
      await adminFetch(`/api/admin/contacts/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });

      showToast(`Message marked as ${newStatus}`, 'success');
      closeModal('contact-detail-modal');
      loadContactsData();
      loadOverviewData();
    } catch (err) {
      showToast(err.message || 'Failed to update message status', 'error');
    }
  };

  // Expose utilities if needed for test verification in global scope
  window.__adminDashboard = {
    escapeHtml,
    formatDate,
    getToken,
    getUser,
    setSession,
    clearSession,
    adminFetch,
  };
})();
