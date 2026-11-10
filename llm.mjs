import "dotenv/config";

const API_KEY = process.env.GEMINI_API_KEY;

// Is order mein models try honge. Chaho to .env mein GEMINI_MODELS=a,b,c likh kar badal sakte ho
const MODELS = (
  process.env.GEMINI_MODELS ||
  "gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.5-flash,gemini-3.7-flash,gemini-3.8-flash"
)
  .split(",")
  .map((m) => m.trim());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function askLLM(userPrompt, systemPrompt = "", retriesPerModel = 2) {
  if (!API_KEY) throw new Error("GEMINI_API_KEY nahi mili (.env check karo)");

  const body = {
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
  };
  if (systemPrompt) {
    body.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

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

      if (res.ok) {
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error("AI ne koi text wapis nahi diya");
        console.log(`✅ Model: ${model}`);
        return text;
      }

      lastError = `API error ${res.status} (${model}): ${data.error?.message}`;

      // 404: yeh model hi available nahi, seedha agle par jao
      if (res.status === 404) {
        console.log(`⚠️ ${model} available nahi, agla model try kar raha hoon`);
        break;
      }

      // Sirf server busy / limit wale errors par aage barho
      const retryable = [429, 500, 503].includes(res.status);
      if (!retryable) throw new Error(lastError); // 400, 403 waghera: aap ki side ka masla

      if (attempt < retriesPerModel) {
        const waitMs = 2000 * 2 ** (attempt - 1);
        console.log(`⏳ ${model}: error ${res.status}, ${waitMs / 1000}s baad dobara`);
        await sleep(waitMs);
      } else {
        console.log(`🔁 ${model} busy hai, agle model par ja raha hoon`);
      }
    }
  }

  throw new Error(`Sab models fail ho gaye. Aakhri error: ${lastError}`);
}