const axios = require("axios");
const { callPythonAPI } = require("./python-integration");

async function callPythonAPI(text, lang) {
  try {
    const response = await axios.post("http://127.0.0.1:8000/translate", {
      text,
      target_lang: lang
    });

    return response.data;
  } catch (err) {
    console.error("❌ Error calling Python API:", err.message);
    return { error: err.message };
  }
}

module.exports = { callPythonAPI };
