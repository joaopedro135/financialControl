const INDICES = { cdi: 14.50, selic: 14.75, ipca: 4.83 };

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

function calcRealRate(yieldRate, yieldType) {
  if (yieldType === 'cdi')   return (yieldRate * INDICES.cdi)   / 100;
  if (yieldType === 'selic') return (yieldRate * INDICES.selic) / 100;
  if (yieldType === 'ipca')  return INDICES.ipca + yieldRate;
  return yieldRate;
}

function updatePreview() {
  const amount      = parseFloat(document.getElementById('amount')?.value) || 0;
  const yieldRate   = parseFloat(document.getElementById('yield-rate')?.value) || 0;
  const yieldType   = document.getElementById('yield-type')?.value || 'aa';
  const realRate    = calcRealRate(yieldRate, yieldType);
  const estimated   = amount * (1 + realRate / 100);
  const fmt = v => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const previewAmount = document.getElementById('preview-amount');
  const previewYield  = document.getElementById('preview-yield');
  const previewTotal  = document.getElementById('preview-total');

  if (previewAmount) previewAmount.textContent = amount    ? fmt(amount)                    : 'R$ —';
  if (previewYield)  previewYield.textContent  = yieldRate ? `${realRate.toFixed(2)}% a.a.` : '— %';
  if (previewTotal)  previewTotal.textContent  = amount    ? fmt(estimated)                 : 'R$ —';
}

function initInvestmentForm() {
  const form = document.getElementById('investment-form');
  if (!form) return;

  const style = document.createElement('style');
  style.textContent = '.input-error { border-color: var(--color-danger) !important; box-shadow: 0 0 0 3px rgba(239,68,68,0.12) !important; }';
  document.head.appendChild(style);

  // Atualiza sufixo e help quando muda o tipo de taxa
  const yieldType   = document.getElementById('yield-type');
  const yieldSuffix = document.getElementById('yield-suffix');
  const yieldHelp   = document.getElementById('yield-help');

  yieldType?.addEventListener('change', () => {
    const type = yieldType.value;
    if (type === 'cdi') {
      yieldSuffix.textContent = '% do CDI';
      yieldHelp.textContent   = `CDI atual: ${INDICES.cdi}% a.a. Ex: 84 = ${(84 * INDICES.cdi / 100).toFixed(2)}% a.a.`;
    } else if (type === 'ipca') {
      yieldSuffix.textContent = '% + IPCA';
      yieldHelp.textContent   = `IPCA atual: ${INDICES.ipca}% a.a. Ex: 6 = IPCA + 6% a.a.`;
    } else if (type === 'selic') {
      yieldSuffix.textContent = '% da Selic';
      yieldHelp.textContent   = `Selic atual: ${INDICES.selic}% a.a. Ex: 100 = ${INDICES.selic}% a.a.`;
    } else {
      yieldSuffix.textContent = '% a.a.';
      yieldHelp.textContent   = 'Taxa anual esperada de rendimento.';
    }
    updatePreview();
  });

  document.getElementById('amount')?.addEventListener('input', updatePreview);
  document.getElementById('yield-rate')?.addEventListener('input', updatePreview);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors(form);

    const type         = document.getElementById('investment-type').value;
    const name         = document.getElementById('investment-name').value.trim();
    const amount       = document.getElementById('amount').value;
    const yieldRate    = parseFloat(document.getElementById('yield-rate').value) || 0;
    const yieldTypeVal = document.getElementById('yield-type').value;
    const date         = document.getElementById('investment-date').value;
    const maturityDate = document.getElementById('maturity-date').value;
    const notes        = document.getElementById('notes').value.trim();
    const submitBtn    = form.querySelector('[type="submit"]');

    let hasError = false;
    if (!type)   { showFieldError('investment-type',  'Selecione o tipo.');         hasError = true; }
    if (!amount) { showFieldError('amount',           'Informe o valor.');          hasError = true; }
    if (!date)   { showFieldError('investment-date',  'Informe a data do aporte.'); hasError = true; }
    if (hasError) return;

    const realRate = calcRealRate(yieldRate, yieldTypeVal);

    setButtonLoading(submitBtn, true, 'Salvando...');

    try {
      const res = await fetch(`${API_URL}/investments`, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type,
          name,
          amount,
          yield_rate:    realRate.toFixed(4),
          date,
          maturity_date: maturityDate || null,
          notes,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        showFormError(form, data.message || 'Erro ao salvar investimento.');
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

document.addEventListener('DOMContentLoaded', () => {
  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    const hoje = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    const formatted = hoje.toLocaleDateString('pt-BR', options);
    dateEl.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }

  initInvestmentForm();
});