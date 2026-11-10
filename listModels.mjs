import "dotenv/config";

const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
  headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
});
const data = await res.json();

if (!res.ok) {
  console.error("❌", data.error?.message);
  process.exit(1);
}

for (const m of data.models) {
  if (m.supportedGenerationMethods?.includes("generateContent")) {
    console.log(m.name.replace("models/", ""));
  }
}