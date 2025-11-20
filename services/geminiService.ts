import { GoogleGenAI, Type } from "@google/genai";
import { ReceiptData, ReceiptItem, AnalysisResult } from "../types";

// Initialize the client
// Note: API_KEY is injected via process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

export const parseReceiptImage = async (base64Image: string, mimeType: string): Promise<ReceiptData> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: `Analyze this receipt image. Extract all line items, their prices, and quantities. 
            Also extract the total tax and total tip amount if visible (or suggest 0 if not found).
            Return a valid JSON object strictly matching the schema provided. 
            Generate a unique ID for each item.
            Convert all prices to numbers.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  quantity: { type: Type.NUMBER },
                },
                required: ["id", "name", "price", "quantity"],
              },
            },
            tax: { type: Type.NUMBER },
            tip: { type: Type.NUMBER },
            currency: { type: Type.STRING },
          },
          required: ["items", "tax", "tip"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const data = JSON.parse(text);
    // Initialize assignedTo as empty array for each item
    const itemsWithAssignments = data.items.map((item: any) => ({
      ...item,
      assignedTo: [],
    }));

    return {
      items: itemsWithAssignments,
      tax: data.tax || 0,
      tip: data.tip || 0,
      currency: data.currency || "$",
    };
  } catch (error) {
    console.error("Error parsing receipt:", error);
    throw error;
  }
};

export const processChatCommand = async (
  currentItems: ReceiptItem[], 
  userMessage: string
): Promise<AnalysisResult> => {
  try {
    // Simplify items for context to save tokens and reduce noise
    const simplifiedItems = currentItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      currentAssignees: item.assignedTo
    }));

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `
      You are a helpful bill splitting assistant.
      
      Current Receipt Items State:
      ${JSON.stringify(simplifiedItems, null, 2)}

      User Message: "${userMessage}"

      Instructions:
      1. Interpret the user's message to assign items to people.
      2. Return a JSON object with a 'reply' (conversational confirmation) and 'modifications'.
      3. 'modifications' is an array of objects containing 'itemId' and 'assignees'.
      4. The 'assignees' array in the modification should be the *complete new list* of people for that item.
      5. If the user says "Tom and Jerry shared the burger", and the burger ID is "123", return assignees: ["Tom", "Jerry"].
      6. If the user says "Add Sarah to the salad", and the salad currently has ["Mike"], return assignees: ["Mike", "Sarah"].
      7. If the user says "Actually, Tom didn't have the soda", remove Tom from the list.
      8. Match items fuzzily by name if needed (e.g. "fries" matches "French Fries").
      9. If the message is just general chat (e.g. "Hi", "Thanks"), return empty modifications.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modifications: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  itemId: { type: Type.STRING },
                  assignees: { 
                    type: Type.ARRAY,
                    items: { type: Type.STRING } 
                  },
                },
                required: ["itemId", "assignees"],
              },
            },
            reply: { type: Type.STRING },
          },
          required: ["modifications", "reply"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as AnalysisResult;

  } catch (error) {
    console.error("Error processing chat command:", error);
    return {
      modifications: [],
      reply: "Sorry, I had trouble understanding that request. Could you try again?",
    };
  }
};