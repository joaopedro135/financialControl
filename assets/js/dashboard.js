const ITEMS_PER_PAGE = 10;
let currentPage      = 1;
let allInvestments   = [];

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

async function loadDashboard() {
  try {
    const res = await fetch(`${API_URL}/investments`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) return;

    const { investments } = await res.json();

    allInvestments = investments;
    currentPage    = 1;

    updateCurrentDate();

    updateSummaryCards(investments);
    updateDistribution(investments);
    renderChart(investments, '6m');
    initPeriodFilter(investments);
    renderTable(allInvestments, currentPage);

  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
  }
}

function updateSummaryCards(investments) {
  const totalInvested = investments.reduce((sum, i) => sum + parseFloat(i.amount), 0);
  const totalCurrent  = investments.reduce((sum, i) => {
    return sum + calcCurrentValue(parseFloat(i.amount), parseFloat(i.yield_rate), i.date);
  }, 0);
  const profitLoss = totalCurrent - totalInvested;
  const yieldPct   = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

  const totalInvestedEl = document.getElementById('total-invested');
  const totalCurrentEl  = document.getElementById('total-current');
  const profitLossEl    = document.getElementById('profit-loss');
  const yieldPctEl      = document.getElementById('yield-pct');

  if (totalInvestedEl) totalInvestedEl.textContent = formatCurrency(totalInvested);
  if (totalCurrentEl)  totalCurrentEl.textContent  = formatCurrency(totalCurrent);
  if (profitLossEl) {
    profitLossEl.textContent = (profitLoss >= 0 ? '+ ' : '- ') + formatCurrency(Math.abs(profitLoss));
    profitLossEl.className   = 'summary-card__value mono ' + (profitLoss >= 0 ? 'text-success' : 'text-danger');
  }
  if (yieldPctEl) {
    yieldPctEl.textContent = formatPercent(yieldPct);
    yieldPctEl.className   = 'summary-card__value mono ' + (yieldPct >= 0 ? 'text-success' : 'text-danger');
  }
}

function updateDistribution(investments) {
  if (investments.length === 0) return;

  const groups = {};
  investments.forEach(i => {
    const type = i.type;
    if (!groups[type]) groups[type] = 0;
    groups[type] += parseFloat(i.amount);
  });

  const total     = Object.values(groups).reduce((sum, v) => sum + v, 0);
  const colors    = ['bar-blue', 'bar-green', 'bar-yellow', 'bar-purple'];
  const dotColors = ['#3B6FF0', '#10B981', '#F59E0B', '#8B5CF6'];
  const types     = Object.keys(groups);

  const distributionList = document.querySelector('.distribution-list');
  if (!distributionList) return;

  distributionList.innerHTML = types.map((type, index) => {
    const pct      = ((groups[type] / total) * 100).toFixed(1);
    const colorBar = colors[index % colors.length];
    const colorDot = dotColors[index % dotColors.length];

    return `
      <div class="distribution-item">
        <div class="distribution-item__info">
          <span class="distribution-item__label">
            <span class="distribution-dot" style="background:${colorDot};"></span>
            ${type.toUpperCase()}
          </span>
          <span class="distribution-item__pct">${pct}%</span>
        </div>
        <div class="distribution-bar-track">
          <div class="distribution-bar-fill ${colorBar}" style="width: ${pct}%;"></div>
        </div>
      </div>
    `;
  }).join('');
}

