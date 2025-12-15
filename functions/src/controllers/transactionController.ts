import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { parseTransactionWithGemini } from "../services/geminiService";
import {
  //   TransactionResponse,
  TransactionType,
} from "../services/transactionSchema";

interface FirestoreTransaction {
  amount: number;
  type: TransactionType;
  note: string;
  transaction_date: string;
  category_id: string;
  source_account_id: string | null;
  destination_account_id: string | null;
  user_id: string;
  created_at: FieldValue;
  updated_at: FieldValue;
  ai_category_name?: string;
  ai_account_name?: string;
}

export const analyzeTransactionText = onCall(async (request) => {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "User must be authenticated.");
  }

  const userId = "USER_DUMMY_123";
  const userText = request.data.text;

  if (!userText || typeof userText !== "string" || userText.length < 3) {
    throw new HttpsError(
      "invalid-argument",
      "Transaction text is invalid or too short."
    );
  }

  try {
    const aiResult = await parseTransactionWithGemini(userText);

    if (!aiResult.amount || aiResult.amount <= 0) {
      throw new HttpsError("data-loss", "Failed to detect transaction amount.");
    }

    const categoryId = await getCategoryIdByName(
      aiResult.category,
      userId,
      aiResult.type
    );
    const accountId = await getAccountIdByName(aiResult.account, userId);

    const db = admin.firestore();

    const transactionData: FirestoreTransaction = {
      amount: aiResult.amount,
      type: aiResult.type,
      note: aiResult.note,
      transaction_date: aiResult.date,
      user_id: userId,
      category_id: categoryId,
      source_account_id: aiResult.type === "expense" ? accountId : null,
      destination_account_id: aiResult.type === "income" ? accountId : null,
      created_at: FieldValue.serverTimestamp(),
      updated_at: FieldValue.serverTimestamp(),
      ai_category_name: aiResult.category,
      ai_account_name: aiResult.account || "Cash",
    };

    const docRef = await db.collection("transactions").add(transactionData);

    return {
      status: "success",
      message: "Transaction successfully recorded by AI.",
      data: {
        transactionId: docRef.id,
        ...aiResult,
      },
    };
  } catch (error) {
    console.error("Error analyzing transaction:", error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(
      "internal",
      "An error occurred while processing the transaction."
    );
  }
});

async function getCategoryIdByName(
  categoryName: string,
  userId: string,
  type: TransactionType
): Promise<string> {
  const db = admin.firestore();
  const categoriesRef = db.collection("transaction_categories");

  const snapshot = await categoriesRef
    .where("name", "==", categoryName)
    .where("type", "==", type)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const fallbackSnapshot = await categoriesRef
    .where("name", "in", ["Others", "Lainnya"])
    .where("type", "==", type)
    .limit(1)
    .get();

  if (!fallbackSnapshot.empty) {
    return fallbackSnapshot.docs[0].id;
  }

  const newCatRef = await categoriesRef.add({
    name: categoryName,
    type: type,
    is_default: false,
    user_id: userId,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return newCatRef.id;
}

async function getAccountIdByName(
  accountName: string | null,
  userId: string
): Promise<string | null> {
  const targetName = accountName || "Cash";
  const db = admin.firestore();
  const accountsRef = db.collection("accounts");

  const snapshot = await accountsRef
    .where("name", "==", targetName)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }

  const cashSnapshot = await accountsRef
    .where("name", "==", "Cash")
    .limit(1)
    .get();

  if (!cashSnapshot.empty) {
    return cashSnapshot.docs[0].id;
  }

  const newAccRef = await accountsRef.add({
    name: targetName,
    is_default: false,
    user_id: userId,
    created_at: FieldValue.serverTimestamp(),
    updated_at: FieldValue.serverTimestamp(),
  });

  return newAccRef.id;
}
