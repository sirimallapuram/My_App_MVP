const axios = require('axios');

const PYTHON_API = process.env.PYTHON_API || "http://127.0.0.1:8000";

async function translateText(text, targetLang) {
  try {
    const response = await axios.post(`${PYTHON_API}/translate`, {
      text,
      target_lang: targetLang
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error calling Python API:', error.message);
    return { success: false, error: error.message };
  }
}

module.exports = { translateText };
