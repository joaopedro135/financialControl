function updateCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  const hoje    = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formatted = hoje.toLocaleDateString('pt-BR', options);
  el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function showFeedback(formId, message, type) {
  // Remove feedback anterior se existir
  const existing = document.getElementById(`${formId}-feedback`);
  if (existing) existing.remove();

  const el = document.createElement('div');
  el.id        = `${formId}-feedback`;
  el.className = `config-feedback ${type}`;
  el.textContent = message;

  const form = document.getElementById(formId);
  form.insertAdjacentElement('afterend', el);

  setTimeout(() => el.remove(), 4000);
}

async function loadProfile() {
  try {
    const res  = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    const data = await res.json();

    if (data.user) {
      document.getElementById('profile-name').value  = data.user.name  || '';
      document.getElementById('profile-email').value = data.user.email || '';

      // Atualiza sidebar
      const nameEl   = document.getElementById('user-name');
      const emailEl  = document.getElementById('user-email');
      const avatarEl = document.getElementById('user-avatar');

      if (nameEl)   nameEl.textContent   = data.user.name;
      if (emailEl)  emailEl.textContent  = data.user.email;
      if (avatarEl) avatarEl.textContent = data.user.name
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
  } catch (err) {
    console.error('Erro ao carregar perfil:', err);
  }
}

async function handleProfileSubmit(e) {
  e.preventDefault();

  const name  = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const btn   = document.getElementById('profile-btn');

  if (!name || !email) {
    showFeedback('profile-form', 'Preencha todos os campos.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Salvando...';

  try {
    const res  = await fetch(`${API_URL}/auth/profile`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (res.ok) {
      showFeedback('profile-form', 'Perfil atualizado com sucesso!', 'success');

      // Atualiza sidebar
      const nameEl   = document.getElementById('user-name');
      const emailEl  = document.getElementById('user-email');
      const avatarEl = document.getElementById('user-avatar');

      if (nameEl)   nameEl.textContent   = name;
      if (emailEl)  emailEl.textContent  = email;
      if (avatarEl) avatarEl.textContent = name
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    } else {
      showFeedback('profile-form', data.error || 'Erro ao atualizar perfil.', 'error');
    }
  } catch (err) {
    showFeedback('profile-form', 'Não foi possível conectar ao servidor.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Salvar alterações';
  }
}

async function handlePasswordSubmit(e) {
  e.preventDefault();

  const current = document.getElementById('current-password').value;
  const newPass = document.getElementById('new-password').value;
  const confirm = document.getElementById('confirm-new-password').value;
  const btn     = document.getElementById('password-btn');

  if (!current || !newPass || !confirm) {
    showFeedback('password-form', 'Preencha todos os campos.', 'error');
    return;
  }

  if (newPass !== confirm) {
    showFeedback('password-form', 'As senhas não coincidem.', 'error');
    return;
  }

  if (newPass.length < 6) {
    showFeedback('password-form', 'A nova senha deve ter pelo menos 6 caracteres.', 'error');
    return;
  }

  btn.disabled    = true;
  btn.textContent = 'Alterando...';

  try {
    const res  = await fetch(`${API_URL}/auth/password`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: current, new_password: newPass }),
    });

    const data = await res.json();

    if (res.ok) {
      showFeedback('password-form', 'Senha alterada com sucesso!', 'success');
      document.getElementById('password-form').reset();
    } else {
      showFeedback('password-form', data.error || 'Erro ao alterar senha.', 'error');
    }
  } catch (err) {
    showFeedback('password-form', 'Não foi possível conectar ao servidor.', 'error');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Alterar senha';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateCurrentDate();
  loadProfile();

  document.getElementById('profile-form')
    .addEventListener('submit', handleProfileSubmit);

  document.getElementById('password-form')
    .addEventListener('submit', handlePasswordSubmit);
});