/* ═══════════════════════════════════════════════════════════════
   TaskFlow Pro — Frontend Application Logic
   ═══════════════════════════════════════════════════════════════ */

const API = '/api/v1';
let token = null;
let currentUser = null;
let currentPage = 'dashboard';
let currentDetailTaskId = null;

// Task list state
let listSort = 'created_at';
let listOrder = 'desc';
let listPage = 1;
let selectedTaskIds = new Set();

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Don't set Content-Type if body is FormData
  if (options.body instanceof FormData) delete headers['Content-Type'];
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) { logout(); return null; }
  return res;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const rememberMe = document.getElementById('remember-me').checked;
  const errorEl = document.getElementById('login-error');

  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.style.display = 'block';
      return;
    }
    token = data.token;
    currentUser = data.user;

    if (rememberMe) {
      localStorage.setItem('taskflow_token', token);
      localStorage.setItem('taskflow_user', JSON.stringify(currentUser));
    } else {
      sessionStorage.setItem('taskflow_token', token);
      sessionStorage.setItem('taskflow_user', JSON.stringify(currentUser));
    }

    enterApp();
  } catch (err) {
    errorEl.textContent = 'Network error. Please try again.';
    errorEl.style.display = 'block';
  }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const errorEl = document.getElementById('register-error');

  try {
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      errorEl.textContent = data.error;
      errorEl.style.display = 'block';
      return;
    }
    token = data.token;
    currentUser = data.user;
    enterApp();
  } catch (err) {
    errorEl.textContent = 'Network error. Please try again.';
    errorEl.style.display = 'block';
  }
});

// Toggle login/register
document.getElementById('show-register-link').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
});
document.getElementById('show-login-link').addEventListener('click', (e) => {
  e.preventDefault();
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
});

function enterApp() {
  document.getElementById('auth-view').style.display = 'none';
  document.getElementById('app-shell').style.display = 'flex';

  // Update user badge
  document.querySelector('[data-testid="user-name"]').textContent = currentUser.name;
  document.querySelector('[data-testid="user-role"]').textContent = currentUser.role;
  document.querySelector('[data-testid="user-avatar"]').textContent = currentUser.name.charAt(0).toUpperCase();

  // Load initial data
  navigateTo('dashboard');
  loadUsersForAssignee();
}

function logout() {
  token = null;
  currentUser = null;
  localStorage.removeItem('taskflow_token');
  localStorage.removeItem('taskflow_user');
  sessionStorage.removeItem('taskflow_token');
  sessionStorage.removeItem('taskflow_user');

  document.getElementById('app-shell').style.display = 'none';
  document.getElementById('auth-view').style.display = 'flex';
  // Clear login form fields
  document.getElementById('login-email').value = '';
  document.getElementById('login-password').value = '';
  document.getElementById('remember-me').checked = false;
  document.getElementById('login-error').style.display = 'none';

  // Clear registration form fields and reset to login view
  document.getElementById('reg-name').value = '';
  document.getElementById('reg-email').value = '';
  document.getElementById('reg-password').value = '';
  document.getElementById('register-error').style.display = 'none';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('login-form').style.display = 'block';
}

function initAuth() {
  const savedToken = localStorage.getItem('taskflow_token') || sessionStorage.getItem('taskflow_token');
  const savedUser = localStorage.getItem('taskflow_user') || sessionStorage.getItem('taskflow_user');
  if (savedToken && savedUser) {
    try {
      token = savedToken;
      currentUser = JSON.parse(savedUser);
      enterApp();
    } catch (e) {
      logout();
    }
  }
}
document.addEventListener('DOMContentLoaded', initAuth);
document.getElementById('logout-btn').addEventListener('click', logout);

// ─────────────────────────────────────────────────────────────
// NAVIGATION
// ─────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => navigateTo(btn.dataset.page));
});

function navigateTo(page) {
  currentPage = page;
  // Update nav
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
  // Update pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  // Update title
  const titles = { dashboard: 'Dashboard', board: 'Task Board', list: 'Task List', users: 'Users', settings: 'Settings', detail: 'Task Detail' };
  document.getElementById('page-title').textContent = titles[page] || 'TaskFlow Pro';

  // Load page data
  if (page === 'dashboard') loadDashboard();
  if (page === 'board') loadBoard();
  if (page === 'list') loadTaskList();
  if (page === 'users') loadUsers();
  if (page === 'settings') loadSettings();
  if (page === 'detail') loadTaskDetail(currentDetailTaskId);
}

