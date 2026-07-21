import Groq from 'groq-sdk';

export const ai = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq occasionally updates available model names — if generation starts failing,
// check https://console.groq.com/docs/models for the current model name.
export const GROQ_MODEL = 'llama-3.3-70b-versatile';
