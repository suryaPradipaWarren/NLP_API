import express from "express";
import { Client } from "@gradio/client";
import 'dotenv/config';


const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const HF_TOKEN = process.env.HF_TOKEN;
const SPACE_ID = process.env.SPACE_ID;

let grClient;
const API_NAME = "predict"; // sesuai config id:2

// ---- INIT ----
async function init() {
  grClient = await Client.connect(SPACE_ID, { hf_token: HF_TOKEN });
  console.log(`✅ Connected to Space: ${SPACE_ID}`);
  console.log("✅ API Name:", API_NAME);
}
await init();

// ---- CALL GRADIO ----
async function callGradio(text) {
  if (!grClient) throw new Error("Gradio client belum siap.");
  return await grClient.predict(API_NAME, [text]); // pakai api_name, bukan fn_index
}

// ---- API ----
app.post("/predict", async (req, res) => {
  try {
    const text = (req.body?.text ?? req.query?.text ?? "").trim();
    if (!text) {
      return res.status(400).json({ error: "Teks harus diisi." });
    }

    const result = await callGradio(text);
    console.log("📤 Raw Gradio result:", result);

    const raw = Array.isArray(result?.data) ? result.data[0] : result?.data;
    const emotion = typeof raw === "string" && raw.includes(":")
      ? raw.split(":").slice(1).join(":").trim()
      : raw;

    return res.json({
      status: "success",
      input: text,
      raw_output: raw,
      emotion,
    });
  } catch (error) {
    const detail = error?.message || JSON.stringify(error, null, 2);
    console.error("❌ Error /predict:", detail);
    return res.status(500).json({
      status: "error",
      message: "Prediksi gagal.",
      detail,
    });
  }
});

app.listen(port, () => {
  console.log(`🚀 Local API: http://localhost:${port}`);
});