function renderChart(investments, period = '6m') {
  const chartDiv = document.getElementById('chart');
  if (!chartDiv || investments.length === 0) return;

  const canvas = document.createElement('canvas');
  chartDiv.innerHTML = '';
  chartDiv.style.padding = '0';
  chartDiv.appendChild(canvas);

  const today  = new Date();
  const endMap = {
    '1m':  new Date(new Date().setMonth(today.getMonth() + 1)),
    '6m':  new Date(new Date().setMonth(today.getMonth() + 6)),
    '1y':  new Date(new Date().setFullYear(today.getFullYear() + 1)),
    '10y': new Date(new Date().setFullYear(today.getFullYear() + 10)),
  };

  const endDate = endMap[period] || endMap['6m'];
  const labels  = [];
  const values  = [];

  for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
    const refDate = new Date(d);
    const dateStr = refDate.toISOString().split('T')[0];
    labels.push(formatDate(dateStr));
    const total = investments.reduce((sum, i) => sum + calcValueForDate(i, refDate), 0);
    values.push(total.toFixed(2));
  }

  if (window._chart) window._chart.destroy();

  window._chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Projeção Patrimonial',
        data: values,
        borderColor: '#3B6FF0',
        backgroundColor: 'rgba(59, 111, 240, 0.08)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => parseFloat(ctx.raw).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
          },
        },
      },
      scales: {
        x: {
          ticks: { maxTicksLimit: 6, color: '#9CA3AF', font: { size: 11 } },
          grid: { display: false },
        },
        y: {
          ticks: {
            color: '#9CA3AF',
            font: { size: 11 },
            callback: v => parseFloat(v).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            }),
          },
          grid: { color: 'rgba(0,0,0,0.05)' },
        },
      },
    },
  });
}

function initPeriodFilter(investments) {
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderChart(investments, btn.dataset.period);
    });
  });
}

function renderPagination(totalPages, page) {
  const pagination = document.querySelector('.pagination');
  const footer     = document.querySelector('.table-footer');
  if (!pagination) return;

  // Esconde o rodapé se só há 1 página ou nenhuma
  if (footer) footer.style.display = totalPages <= 1 ? 'none' : 'flex';
  if (totalPages <= 1) return;

  let html = `
    <button class="page-btn" id="prev-btn" aria-label="Página anterior" ${page === 1 ? 'disabled' : ''}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    html += `
      <button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}" aria-label="Página ${i}">
        ${i}
      </button>
    `;
  }

  html += `
    <button class="page-btn" id="next-btn" aria-label="Próxima página" ${page === totalPages ? 'disabled' : ''}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </button>
  `;

  pagination.innerHTML = html;

  pagination.querySelector('#prev-btn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable(allInvestments, currentPage);
    }
  });

  pagination.querySelector('#next-btn')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable(allInvestments, currentPage);
    }
  });

  pagination.querySelectorAll('[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = parseInt(btn.dataset.page);
      renderTable(allInvestments, currentPage);
    });
  });
}

function renderTable(investments, page = 1) {
  const tbody = document.getElementById('investments-table-body');
  if (!tbody) return;

  if (investments.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding: 40px; color: var(--color-text-muted);">
          Nenhum investimento cadastrado ainda.
          <a href="add-investment.html" style="display:block; margin-top: 8px;">Adicionar primeiro investimento</a>
        </td>
      </tr>
    `;
    renderPagination(0, page);
    return;
  }

  const totalPages = Math.ceil(investments.length / ITEMS_PER_PAGE);
  const start      = (page - 1) * ITEMS_PER_PAGE;
  const end        = start + ITEMS_PER_PAGE;
  const pageItems  = investments.slice(start, end);

  tbody.innerHTML = pageItems.map(i => {
    const estimated  = calcValueForDate(i, new Date());
    const yieldClass = parseFloat(i.yield_rate) >= 0 ? 'text-success' : 'text-danger';

    return `
      <tr>
        <td class="cell-date">${formatDate(i.date)}</td>
        <td class="cell-type">${i.name ? i.name : i.type}</td>
        <td class="cell-amount">${formatCurrency(i.amount)}</td>
        <td class="cell-yield ${yieldClass}">${formatPercent(i.yield_rate)} a.a.</td>
        <td class="cell-total">${formatCurrency(estimated)}</td>
        <td><span class="badge badge-success">Ativo</span></td>
      </tr>
    `;
  }).join('');

  const footerInfo = document.querySelector('.table-footer__info');
  if (footerInfo) {
    footerInfo.textContent = `Mostrando ${start + 1}–${Math.min(end, investments.length)} de ${investments.length} registros`;
  }

  renderPagination(totalPages, page);
}

function updateCurrentDate() {
  const el = document.getElementById('current-date');
  if (!el) return;

  const hoje = new Date();
  const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const formatted = hoje.toLocaleDateString('pt-BR', options);

  // Capitaliza a primeira letra
  el.textContent = formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

document.addEventListener('DOMContentLoaded', () => {
  loadDashboard();
});