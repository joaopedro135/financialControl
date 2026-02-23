function formatCurrency(value) {
  return parseFloat(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

function formatPercent(value) {
  const num  = parseFloat(value);
  const sign = num >= 0 ? '+' : '';
  return `${sign}${num.toFixed(2)}%`;
}

function calcCurrentValue(amount, yieldRate, dateStr, refDate = new Date()) {
  const start = new Date(dateStr);
  const days  = Math.max(0, (refDate - start) / (1000 * 60 * 60 * 24));
  return amount * Math.pow(1 + yieldRate / 100, days / 365);
}

function calcValueForDate(investment, refDate) {
  const dateStr = refDate.toISOString().split('T')[0];
  if (investment.date > dateStr) return 0;
  if (investment.maturity_date && investment.maturity_date <= dateStr) {
    return calcCurrentValue(
      parseFloat(investment.amount),
      parseFloat(investment.yield_rate),
      investment.date,
      new Date(investment.maturity_date)
    );
  }
  return calcCurrentValue(
    parseFloat(investment.amount),
    parseFloat(investment.yield_rate),
    investment.date,
    refDate
  );
}

function updateCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  const hoje    = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formatted = hoje.toLocaleDateString('pt-BR', options);
  el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function renderCategoryTable(investments, category) {
  const section   = document.getElementById('category-section');
  const title     = document.getElementById('category-title');
  const tbody     = document.getElementById('category-table-body');

  const filtered = investments.filter(i => i.type === category);

  title.textContent = `Investimentos — ${category.toUpperCase()}`;
  section.style.display = 'block';

  tbody.innerHTML = filtered.map(i => {
    const estimated  = calcValueForDate(i, new Date());
    const yieldClass = parseFloat(i.yield_rate) >= 0 ? 'text-success' : 'text-danger';

    return `
      <tr>
        <td class="cell-date">${formatDate(i.date)}</td>
        <td class="cell-type">${i.name ? i.name : i.type.toUpperCase()}</td>
        <td class="cell-amount">${formatCurrency(i.amount)}</td>
        <td class="cell-yield ${yieldClass}">${formatPercent(i.yield_rate)} a.a.</td>
        <td class="cell-total">${formatCurrency(estimated)}</td>
        <td><span class="badge badge-success">Ativo</span></td>
      </tr>
    `;
  }).join('');

  // Rola suavemente até a tabela
  section.scrollIntoView({ behavior: 'smooth' });
}

function renderPieChart(investments) {
  const groups = {};
  investments.forEach(i => {
    if (!groups[i.type]) groups[i.type] = 0;
    groups[i.type] += parseFloat(i.amount);
  });

  const labels     = Object.keys(groups).map(t => t.toUpperCase());
  const values     = Object.values(groups);
  const types      = Object.keys(groups);
  const total      = values.reduce((s, v) => s + v, 0);
  const colors     = ['#3B6FF0', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];

  const ctx = document.getElementById('pie-chart');
  if (!ctx) return;

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff',
        hoverOffset: 12,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#6B7280',
            font: { size: 13 },
            padding: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: ctx => {
              const value = ctx.raw;
              const pct   = ((value / total) * 100).toFixed(1);
              return ` ${formatCurrency(value)} (${pct}%)`;
            },
          },
        },
      },
      onClick: (event, elements) => {
        if (elements.length === 0) return;
        const index    = elements[0].index;
        const category = types[index];
        renderCategoryTable(investments, category);
      },
    },
  });
}

async function loadUser() {
  try {
    const res  = await fetch(`${API_URL}/auth/me`, { credentials: 'include' });
    const data = await res.json();
    if (data.user) {
      const nameEl   = document.getElementById('user-name');
      const emailEl  = document.getElementById('user-email');
      const avatarEl = document.getElementById('user-avatar');
      if (nameEl)   nameEl.textContent   = data.user.name;
      if (emailEl)  emailEl.textContent  = data.user.email;
      if (avatarEl) avatarEl.textContent = data.user.name
        .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
  } catch (err) {
    console.error('Erro ao carregar usuário:', err);
  }
}

async function loadDistribuicao() {
  try {
    const res = await fetch(`${API_URL}/investments`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) return;

    const { investments } = await res.json();

    updateCurrentDate();
    await loadUser();
    renderPieChart(investments);

  } catch (err) {
    console.error('Erro ao carregar distribuição:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadDistribuicao();
});