import { GoogleGenerativeAI, FunctionDeclaration } from "@google/generative-ai";
import { config } from "../config";

// 特定バージョン名だと将来廃止される恐れがあるため、常に現行のFlashモデルを指すエイリアスを使う
export const MODEL_NAME = "gemini-flash-latest";

const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

export function getModel(tools: FunctionDeclaration[], systemInstruction: string) {
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    tools: [{ functionDeclarations: tools }],
    systemInstruction,
  });
}
