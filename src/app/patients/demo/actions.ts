
'use server';

import { generateProductSuggestions } from '@/ai/flows/product-recommendation-flow';
import type { Product, AIProductSuggestion, PurchaseRecord } from '@/types';

// Helper to prepare purchase history for the AI flow
// The AI flow expects { name: string, price: number }
const formatPurchaseHistoryForAI = (purchaseHistory: PurchaseRecord[]) => {
  return purchaseHistory.map(item => ({ name: item.name, price: item.price }));
};

export async function getAIProductRecommendationsAction(
  purchaseHistory: PurchaseRecord[]
): Promise<AIProductSuggestion[]> {
  try {
    const formattedHistory = formatPurchaseHistoryForAI(purchaseHistory);
    const result = await generateProductSuggestions({ purchaseHistory: formattedHistory });
    return result.recommendations;
  } catch (error) {
    console.error('Error getting AI product recommendations:', error);
    // Return an empty array or throw a custom error to be handled by the client
    return [];
  }
}
