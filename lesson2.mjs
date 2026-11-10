import { askJSON } from "./llm.mjs";

const resumeText = `
Jamee Raza. Software Engineering student.
Skills: Node.js, Express, MongoDB, React Native, JWT, Git.
Experience: Front-End Developer at 360 Expert Solution (2025).
`;

const system = `Tum ek resume analyzer ho. Sirf valid JSON wapis do, is shakal mein:
{
  "name": string,
  "skills": string[],
  "level": "beginner" | "intermediate" | "advanced",
  "suggested_jobs": string[]
}`;

try {
  const result = await askJSON(resumeText, system);
  console.log("Pura object:", result);
  console.log("Naam:", result.name);
  console.log("Pehli skill:", result.skills[0]);
  console.log("Skills ki tadaad:", result.skills.length);
} catch (err) {
  console.error("❌", err.message);
}