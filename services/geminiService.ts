import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  sources?: { uri: string; title: string }[];
}

export const getGeminiResponse = async (userPrompt: string, history: ChatMessage[]): Promise<ChatMessage> => {
  if (!apiKey) {
    return {
      role: 'model',
      text: "TACTICAL ERROR: API_KEY_MISSING. Cannot access satellite intel."
    };
  }

  try {
    const model = 'gemini-2.5-flash';
    
    const response = await ai.models.generateContent({
      model,
      contents: userPrompt,
      config: {
        systemInstruction: "You are the tactical AI for Value WanderWeavers (VWW), a sub-brand of Palate Pilgrim. Your mission is to assist operatives (travelers) with mission intel (travel details) for destinations like Goa, Himachal, Rajasthan, Kerala, etc. You MUST use Google Search to verify current weather, events, or specific details. Keep responses concise, tactical, and cyberpunk-themed (e.g., 'Intel acquired', 'Sector clear'). Address the user as 'Operative'.",
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "Signal interrupted. No textual data received.";
    
    // Extract grounding chunks if available
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .map((chunk: any) => chunk.web ? { uri: chunk.web.uri, title: chunk.web.title } : null)
      .filter((s: any) => s !== null) as { uri: string; title: string }[];

    // Remove duplicates
    const uniqueSources = sources.filter((v, i, a) => a.findIndex(t => (t.uri === v.uri)) === i);

    return {
      role: 'model',
      text,
      sources: uniqueSources.length > 0 ? uniqueSources : undefined
    };

  } catch (error) {
    console.error("Gemini uplink failed:", error);
    return {
      role: 'model',
      text: "CONNECTION FAILURE. Satellite uplink blocked. Retry mission."
    };
  }
};