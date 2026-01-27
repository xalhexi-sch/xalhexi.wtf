// State
let tutorials = [];
let selectedTutorialId = null;
let isAdmin = localStorage.getItem('isAdmin') === 'true';

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const tutorialList = document.getElementById('tutorialList');
const searchInput = document.getElementById('searchInput');
const contentArea = document.getElementById('contentArea');
const toastContainer = document.getElementById('toastContainer');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebarFooter = document.getElementById('sidebarFooter');
const headerActions = document.getElementById('headerActions');

// Modals
const loginModal = document.getElementById('loginModal');
const tutorialModal = document.getElementById('tutorialModal');
const stepModal = document.getElementById('stepModal');

// Initialize
async function init() {
  await loadTutorials();
  renderSidebar();
  renderAdminControls();
  renderHeaderActions();
  
  if (tutorials.length > 0) {
    selectTutorial(tutorials[0].id);
  } else {
    renderEmptyState();
  }
}

// Load tutorials from localStorage override or fetch from JSON
async function loadTutorials() {
  const override = localStorage.getItem('tutorialsOverride');
  if (override) {
    try {
      tutorials = JSON.parse(override);
      return;
    } catch (e) {
      console.error('Failed to parse tutorialsOverride', e);
    }
  }
  
  try {
    const response = await fetch('./tutorials.json');
    tutorials = await response.json();
  } catch (e) {
    console.error('Failed to load tutorials.json', e);
    tutorials = [];
  }
}

// Save tutorials to localStorage
function saveTutorials() {
  localStorage.setItem('tutorialsOverride', JSON.stringify(tutorials));
}

