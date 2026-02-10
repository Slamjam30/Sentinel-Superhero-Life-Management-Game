
import { GoogleGenAI } from "@google/genai";

export const getClient = () => {
  // Check for manually entered key in Settings
  const localKey = localStorage.getItem('sentinel_custom_api_key');
  if (localKey) {
    return new GoogleGenAI({ apiKey: localKey });
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API Key not found in process.env or localStorage");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};