// ─────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────

async function loadDashboard() {
  const res = await apiFetch('/dashboard/stats');
  if (!res) return;
  const stats = await res.json();
  document.getElementById('stat-total').textContent = stats.total;
  document.getElementById('stat-todo').textContent = stats.todo;
  document.getElementById('stat-in-progress').textContent = stats.inProgress;
  document.getElementById('stat-done').textContent = stats.done;
  document.getElementById('stat-overdue').textContent = stats.overdue;

  // Load recent tasks
  const tasksRes = await apiFetch('/tasks?limit=5&sort=created_at&order=desc');
  if (!tasksRes) return;
  const tasksData = await tasksRes.json();
  const container = document.getElementById('recent-tasks');
  container.innerHTML = tasksData.data.map(t => `
    <div class="recent-task-item" data-testid="recent-task-${t.id}" onclick="openTaskDetail(${t.id})">
      <div>
        <div style="font-weight:600; font-size:0.88rem;">${t.title}</div>
        <div style="font-size:0.75rem; color:var(--text-muted);">${t.assignee_name || 'Unassigned'} · ${formatDate(t.due_date)}</div>
      </div>
      <div style="display:flex; gap:0.4rem;">
        <span class="badge badge-${t.status}">${t.status}</span>
        <span class="badge badge-${t.priority}">${t.priority}</span>
      </div>
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────
// TASK BOARD (KANBAN)
// ─────────────────────────────────────────────────────────────

async function loadBoard() {
  const res = await apiFetch('/tasks?limit=100');
  if (!res) return;
  const data = await res.json();

  const columns = { todo: [], 'in-progress': [], done: [] };
  data.data.forEach(t => { if (columns[t.status]) columns[t.status].push(t); });

  Object.entries(columns).forEach(([status, tasks]) => {
    document.getElementById(`count-${status}`).textContent = tasks.length;
    const container = document.getElementById(`cards-${status}`);
    container.innerHTML = tasks.map(t => `
      <div class="task-card" draggable="true" data-task-id="${t.id}" data-testid="task-card-${t.id}" onclick="openTaskDetail(${t.id})">
        <div class="task-card-title">${t.title}</div>
        <div class="task-card-meta">
          <span class="badge badge-${t.priority}">${t.priority}</span>
          <span>${t.assignee_name || 'Unassigned'}</span>
        </div>
      </div>
    `).join('');

    // Drag & Drop
    setupDragAndDrop(container, status);
  });
}

function setupDragAndDrop(container, status) {
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.style.background = 'var(--accent-subtle)';
  });
  container.addEventListener('dragleave', () => {
    container.style.background = '';
  });
  container.addEventListener('drop', async (e) => {
    e.preventDefault();
    container.style.background = '';
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const originalCard = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
    if (originalCard && originalCard.closest('.cards-container') === container) {
      return;
    }

    const res = await apiFetch(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    if (res && res.ok) {
      showToast(`Task moved to ${status}`);
      loadBoard();
    }
  });

  container.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('text/plain', card.dataset.taskId);
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
}

// ─────────────────────────────────────────────────────────────
// TASK LIST (TABLE)
// ─────────────────────────────────────────────────────────────

let searchDebounce = null;
document.getElementById('search-input').addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => { listPage = 1; loadTaskList(); }, 300);
});

document.getElementById('filter-status').addEventListener('change', () => { listPage = 1; loadTaskList(); });
document.getElementById('filter-priority').addEventListener('change', () => { listPage = 1; loadTaskList(); });

document.querySelectorAll('.sortable').forEach(th => {
  th.addEventListener('click', () => {
    const field = th.dataset.sort;
    if (listSort === field) { listOrder = listOrder === 'asc' ? 'desc' : 'asc'; }
    else { listSort = field; listOrder = 'asc'; }
    loadTaskList();
  });
});

// Select all
document.getElementById('select-all-checkbox').addEventListener('change', (e) => {
  const checked = e.target.checked;
  document.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.checked = checked;
    const id = Number(cb.dataset.taskId);
    checked ? selectedTaskIds.add(id) : selectedTaskIds.delete(id);
  });
  updateBulkBar();
});

function updateBulkBar() {
  const bar = document.getElementById('bulk-actions');
  if (selectedTaskIds.size > 0) {
    bar.style.display = 'flex';
    document.getElementById('selected-count').textContent = `${selectedTaskIds.size} selected`;
  } else {
    bar.style.display = 'none';
  }
}

document.getElementById('bulk-delete-btn').addEventListener('click', async () => {
  if (selectedTaskIds.size === 0) return;
  for (const id of selectedTaskIds) {
    await apiFetch(`/tasks/${id}`, { method: 'DELETE' });
  }
  selectedTaskIds.clear();
  updateBulkBar();
  loadTaskList();
});

function renderTaskRows(data) {
  const tbody = document.getElementById('task-table-body');
  tbody.innerHTML = data.map(t => `
    <tr data-testid="task-row-${t.id}">
      <td>
        <input type="checkbox" class="row-checkbox" data-task-id="${t.id}" data-testid="task-checkbox-${t.id}" ${selectedTaskIds.has(t.id) ? 'checked' : ''} />
      </td>
      <td>
        <a href="#" onclick="event.preventDefault(); openTaskDetail(${t.id})" data-testid="task-title-${t.id}" style="font-weight:600; color:var(--accent); text-decoration:none;">${t.title}</a>
      </td>
      <td><span class="badge badge-${t.status}">${t.status}</span></td>
      <td><span class="badge badge-${t.priority}">${t.priority}</span></td>
      <td>${t.assignee_name || 'Unassigned'}</td>
      <td>${formatDate(t.due_date)}</td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="editTask(${t.id})" data-testid="edit-task-${t.id}">✏️</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteTask(${t.id})" data-testid="delete-task-${t.id}">🗑️</button>
      </td>
    </tr>
  `).join('');

  // Checkbox events
  tbody.querySelectorAll('.row-checkbox').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.taskId);
      e.target.checked ? selectedTaskIds.add(id) : selectedTaskIds.delete(id);
      updateBulkBar();
    });
  });

  // Pagination
  const { page: pg, totalPages } = data.pagination;
  const pag = document.getElementById('pagination');
  let pagHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    pagHtml += `<button class="page-btn ${i === pg ? 'active' : ''}" data-testid="page-${i}" onclick="listPage=${i}; loadTaskList();">${i}</button>`;
  }
  pag.innerHTML = pagHtml;
}

// ─────────────────────────────────────────────────────────────
// TASK DETAIL
// ─────────────────────────────────────────────────────────────

let previousPage = 'list';

function openTaskDetail(taskId) {
  currentDetailTaskId = taskId;
  if (currentPage !== 'detail') {
    previousPage = currentPage;
  }
  navigateTo('detail');
}

document.getElementById('back-to-list-btn').addEventListener('click', () => {
  navigateTo(previousPage || 'list');
});

async function loadTaskDetail(taskId) {
  if (!taskId) return;
  const res = await apiFetch(`/tasks/${taskId}`);
  if (!res) return;
  const task = await res.json();

  document.getElementById('detail-title').textContent = task.title;
  document.getElementById('detail-description').textContent = task.description || 'No description provided.';
  document.getElementById('detail-status').textContent = task.status;
  document.getElementById('detail-status').className = `badge badge-${task.status}`;
  document.getElementById('detail-priority').textContent = task.priority;
  document.getElementById('detail-priority').className = `badge badge-${task.priority}`;
  document.getElementById('detail-assignee').textContent = `Assignee: ${task.assignee_name || 'Unassigned'}`;
  document.getElementById('detail-due-date').textContent = `Due: ${formatDate(task.due_date)}`;

  // Comments
  const commentsList = document.getElementById('comments-list');
  commentsList.innerHTML = (task.comments || []).map(c => `
    <div class="comment-item" data-testid="comment-${c.id}">
      <div class="comment-header">
        <span class="comment-author">${c.user_name}</span>
        <div>
          <span class="comment-date">${formatDate(c.created_at)}</span>
          <button class="btn btn-ghost btn-sm" onclick="deleteComment(${c.id})" data-testid="delete-comment-${c.id}">🗑️</button>
        </div>
      </div>
      <div class="comment-body">${c.content}</div>
    </div>
  `).join('') || '<p style="color:var(--text-muted); font-size:0.85rem;">No comments yet.</p>';

  // Attachments
  const attachList = document.getElementById('attachments-list');
  attachList.innerHTML = (task.attachments || []).map(a => `
    <div class="attachment-item" data-testid="attachment-${a.id}">
      <span>📎 ${a.original_name}</span>
      <div class="attachment-actions">
        <button class="btn btn-ghost btn-sm" onclick="downloadAttachment(${a.id})" data-testid="download-attachment-${a.id}">⬇️</button>
        <button class="btn btn-ghost btn-sm" onclick="deleteAttachment(${a.id})" data-testid="delete-attachment-${a.id}">🗑️</button>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-muted); font-size:0.85rem;">No attachments.</p>';
}

