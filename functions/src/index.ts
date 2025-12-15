import * as admin from "firebase-admin";
import { analyzeTransactionText } from "./controllers/transactionController";

admin.initializeApp();

export { analyzeTransactionText };
