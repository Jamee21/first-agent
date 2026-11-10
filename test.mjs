import { askLLM } from "./llm.mjs";

try {
  const answer = await askLLM(
    "JWT kya hota hai? Aasan misaal se samjhao.",
    "Tum ek dostana teacher ho. Sirf Roman Urdu mein jawab do. Jawab chhota rakho."
  );
  console.log("✅ AI ka jawab:\n");
  console.log(answer);
} catch (err) {
  console.error("❌", err.message);
}