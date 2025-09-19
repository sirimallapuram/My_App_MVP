const axios = require('axios');
const PY = process.env.PYTHON_URL || 'http://localhost:8000';

async function translateText(text, targetLang) {
  try {
    const res = await axios.post(`${PY}/translate`, { text, lang: targetLang }, { timeout: 5000 });
    return res.data; // expect { translated: '...' } or similar from Python
  } catch (err) {
    // fallback - return original text and note mocked
    return { translated: text, _mock: true };
  }
}

module.exports = { translateText };
