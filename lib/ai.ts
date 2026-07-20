import { GoogleGenAI } from '@google/genai';

export const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Update this when Google retires the current model generation.
export const GEMINI_MODEL = 'gemini-3.5-flash';
