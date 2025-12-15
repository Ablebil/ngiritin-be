import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  TransactionResponse,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from "./transactionSchema";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is not configured! Please set the environment variable."
  );
}

const genAI = new GoogleGenerativeAI(API_KEY);

export const parseTransactionWithGemini = async (
  userText: string
): Promise<TransactionResponse> => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" },
    });

    const currentDate = new Date().toISOString();

    const categoriesStr = DEFAULT_CATEGORIES.join(", ");
    const accountsStr = DEFAULT_ACCOUNTS.join(", ");

    const prompt = `
        You are a Financial Assistant whose job is to extract structured transaction details from a free-text Indonesian user input and return a strictly valid JSON.

        User Input:
        "${userText}"

        Server Time (Current):
        ${currentDate}

        Valid Categories:
        [${categoriesStr}]

        Valid Accounts:
        [${accountsStr}]

        --- EXTRACTION RULES ---

        1. amount (number)
        - Detect monetary value even if the user does NOT write "Rp" or "IDR".
        - Understand Indonesian numeric formats:
            • 15rb, 15 ribu, 15ribu, 15k, 15K → 15000
            • 1jt, 1 juta, 1juta, 1m → 1000000
            • 1.500, 1,500, 1500 → 1500
            • Rp 15.000, rp15000 → 15000
        - If multiple numbers exist, pick the main monetary amount.
        - If no number is found, set "amount" = 0.

        2. category (string)
        - Select the most relevant category from the provided list.
        - If uncertain, choose "Others".

        3. account (string)
        - If the user mentions a wallet/bank (e.g., gopay, ovo, bca, cash), use it.
        - If not mentioned, default to "Cash".

        4. type (string)
        - "expense" if money goes out (buy, pay, top up, etc.).
        - "income" if money comes in (salary, transfer in, bonus, etc.).

        5. note (string)
        - Create a short summary in Title Case.
        - Do not include numbers in the note.

        6. date (string)
        - Output must always be ISO 8601 format.
        - If the text contains relative time (e.g., "kemarin", "besok", "lusa"), adjust based on the server time.
        - If no time mentioned, use the server time.

        --- STRICT OUTPUT FORMAT ---
        Return ONLY a JSON object. No markdown. No comments. No surrounding text.

        {
        "amount": number,
        "category": "string",
        "account": "string",
        "type": "expense" | "income",
        "note": "string",
        "date": "string"
        }

        If unsure, still return a valid JSON object following the structure above.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleanedText) as TransactionResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw new Error(
      "Failed to process the transaction. Please provide clearer input."
    );
  }
};
