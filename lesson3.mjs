import { generateRaw } from "./gemini.mjs";

const toolFunctions = {
  getCurrentTime: () => {
    return {
      time: new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" }),
    };
  },

  calculate: ({ a, b, operation }) => {
    if (operation === "add") return { result: a + b };
    if (operation === "subtract") return { result: a - b };
    if (operation === "multiply") return { result: a * b };
    if (operation === "divide") {
      if (b === 0) return { error: "Zero se divide nahi ho sakta" };
      return { result: a / b };
    }
    return { error: "Unknown operation" };
  },

  // Nakli data hai, sirf practice ke liye
  getWeather: ({ city }) => {
    const fakeData = {
      karachi: { temp: 32, condition: "dhoop" },
      lahore: { temp: 27, condition: "dhund" },
      islamabad: { temp: 22, condition: "badal" },
    };
    return fakeData[city.toLowerCase()] || { error: `${city} ka data nahi mila` };
  },
};

const tools = [
  {
    functionDeclarations: [
      {
        name: "getCurrentTime",
        description: "Karachi (Pakistan) ka maujooda waqt aur tarikh batata hai",
        parameters: { type: "object", properties: {} },
      },
      {
        name: "calculate",
        description: "Do numbers par add, subtract, multiply ya divide karta hai",
        parameters: {
          type: "object",
          properties: {
            a: { type: "number", description: "Pehla number" },
            b: { type: "number", description: "Doosra number" },
            operation: {
              type: "string",
              enum: ["add", "subtract", "multiply", "divide"],
              description: "Kaun sa hisaab karna hai",
            },
          },
          required: ["a", "b", "operation"],
        },
      },
      {
        name: "getWeather",
        description: "Kisi shehar ka mausam batata hai",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string", description: "Shehar ka naam, jaise Karachi" },
          },
          required: ["city"],
        },
      },
    ],
  },
];

// ---------- 3. Agent loop ----------
async function runAgent(question) {
  const contents = [{ role: "user", parts: [{ text: question }] }];

  const systemInstruction = {
    parts: [
      {
        text: "Tum ek madadgar assistant ho. Zaroorat ho to tools use karo. Jawab Roman Urdu mein do.",
      },
    ],
  };

  for (let step = 1; step <= 5; step++) {
    const data = await generateRaw({ systemInstruction, contents, tools });

    const modelContent = data.candidates?.[0]?.content;
    if (!modelContent) throw new Error("AI ne koi jawab nahi diya");

    // AI ka jawab history mein jyon ka tyon rakho
    contents.push(modelContent);

    const parts = modelContent.parts ?? [];
    const calls = parts.filter((p) => p.functionCall);

    // Koi tool nahi manga = AI ka final jawab tayyar hai
    if (calls.length === 0) {
      return parts.map((p) => p.text ?? "").join("");
    }

    // Har tool chalao
    const responseParts = [];
    for (const { functionCall } of calls) {
      console.log(` Step ${step}: AI ne ${functionCall.name} manga`, functionCall.args);

      const fn = toolFunctions[functionCall.name];
      let result;
      try {
        result = fn ? await fn(functionCall.args ?? {}) : { error: "Aisa tool maujood nahi" };
      } catch (err) {
        result = { error: err.message };
      }

      console.log("    Nateeja:", result);

      responseParts.push({
        functionResponse: { name: functionCall.name, response: { result } },
      });
    }

    contents.push({ role: "user", parts: responseParts });
  }

  return "Bohat zyada steps ho gaye, ruk gaya.";
}

try {
  const answer = await runAgent("Abhi Karachi mein kitne baje hain aur wahan mausam kaisa hai?");
  console.log("\n✅ Final jawab:\n" + answer);
} catch (err) {
  console.error("❌", err.message);
}