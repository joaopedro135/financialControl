const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

function generateToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function sendTokenResponse(res, statusCode, user, token) {
  const isProduction = process.env.NODE_ENV === 'production';

  res
    .status(statusCode)
    .cookie('invest_token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      success: true,
      user: {
        id:         user.id,
        name:       user.name,
        email:      user.email,
        created_at: user.created_at,
      },
      token,
    });
}

async function register(req, res) {
  try {
    const { name, email, password, confirm_password } = req.body;

    if (!name || !email || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Todos os campos são obrigatórios.',
      });
    }

    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'As senhas não conferem.',
        field: 'confirm_password',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'A senha deve ter no mínimo 8 caracteres.',
        field: 'password',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de e-mail inválido.',
        field: 'email',
      });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Este e-mail já está cadastrado.',
        field: 'email',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        name:          name.trim(),
        email:         email.toLowerCase().trim(),
        password_hash: passwordHash,
      })
      .select('id, name, email, created_at')
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao criar conta. Tente novamente.',
      });
    }

    const token = generateToken(newUser);
    sendTokenResponse(res, 201, newUser, token);

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'E-mail e senha são obrigatórios.',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, password_hash, created_at')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }

    const INVALID_CREDENTIALS = 'E-mail ou senha incorretos.';

    if (!user) {
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: INVALID_CREDENTIALS });
    }

    const token = generateToken(user);
    sendTokenResponse(res, 200, user, token);

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

function logout(req, res) {
  res
    .clearCookie('invest_token', { httpOnly: true, secure: true, sameSite: 'none' })
    .json({ success: true, message: 'Logout realizado com sucesso.' });
}

async function getMe(req, res) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, name, email, created_at')
      .eq('id', req.user.sub)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'Usuário não encontrado.' });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error('GetMe error:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

async function updateProfile(req, res) {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, error: 'Nome e e-mail são obrigatórios.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ success: false, error: 'Formato de e-mail inválido.' });
    }

    // Verifica se o e-mail já está em uso por outro usuário
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .neq('id', req.user.sub)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ success: false, error: 'Este e-mail já está em uso.' });
    }

    const { data: updated, error } = await supabase
      .from('users')
      .update({ name: name.trim(), email: email.toLowerCase().trim() })
      .eq('id', req.user.sub)
      .select('id, name, email, created_at')
      .single();

    if (error) {
      return res.status(500).json({ success: false, error: 'Erro ao atualizar perfil.' });
    }

    res.json({ success: true, user: updated });

  } catch (err) {
    console.error('UpdateProfile error:', err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
}

async function updatePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, error: 'Preencha todos os campos.' });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, password_hash')
      .eq('id', req.user.sub)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado.' });
    }

    const match = await bcrypt.compare(current_password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, error: 'Senha atual incorreta.' });
    }

    const newHash = await bcrypt.hash(new_password, 12);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', req.user.sub);

    if (updateError) {
      return res.status(500).json({ success: false, error: 'Erro ao alterar senha.' });
    }

    res.json({ success: true, message: 'Senha alterada com sucesso.' });

  } catch (err) {
    console.error('UpdatePassword error:', err);
    res.status(500).json({ success: false, error: 'Erro interno do servidor.' });
  }
}

module.exports = { register, login, logout, getMe, updateProfile, updatePassword };