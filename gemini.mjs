import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY;

const MODELS = (
  process.env.GEMINI_MODELS ||
  "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3.7-flash,gemini-3.8-flash"
)
  .split(",")
  .map((m) => m.trim());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// body ka poora object leta hai, poora jawab (data) wapis deta hai
export async function generateRaw(body, retriesPerModel = 2) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY nahi mili (.env check karo)");

  let lastError = "Koi model try nahi hua";

  for (const model of MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    for (let attempt = 1; attempt <= retriesPerModel; attempt++) {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": API_KEY,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) return data;

      lastError = `API error ${res.status} (${model}): ${data.error?.message}`;

      if (res.status === 404) break;
      if (![429, 500, 503].includes(res.status)) throw new Error(lastError);

      if (attempt < retriesPerModel) {
        await sleep(2000 * 2 ** (attempt - 1));
      }
    }
  }

  throw new Error(`Sab models fail ho gaye. Aakhri error: ${lastError}`);
}