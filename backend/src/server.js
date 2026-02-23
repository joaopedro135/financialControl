require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const cookieParser = require('cookie-parser');

const authRoutes       = require('./routes/authRoutes');
const investmentRoutes = require('./routes/investmentRoutes');
const indicesRoutes    = require('./routes/indicesRoutes');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());

app.use(cors({
  origin: function(origin, callback) {
    // Permite qualquer origem em desenvolvimento
    if (!origin || origin.startsWith('http://127.0.0.1') || origin.startsWith('http://localhost')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/api/auth',        authRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/indices',     indicesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Rota ${req.method} ${req.path} não encontrada.` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor.'
      : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀  Servidor rodando em http://localhost:${PORT}`);
  console.log(`📋  Healthcheck: http://localhost:${PORT}/api/health`);
  console.log(`🌍  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});