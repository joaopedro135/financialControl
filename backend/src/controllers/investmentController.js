const supabase = require('../config/supabase');

async function createInvestment(req, res) {
  try {
    const userId = req.user.sub;
    const { name, type, amount, yield_rate, date, maturity_date, notes } = req.body;

    if (!type || !amount || !date) {
      return res.status(400).json({
        success: false,
        message: 'Tipo, valor e data são obrigatórios.',
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'O valor deve ser maior que zero.',
      });
    }

    const { data: investment, error } = await supabase
      .from('investments')
      .insert({
        user_id:       userId,
        name:          name || null,
        type,
        amount:        parseFloat(amount),
        yield_rate:    parseFloat(yield_rate) || 0,
        date,
        maturity_date: maturity_date || null,
        notes:         notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao salvar investimento.',
      });
    }

    res.status(201).json({ success: true, investment });

  } catch (err) {
    console.error('createInvestment error:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

async function getInvestments(req, res) {
  try {
    const userId = req.user.sub;

    const { data: investments, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      console.error('Supabase select error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao buscar investimentos.',
      });
    }

    res.json({ success: true, investments });

  } catch (err) {
    console.error('getInvestments error:', err);
    res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}

module.exports = { createInvestment, getInvestments };