import { GoogleGenAI, FunctionDeclaration, Content } from "@google/genai";
import { config } from "../config";

// 特定バージョン名だと将来廃止される恐れがあるため、常に現行のFlashモデルを指すエイリアスを使う
export const MODEL_NAME = "gemini-flash-latest";

const genAI = new GoogleGenAI({ apiKey: config.gemini.apiKey });

export function createChat(tools: FunctionDeclaration[], systemInstruction: string, history: Content[]) {
  return genAI.chats.create({
    model: MODEL_NAME,
    history,
    config: {
      tools: [{ functionDeclarations: tools }],
      systemInstruction,
    },
  });
}
