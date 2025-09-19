// src/lib/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// eslint-disable-next-line no-undef
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function summarizeWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent([
      { role: "user", parts: [`Summarize this:\n\n${text}`] },
    ]);
    const response = await result.response;
    return response.text();
  } catch (err) {
    console.error("Gemini API error:", err);
    throw err;
  }
}