// Generate unique ID
function generateId() {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Render header actions
function renderHeaderActions() {
  if (isAdmin) {
    headerActions.innerHTML = `
      <span class="keyboard-hint" style="margin-right: 1rem; font-size: 0.8125rem; color: var(--text-muted);">
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin-right: 0.25rem;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
        Admin Mode
      </span>
    `;
  } else {
    headerActions.innerHTML = '';
  }
}

// Render sidebar tutorial list
function renderSidebar() {
  const searchTerm = searchInput.value.toLowerCase();
  const filteredTutorials = tutorials.filter(t => 
    t.title.toLowerCase().includes(searchTerm) || 
    t.description.toLowerCase().includes(searchTerm)
  );
  
  if (filteredTutorials.length === 0) {
    tutorialList.innerHTML = `
      <div class="no-tutorials">
        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="margin: 0 auto 1rem; display: block; opacity: 0.4;">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        No tutorials found
      </div>
    `;
    return;
  }
  
  tutorialList.innerHTML = filteredTutorials.map(tutorial => `
    <button class="tutorial-item ${tutorial.id === selectedTutorialId ? 'active' : ''}" 
         onclick="selectTutorial('${tutorial.id}')"
         aria-current="${tutorial.id === selectedTutorialId ? 'page' : 'false'}">
      <div class="tutorial-item-title">
        <svg class="tutorial-item-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        ${escapeHtml(tutorial.title)}
      </div>
      <div class="tutorial-item-desc">${escapeHtml(tutorial.description)}</div>
    </button>
  `).join('');
}

// Render admin controls in sidebar footer
function renderAdminControls() {
  if (isAdmin) {
    sidebarFooter.innerHTML = `
      <div class="admin-controls">
        <button class="btn btn-primary btn-sm" onclick="openTutorialModal()" style="flex: 1 1 100%;">
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Tutorial
        </button>
        <button class="btn btn-secondary btn-sm" onclick="downloadTutorials()" title="Export tutorials as JSON">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
          </svg>
          Export
        </button>
        <button class="btn btn-secondary btn-sm" onclick="document.getElementById('importInput').click()" title="Import tutorials from JSON">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
          </svg>
          Import
        </button>
        <button class="btn btn-danger btn-sm" onclick="logout()" title="Sign out of admin mode">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Logout
        </button>
      </div>
      <input type="file" id="importInput" class="hidden-input" accept=".json" onchange="importTutorials(event)">
    `;
  } else {
    sidebarFooter.innerHTML = `
      <button class="admin-btn" onclick="openLoginModal()" title="Admin Login" aria-label="Admin Login">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </button>
    `;
  }
}

// Select and render a tutorial
function selectTutorial(tutorialId) {
  selectedTutorialId = tutorialId;
  renderSidebar();
  renderTutorial();
  closeSidebar();
}

// Render selected tutorial content
function renderTutorial() {
  const tutorial = tutorials.find(t => t.id === selectedTutorialId);
  
  if (!tutorial) {
    renderEmptyState();
    return;
  }
  
  const adminEditBtns = isAdmin ? `
    <div class="edit-actions">
      <button class="inline-edit-btn" onclick="openTutorialModal('${tutorial.id}')" aria-label="Edit tutorial">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit
      </button>
      <button class="inline-edit-btn delete" onclick="deleteTutorial('${tutorial.id}')" aria-label="Delete tutorial">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Delete
      </button>
    </div>
  ` : '';
  
  const stepCount = tutorial.steps.length;
  const progressHtml = stepCount > 0 ? `
    <div class="progress-bar" title="${stepCount} step${stepCount !== 1 ? 's' : ''} in this tutorial">
      <div class="progress-bar-fill" style="width: 100%;"></div>
    </div>
  ` : '';
  
  const addStepBtn = isAdmin ? `
    <div class="add-step-container">
      <button class="btn btn-primary" onclick="openStepModal('${tutorial.id}')">
        <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add New Step
      </button>
    </div>
  ` : '';
  
  const welcomeBanner = !isAdmin && tutorial.steps.length > 0 ? `
    <div class="welcome-banner">
      <svg class="welcome-banner-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
      </svg>
      <div class="welcome-banner-content">
        <h3>Ready to learn?</h3>
        <p>Follow along with ${tutorial.steps.length} step${tutorial.steps.length !== 1 ? 's' : ''} to complete this tutorial. Click "Copy" to grab any code snippets.</p>
      </div>
    </div>
  ` : '';
  
  contentArea.innerHTML = `
    <article>
      <header class="tutorial-header">
        <h1 class="tutorial-title">
          ${escapeHtml(tutorial.title)}
          ${adminEditBtns}
        </h1>
        <p class="tutorial-description">${escapeHtml(tutorial.description)}</p>
        ${progressHtml}
      </header>
      
      ${welcomeBanner}
      
      <div class="steps" role="list">
        ${tutorial.steps.map((step, index) => renderStep(tutorial.id, step, index)).join('')}
      </div>
      
      ${tutorial.steps.length === 0 && !isAdmin ? `
        <div class="empty-state" style="padding: 3rem 2rem;">
          <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style="width: 56px; height: 56px;">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
          </svg>
          <h2 class="empty-state-title">No steps yet</h2>
          <p class="empty-state-text">This tutorial doesn't have any steps yet. Check back later!</p>
        </div>
      ` : ''}
      
      ${addStepBtn}
    </article>
  `;
}

// Render a single step
function renderStep(tutorialId, step, index) {
  const adminBtns = isAdmin ? `
    <div class="edit-actions">
      <button class="inline-edit-btn" onclick="openStepModal('${tutorialId}', '${step.id}')" aria-label="Edit step">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
        </svg>
        Edit
      </button>
      <button class="inline-edit-btn delete" onclick="deleteStep('${tutorialId}', '${step.id}')" aria-label="Delete step">
        <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
        Delete
      </button>
    </div>
  ` : '';
  
  return `
    <section class="step" role="listitem">
      <div class="step-header">
        <h2 class="step-heading">
          <span class="step-number" aria-label="Step ${index + 1}">${index + 1}</span>
          ${escapeHtml(step.heading)}
        </h2>
        ${adminBtns}
      </div>
      <p class="step-explanation">${escapeHtml(step.explanation)}</p>
      ${step.code ? `
        <div class="code-block">
          <button class="copy-btn" onclick="copyCode(this)" aria-label="Copy code to clipboard">
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
            </svg>
            <span>Copy</span>
          </button>
          <pre><code>${escapeHtml(step.code)}</code></pre>
        </div>
      ` : ''}
    </section>
  `;
}

// Render empty state
function renderEmptyState() {
  const adminAction = isAdmin ? `
    <button class="btn btn-primary" onclick="openTutorialModal()" style="margin-top: 1.5rem;">
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
      </svg>
      Create Your First Tutorial
    </button>
  ` : '';
  
  contentArea.innerHTML = `
    <div class="empty-state">
      <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
      </svg>
      <h2 class="empty-state-title">Welcome to Tutorial Docs</h2>
      <p class="empty-state-text">Select a tutorial from the sidebar to get started, or use the search to find what you're looking for.</p>
      ${adminAction}
    </div>
  `;
}

// Copy code to clipboard
async function copyCode(button) {
  const codeBlock = button.closest('.code-block');
  const code = codeBlock.querySelector('code').textContent;
  
  try {
    await navigator.clipboard.writeText(code);
    button.classList.add('copied');
    button.innerHTML = `
      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
      </svg>
      <span>Copied!</span>
    `;
    
    showToast('Code copied to clipboard!', 'success');
    
    setTimeout(() => {
      button.classList.remove('copied');
      button.innerHTML = `
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
        </svg>
        <span>Copy</span>
      `;
    }, 2000);
  } catch (err) {
    showToast('Failed to copy code', 'error');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  
  const icon = type === 'success' 
    ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>`
    : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>`;
  
  toast.innerHTML = `
    <svg class="toast-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      ${icon}
    </svg>
    ${escapeHtml(message)}
  `;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Mobile sidebar toggle
function toggleSidebar() {
  const isOpen = sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('active');
  mobileMenuBtn.setAttribute('aria-expanded', isOpen);
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
  mobileMenuBtn.setAttribute('aria-expanded', 'false');
}

// Modal functions
function openModal(modal) {
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Focus first input
  const firstInput = modal.querySelector('input, textarea');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
}

function closeModal(modal) {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

// Login modal
function openLoginModal() {
  document.getElementById('loginUsername').value = '';
  document.getElementById('loginPassword').value = '';
  document.getElementById('loginError').textContent = '';
  openModal(loginModal);
}

function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  
  if (username === 'admin' && password === '1234') {
    isAdmin = true;
    localStorage.setItem('isAdmin', 'true');
    closeModal(loginModal);
    renderAdminControls();
    renderHeaderActions();
    renderSidebar();
    renderTutorial();
    showToast('Welcome back, Admin!', 'success');
  } else {
    document.getElementById('loginError').textContent = 'Invalid username or password. Please try again.';
  }
}

function logout() {
  isAdmin = false;
  localStorage.removeItem('isAdmin');
  renderAdminControls();
  renderHeaderActions();
  renderSidebar();
  renderTutorial();
  showToast('You have been logged out', 'success');
}

// Tutorial modal
let editingTutorialId = null;

function openTutorialModal(tutorialId = null) {
  editingTutorialId = tutorialId;
  const tutorial = tutorialId ? tutorials.find(t => t.id === tutorialId) : null;
  
  document.getElementById('tutorialModalTitle').textContent = tutorial ? 'Edit Tutorial' : 'Create New Tutorial';
  document.getElementById('tutorialTitle').value = tutorial ? tutorial.title : '';
  document.getElementById('tutorialDescription').value = tutorial ? tutorial.description : '';
  
  openModal(tutorialModal);
}

function handleTutorialSubmit(event) {
  event.preventDefault();
  const title = document.getElementById('tutorialTitle').value.trim();
  const description = document.getElementById('tutorialDescription').value.trim();
  
  if (!title) return;
  
  if (editingTutorialId) {
    const tutorial = tutorials.find(t => t.id === editingTutorialId);
    if (tutorial) {
      tutorial.title = title;
      tutorial.description = description;
      showToast('Tutorial updated successfully', 'success');
    }
  } else {
    const newTutorial = {
      id: generateId(),
      title,
      description,
      steps: []
    };
    tutorials.push(newTutorial);
    selectedTutorialId = newTutorial.id;
    showToast('Tutorial created successfully', 'success');
  }
  
  saveTutorials();
  closeModal(tutorialModal);
  renderSidebar();
  renderTutorial();
}

function deleteTutorial(tutorialId) {
  if (!confirm('Are you sure you want to delete this tutorial? This action cannot be undone.')) return;
  
  tutorials = tutorials.filter(t => t.id !== tutorialId);
  
  if (selectedTutorialId === tutorialId) {
    selectedTutorialId = tutorials.length > 0 ? tutorials[0].id : null;
  }
  
  saveTutorials();
  renderSidebar();
  
  if (selectedTutorialId) {
    renderTutorial();
  } else {
    renderEmptyState();
  }
  
  showToast('Tutorial deleted', 'success');
}

// Step modal
let editingStepTutorialId = null;
let editingStepId = null;

function openStepModal(tutorialId, stepId = null) {
  editingStepTutorialId = tutorialId;
  editingStepId = stepId;
  
  const tutorial = tutorials.find(t => t.id === tutorialId);
  const step = stepId ? tutorial?.steps.find(s => s.id === stepId) : null;
  
  document.getElementById('stepModalTitle').textContent = step ? 'Edit Step' : 'Add New Step';
  document.getElementById('stepHeading').value = step ? step.heading : '';
  document.getElementById('stepExplanation').value = step ? step.explanation : '';
  document.getElementById('stepCode').value = step ? step.code : '';
  
  openModal(stepModal);
}

function handleStepSubmit(event) {
  event.preventDefault();
  const heading = document.getElementById('stepHeading').value.trim();
  const explanation = document.getElementById('stepExplanation').value.trim();
  const code = document.getElementById('stepCode').value;
  
  if (!heading) return;
  
  const tutorial = tutorials.find(t => t.id === editingStepTutorialId);
  if (!tutorial) return;
  
  if (editingStepId) {
    const step = tutorial.steps.find(s => s.id === editingStepId);
    if (step) {
      step.heading = heading;
      step.explanation = explanation;
      step.code = code;
      showToast('Step updated successfully', 'success');
    }
  } else {
    tutorial.steps.push({
      id: generateId(),
      heading,
      explanation,
      code
    });
    showToast('Step added successfully', 'success');
  }
  
  saveTutorials();
  closeModal(stepModal);
  renderTutorial();
}

function deleteStep(tutorialId, stepId) {
  if (!confirm('Are you sure you want to delete this step?')) return;
  
  const tutorial = tutorials.find(t => t.id === tutorialId);
  if (tutorial) {
    tutorial.steps = tutorial.steps.filter(s => s.id !== stepId);
    saveTutorials();
    renderTutorial();
    showToast('Step deleted', 'success');
  }
}

// Import/Export
function downloadTutorials() {
  const dataStr = JSON.stringify(tutorials, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tutorials.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showToast('Tutorials exported successfully', 'success');
}

function importTutorials(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      if (Array.isArray(imported)) {
        tutorials = imported;
        saveTutorials();
        selectedTutorialId = tutorials.length > 0 ? tutorials[0].id : null;
        renderSidebar();
        if (selectedTutorialId) {
          renderTutorial();
        } else {
          renderEmptyState();
        }
        showToast(`Imported ${tutorials.length} tutorial${tutorials.length !== 1 ? 's' : ''} successfully`, 'success');
      } else {
        showToast('Invalid file format. Expected an array of tutorials.', 'error');
      }
    } catch (err) {
      showToast('Failed to parse JSON file', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

// Search
searchInput.addEventListener('input', () => {
  renderSidebar();
});

// Keyboard shortcut for search
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + K to focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
});

// Mobile menu
mobileMenuBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

// Close modals on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal(overlay);
    }
  });
});

// Close modals on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(modal => {
      closeModal(modal);
    });
  }
});

// Initialize app
init();
