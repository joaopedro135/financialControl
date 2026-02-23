function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  field.classList.add('input-error');
  const prev = field.parentElement.querySelector('.field-error-msg');
  if (prev) prev.remove();
  const msg = document.createElement('span');
  msg.className = 'field-error-msg';
  msg.textContent = message;
  msg.style.cssText = 'color: var(--color-danger); font-size: 0.8125rem; margin-top: 4px; display: block;';
  field.parentElement.appendChild(msg);
}

function clearErrors(form) {
  form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
  form.querySelectorAll('.field-error-msg').forEach(el => el.remove());
  const banner = form.querySelector('.form-error-banner');
  if (banner) banner.remove();
}

function showFormError(form, message) {
  const prev = form.querySelector('.form-error-banner');
  if (prev) prev.remove();
  const banner = document.createElement('div');
  banner.className = 'form-error-banner';
  banner.textContent = message;
  banner.style.cssText = `
    background: var(--color-danger-light);
    color: var(--color-danger);
    border: 1px solid rgba(239,68,68,0.3);
    border-radius: var(--radius-md);
    padding: 12px 16px;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 8px;
  `;
  form.prepend(banner);
}

function setButtonLoading(btn, loading, loadingText = 'Aguarde...') {
  if (loading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = loadingText;
    btn.disabled = true;
    btn.style.opacity = '0.7';
  } else {
    btn.textContent = btn.dataset.originalText || btn.textContent;
    btn.disabled = false;
    btn.style.opacity = '1';
  }
}

async function checkAuth(pageType = 'protected') {
  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
    });

    const isAuthenticated = res.ok;

    if (pageType === 'protected' && !isAuthenticated) {
      window.location.href = 'login.html';
      return null;
    }

    if (pageType === 'public' && isAuthenticated) {
      window.location.href = 'dashboard.html';
      return null;
    }

    if (isAuthenticated) {
      const { user } = await res.json();
      return user;
    }
  } catch {
    if (pageType === 'protected') {
      window.location.href = 'login.html';
    }
  }

  return null;
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const style = document.createElement('style');
  style.textContent = '.input-error { border-color: var(--color-danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }';
  document.head.appendChild(style);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const email     = document.getElementById('email').value.trim();
    const password  = document.getElementById('password').value;
    const submitBtn = form.querySelector('[type="submit"]');

    let hasError = false;
    if (!email)    { showFieldError('email',    'Informe seu e-mail.'); hasError = true; }
    if (!password) { showFieldError('password', 'Informe sua senha.');  hasError = true; }
    if (hasError) return;

    setButtonLoading(submitBtn, true, 'Entrando...');

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          showFieldError(data.field, data.message);
        } else {
          showFormError(form, data.message || 'E-mail ou senha incorretos.');
        }
        return;
      }

      window.location.href = 'dashboard.html';

    } catch {
      showFormError(form, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

function initRegisterForm() {
  const form = document.getElementById('register-form');
  if (!form) return;

  const style = document.createElement('style');
  style.textContent = '.input-error { border-color: var(--color-danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }';
  document.head.appendChild(style);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const name             = document.getElementById('fullname').value.trim();
    const email            = document.getElementById('email').value.trim();
    const password         = document.getElementById('password').value;
    const confirm_password = document.getElementById('confirm-password').value;
    const submitBtn        = form.querySelector('[type="submit"]');

    let hasError = false;
    if (!name)             { showFieldError('fullname',         'Informe seu nome.');    hasError = true; }
    if (!email)            { showFieldError('email',            'Informe seu e-mail.');  hasError = true; }
    if (!password)         { showFieldError('password',         'Informe uma senha.');   hasError = true; }
    if (!confirm_password) { showFieldError('confirm-password', 'Confirme sua senha.');  hasError = true; }
    if (password && confirm_password && password !== confirm_password) {
      showFieldError('confirm-password', 'As senhas não conferem.');
      hasError = true;
    }
    if (hasError) return;

    setButtonLoading(submitBtn, true, 'Criando conta...');

    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body:        JSON.stringify({ name, email, password, confirm_password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.field) {
          showFieldError(data.field, data.message);
        } else {
          showFormError(form, data.message || 'Erro ao criar conta.');
        }
        return;
      }

      window.location.href = 'dashboard.html';

    } catch {
      showFormError(form, 'Não foi possível conectar ao servidor. Verifique sua conexão.');
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });
}

async function logout() {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch { /* ignora erro de rede */ } finally {
    window.location.href = 'login.html';
  }
}

function initLogoutButton() {
  const btn = document.getElementById('logout-btn');
  if (btn) btn.addEventListener('click', logout);
}

document.addEventListener('DOMContentLoaded', async () => {
  const page = window.location.pathname.split('/').pop() || 'login.html';

  if (page === 'login.html') {
    await checkAuth('public');
    initLoginForm();
  }

  if (page === 'register.html') {
    await checkAuth('public');
    initRegisterForm();
  }

  const protectedPages = [
    'dashboard.html',
    'add-investment.html',
    'distribuicao.html',
    'indices.html',
    'configuracoes.html',
  ];

  if (protectedPages.includes(page)) {
    const user = await checkAuth('protected');

    if (user) {
      const nameEl   = document.getElementById('user-name');
      const emailEl  = document.getElementById('user-email');
      const avatarEl = document.getElementById('user-avatar');

      if (nameEl)   nameEl.textContent   = user.name;
      if (emailEl)  emailEl.textContent  = user.email;
      if (avatarEl) avatarEl.textContent = user.name
        .split(' ').slice(0, 2).map(w => w[0].toUpperCase()).join('');
    }

    initLogoutButton();
  }
});