import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeStructure = async (hand: number[], waits: number[]): Promise<{ explanation: string; shapes: string[] }> => {
  if (hand.length === 0 || waits.length === 0) {
    return { explanation: "", shapes: [] };
  }

  const prompt = `
    You are a Mahjong Logic Expert.
    The user has a hand of Pinzu (Dots) tiles: [${hand.sort((a, b) => a - b).join(', ')}].
    The algorithmic solver has determined the waiting tiles are: [${waits.join(', ')}].

    Your task:
    1. Explain *why* these are the waits by decomposing the complex shape into standard shapes (e.g., Ryarmen, Kanchan, Penchan, Shankpon, Tanki, Nobetan, Sanmenchan, Ryarmen-Kanchan, Iipeiko-shape).
    2. Be concise and logical. Do not use flowery language. Focus on the combinatorial logic.
    3. Return a JSON object.

    Example Logic for "1112345678999":
    "Nine Gates (Chuuren Poutou). The 111 and 999 triplets allow the 2-8 sequence to bond with any tile 1-9 to form pairs or sequences."
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: {
              type: Type.STRING,
              description: "A concise logical explanation of the multi-wait pattern (max 2 sentences).",
            },
            shapes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of identified shapes (e.g., 'Nobetan (2-5)', 'Ryarmen (4-7)').",
            },
          },
          required: ["explanation", "shapes"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      explanation: "Unable to analyze complex shape connectivity at this moment.",
      shapes: ["Complex Poly-Wait"]
    };
  }
};