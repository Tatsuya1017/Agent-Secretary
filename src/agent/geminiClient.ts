import { GoogleGenerativeAI, FunctionDeclaration } from "@google/generative-ai";
import { config } from "../config";

export const MODEL_NAME = "gemini-2.5-flash";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export function getModel(tools: FunctionDeclaration[], systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: [{ functionDeclarations: tools }],
    systemInstruction,
  });
}
