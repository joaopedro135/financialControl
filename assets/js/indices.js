const COLORS = {
  selic: '#3B6FF0',
  ipca:  '#F59E0B',
  igpm:  '#10B981',
};

let cachedData    = {};
let chartInstance = null;

function updateCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;
  const hoje    = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formatted = hoje.toLocaleDateString('pt-BR', options);
  el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
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

async function fetchIndice(indice) {
  if (cachedData[indice]) return cachedData[indice];
  const res  = await fetch(`${API_URL}/indices/${indice}`, { credentials: 'include' });
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  cachedData[indice] = json.data;
  return json.data;
}

function groupByYearAnual(data) {
  const years = {};
  data.forEach(item => {
    const year = item.data.split('/')[2];
    if (!years[year]) years[year] = 1;
    years[year] *= (1 + parseFloat(item.valor) / 100);
  });
  const result = {};
  Object.keys(years).forEach(y => {
    result[y] = parseFloat(((years[y] - 1) * 100).toFixed(2));
  });
  return result;
}

function getAnualValue(data, indice) {
  if (!data || data.length === 0) return '—';

  const ultimo = parseFloat(data[data.length - 1].valor);

  // SELIC e CDI são diárias — anualizar: (1 + taxa_diaria)^252 - 1
  if (indice === 'selic' || indice === 'cdi') {
    const anual = (Math.pow(1 + ultimo / 100, 252) - 1) * 100;
    return `${anual.toFixed(2)}% a.a.`;
  }

  // IPCA e IGP-M são mensais — anualizar: (1 + taxa_mensal)^12 - 1
  const anual = (Math.pow(1 + ultimo / 100, 12) - 1) * 100;
  return `${anual.toFixed(2)}% a.a.`;
}

function renderChart(selectedIndices) {
  const container = document.getElementById('indices-chart');
  if (!container) return;

  if (selectedIndices.length === 0) {
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    container.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color: var(--color-text-muted); font-size: 0.9rem;">Selecione ao menos um índice.</div>`;
    return;
  }

  const allYears = new Set();
  selectedIndices.forEach(indice => {
    if (cachedData[indice]) {
      Object.keys(groupByYearAnual(cachedData[indice])).forEach(y => allYears.add(y));
    }
  });

  const labels   = Array.from(allYears).sort();
  const datasets = selectedIndices
    .filter(indice => cachedData[indice])
    .map((indice, idx) => {
      const byYear = groupByYearAnual(cachedData[indice]);
      return {
        label:            indice.toUpperCase(),
        data:             labels.map(y => byYear[y] ?? null),
        borderColor:      COLORS[indice],
        backgroundColor:  COLORS[indice] + '18',
        borderWidth:      2.5,
        pointRadius:      3,
        pointHoverRadius: 5,
        fill:             false,
        tension:          0.3,
        spanGaps:         true,
        borderDash:       idx === 2 ? [5, 3] : [],
      };
    });

  container.innerHTML = '';
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: '#6B7280', font: { size: 12 }, padding: 20 },
        },
        tooltip: {
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${ctx.raw !== null ? ctx.raw.toFixed(2) + '% a.a.' : '—'}`,
          },
        },
      },
      scales: {
        x: {
          ticks: { color: '#9CA3AF', font: { size: 11 } },
          grid:  { display: false },
        },
        y: {
          ticks: {
            color: '#9CA3AF',
            font:  { size: 11 },
            callback: v => `${v}%`,
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    },
  });
}

async function loadAllIndices() {
  const container = document.getElementById('indices-chart');
  try {
    const [selicData, ipcaData, igpmData] = await Promise.all([
      fetchIndice('selic'),
      fetchIndice('ipca'),
      fetchIndice('igpm'),
    ]);

    document.getElementById('valor-selic').textContent = getAnualValue(selicData, 'selic');
    document.getElementById('valor-ipca').textContent  = getAnualValue(ipcaData,  'ipca');
    document.getElementById('valor-igpm').textContent  = getAnualValue(igpmData,  'igpm');

    renderChart(['selic', 'ipca', 'igpm']);
  } catch (err) {
    console.error('Erro ao carregar índices:', err);
    if (container) {
      container.innerHTML = `<div style="display:flex; align-items:center; justify-content:center; height:100%; color: var(--color-danger); font-size: 0.9rem;">Erro ao carregar dados. Verifique sua conexão.</div>`;
    }
  }
}

function initFilters() {
  document.querySelectorAll('.indice-toggle input').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      const selected = Array.from(document.querySelectorAll('.indice-toggle input:checked'))
        .map(cb => cb.value);
      renderChart(selected);
    });
  });
}

const style = document.createElement('style');
style.textContent = `
  .indices-filter {
    display: flex;
    gap: 16px;
    align-items: center;
  }
  .indice-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-secondary);
    cursor: pointer;
    user-select: none;
  }
  .indice-toggle input {
    width: 15px;
    height: 15px;
    cursor: pointer;
    accent-color: #3B6FF0;
  }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', () => {
  updateCurrentDate();
  loadUser();
  loadAllIndices();
  initFilters();
});