// Add comment
document.getElementById('add-comment-btn').addEventListener('click', async () => {
  const input = document.getElementById('comment-input');
  const content = input.value.trim();
  if (!content) return;
  const res = await apiFetch(`/tasks/${currentDetailTaskId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  if (res && res.ok) {
    input.value = '';
    showToast('Comment added');
    loadTaskDetail(currentDetailTaskId);
  }
});

async function deleteComment(commentId) {
  showConfirmModal('Delete this comment?', async () => {
    const res = await apiFetch(`/comments/${commentId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Comment deleted');
      loadTaskDetail(currentDetailTaskId);
    }
  });
}

// File upload
document.getElementById('attachment-upload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiFetch(`/tasks/${currentDetailTaskId}/attachments`, {
    method: 'POST',
    body: formData,
  });
  if (res && res.ok) {
    showToast(`Uploaded ${file.name}`);
    e.target.value = '';
    loadTaskDetail(currentDetailTaskId);
  }
});

async function downloadAttachment(attachmentId) {
  const a = document.createElement('a');
  a.href = `${API}/attachments/${attachmentId}/download`;
  a.setAttribute('download', '');
  // Include auth
  const res = await fetch(`${API}/attachments/${attachmentId}/download`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (res.ok) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    a.href = url;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

async function deleteAttachment(attachmentId) {
  showConfirmModal('Delete this attachment?', async () => {
    const res = await apiFetch(`/attachments/${attachmentId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Attachment deleted');
      loadTaskDetail(currentDetailTaskId);
    }
  });
}

// ─────────────────────────────────────────────────────────────
// TASK MODAL (CREATE / EDIT)
// ─────────────────────────────────────────────────────────────

async function loadUsersForAssignee() {
  const res = await apiFetch('/users');
  if (!res) return;
  const data = await res.json();
  const select = document.getElementById('task-assignee');
  select.innerHTML = '<option value="">Unassigned</option>' +
    data.data.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
}

document.getElementById('create-task-btn').addEventListener('click', () => {
  openTaskModal();
});

function openTaskModal(task = null) {
  const modal = document.getElementById('task-modal');
  const title = document.getElementById('task-modal-title');
  document.getElementById('task-edit-id').value = task ? task.id : '';
  document.getElementById('task-title').value = task ? task.title : '';
  document.getElementById('task-description').value = task ? task.description : '';
  document.getElementById('task-status').value = task ? task.status : 'todo';
  document.getElementById('task-priority').value = task ? task.priority : 'medium';
  document.getElementById('task-assignee').value = task ? (task.assignee_id || '') : '';
  document.getElementById('task-due-date').value = task ? (task.due_date || '') : '';
  title.textContent = task ? 'Edit Task' : 'New Task';
  modal.classList.add('active');
}

function closeTaskModal() {
  document.getElementById('task-modal').classList.remove('active');
}

document.getElementById('close-task-modal').addEventListener('click', closeTaskModal);
document.getElementById('cancel-task-btn').addEventListener('click', closeTaskModal);

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const editId = document.getElementById('task-edit-id').value;
  const body = {
    title: document.getElementById('task-title').value,
    description: document.getElementById('task-description').value,
    status: document.getElementById('task-status').value,
    priority: document.getElementById('task-priority').value,
    assignee_id: document.getElementById('task-assignee').value || null,
    due_date: document.getElementById('task-due-date').value || null,
  };

  let res;
  if (editId) {
    res = await apiFetch(`/tasks/${editId}`, { method: 'PUT', body: JSON.stringify(body) });
  } else {
    res = await apiFetch('/tasks', { method: 'POST', body: JSON.stringify(body) });
  }

  if (res && res.ok) {
    closeTaskModal();
    showToast(editId ? 'Task updated' : 'Task created');
    if (currentPage === 'board') loadBoard();
    else if (currentPage === 'list') loadTaskList();
    else if (currentPage === 'dashboard') loadDashboard();
  }
});

async function editTask(taskId) {
  const res = await apiFetch(`/tasks/${taskId}`);
  if (!res) return;
  const task = await res.json();
  openTaskModal(task);
}

// ─────────────────────────────────────────────────────────────
// DELETE TASK (WITH CONFIRM MODAL)
// ─────────────────────────────────────────────────────────────

let confirmCallback = null;

function showConfirmModal(message, callback) {
  document.getElementById('confirm-message').textContent = message;
  document.getElementById('confirm-modal').classList.add('active');
  confirmCallback = callback;
}

document.getElementById('confirm-cancel').addEventListener('click', () => {
  document.getElementById('confirm-modal').classList.remove('active');
  confirmCallback = null;
});
document.getElementById('confirm-ok').addEventListener('click', async () => {
  document.getElementById('confirm-modal').classList.remove('active');
  if (confirmCallback) await confirmCallback();
  confirmCallback = null;
});

async function deleteTask(taskId) {
  showConfirmModal('Are you sure you want to delete this task?', async () => {
    const res = await apiFetch(`/tasks/${taskId}`, { method: 'DELETE' });
    if (res && res.ok) {
      showToast('Task deleted');
      loadTaskList();
    }
  });
}

// ─────────────────────────────────────────────────────────────
// USERS PAGE
// ─────────────────────────────────────────────────────────────

async function loadUsers() {
  const res = await apiFetch('/users');
  if (!res) return;
  const data = await res.json();
  const tbody = document.getElementById('users-table-body');
  tbody.innerHTML = data.data.map(u => `
    <tr data-testid="user-row-${u.id}">
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>
        <select class="form-control" data-testid="user-role-select-${u.id}" onchange="updateUserRole(${u.id}, this.value)" style="width:auto;">
          <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
          <option value="manager" ${u.role === 'manager' ? 'selected' : ''}>Manager</option>
          <option value="member" ${u.role === 'member' ? 'selected' : ''}>Member</option>
        </select>
      </td>
      <td>
        <button class="btn btn-ghost btn-sm" onclick="deleteUser(${u.id})" data-testid="delete-user-${u.id}">🗑️</button>
      </td>
    </tr>
  `).join('');
}

async function updateUserRole(userId, role) {
  const res = await apiFetch(`/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  });
  if (!res) return;
  const data = await res.json();
  if (res.ok) {
    showToast('User role updated');
  } else {
    showToast(data.error || 'Permission denied');
    loadUsers();
  }
}

async function deleteUser(userId) {
  showConfirmModal('Are you sure you want to delete this user?', async () => {
    const res = await apiFetch(`/users/${userId}`, { method: 'DELETE' });
    if (!res) return;
    const data = await res.json();
    if (res.ok) {
      showToast('User deleted');
      loadUsers();
    } else {
      showToast(data.error || 'Permission denied');
    }
  });
}

// ─────────────────────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────────────────────

function loadSettings() {
  if (currentUser) {
    document.getElementById('settings-name').value = currentUser.name;
    document.getElementById('settings-email').value = currentUser.email;
  }
}

document.getElementById('save-profile-btn').addEventListener('click', async () => {
  const name = document.getElementById('settings-name').value;
  const email = document.getElementById('settings-email').value;
  const res = await apiFetch(`/users/${currentUser.id}`, {
    method: 'PUT',
    body: JSON.stringify({ name, email }),
  });
  if (res && res.ok) {
    currentUser.name = name;
    currentUser.email = email;
    document.querySelector('[data-testid="user-name"]').textContent = name;
    showToast('Profile saved');
  }
});

document.getElementById('dark-mode-toggle').addEventListener('change', (e) => {
  showToast(e.target.checked ? 'Dark mode enabled' : 'Light mode enabled');
});
