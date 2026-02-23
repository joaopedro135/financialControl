const jwt = require('jsonwebtoken');

function protect(req, res, next) {
  let token = null;

  if (req.cookies && req.cookies.invest_token) {
    token = req.cookies.invest_token;
  }

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Acesso negado. Faça login para continuar.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Sessão expirada. Faça login novamente.'
        : 'Token inválido. Faça login novamente.';

    res.clearCookie('invest_token');
    return res.status(401).json({ success: false, message });
  }
}

module.exports = { protect };