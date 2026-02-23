const express = require('express');
const fetch   = require('node-fetch');
const router  = express.Router();

const SERIES = {
  selic: { id: 11,  periodicidade: 'diaria' },
  ipca:  { id: 433, periodicidade: 'mensal' },
  igpm:  { id: 189, periodicidade: 'mensal' },
};

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

async function fetchBCB(serieId, startDate, endDate) {
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${serieId}/dados?formato=json&dataInicial=${startDate}&dataFinal=${endDate}`;
  const res  = await fetch(url, {
    headers: {
      'Accept':     'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`BCB ${res.status}:`, body);
    throw new Error(`BCB error: ${res.status}`);
  }
  return res.json();
}

async function fetchAll(serieId, periodicidade) {
  const today = new Date();

  if (periodicidade === 'mensal') {
    const start = new Date(today.getFullYear() - 20, 0, 1);
    return fetchBCB(serieId, formatDate(start), formatDate(today));
  }

  // Diária: máximo 10 anos — faz 2 requisições de ~9 anos e concatena
  const mid    = new Date(today.getFullYear() - 9, today.getMonth(), today.getDate());
  const start1 = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  const [part1, part2] = await Promise.all([
    fetchBCB(serieId, formatDate(start1), formatDate(mid)),
    fetchBCB(serieId, formatDate(mid),    formatDate(today)),
  ]);

  return [...part1, ...part2];
}

router.get('/:indice', async (req, res) => {
  const { indice } = req.params;
  const serie      = SERIES[indice.toLowerCase()];

  if (!serie) {
    return res.status(400).json({ success: false, error: 'Índice inválido. Use: selic, ipca ou igpm.' });
  }

  try {
    const data = await fetchAll(serie.id, serie.periodicidade);
    res.json({ success: true, indice, data });
  } catch (err) {
    console.error('Erro BCB:', err.message);
    res.status(500).json({ success: false, error: 'Erro ao buscar dados do Banco Central.' });
  }
});

module.exports = router;