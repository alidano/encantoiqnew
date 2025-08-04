
'use server';
/**
 * @fileOverview AI flow for generating product recommendations based on purchase history.
 *
 * - getProductRecommendationsFlow - Generates product recommendations.
 * - ProductRecommendationInput - The input type for the flow.
 * - ProductRecommendationOutput - The return type for the flow.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Product, AIProductSuggestion } from '@/types';

// Define Zod schema for a single product in the purchase history
const PurchaseHistoryProductSchema = z.object({
  name: z.string().describe('The name of the purchased product.'),
  price: z.number().describe('The price of the purchased product.'),
  // We don't need imageUrl or id for the AI prompt itself.
});

const ProductRecommendationInputSchema = z.object({
  purchaseHistory: z.array(PurchaseHistoryProductSchema).describe('A list of products the patient has previously purchased.'),
  // You could add other patient preferences here in the future, e.g., preferred_consumption_method, desired_effects
});
export type ProductRecommendationInput = z.infer<typeof ProductRecommendationInputSchema>;

const AIProductSuggestionSchema = z.object({
  productName: z.string().describe('The name of the recommended product.'),
  rationale: z.string().describe('A brief explanation for why this product is recommended.'),
});

const ProductRecommendationOutputSchema = z.object({
  recommendations: z.array(AIProductSuggestionSchema).describe('A list of 3-5 product recommendations.'),
});
export type ProductRecommendationOutput = z.infer<typeof ProductRecommendationOutputSchema>;


export async function generateProductSuggestions(input: ProductRecommendationInput): Promise<ProductRecommendationOutput> {
  // Directly call the flow
  const result = await productRecommendationFlow(input);
  return result;
}

const recommendationPrompt = ai.definePrompt({
  name: 'productRecommendationPrompt',
  input: { schema: ProductRecommendationInputSchema },
  output: { schema: ProductRecommendationOutputSchema },
  prompt: `You are an expert budtender and product recommendation AI for Encanto Tree Dispensary.
A patient has the following purchase history:
{{#if purchaseHistory.length}}
{{#each purchaseHistory}}
- {{this.name}} (Price: \${{this.price}})
{{/each}}
{{else}}
The patient has no purchase history available.
{{/if}}

Based on this purchase history (if available), or general popularity if not, please suggest 3 distinct products this patient might enjoy for their next visit.
For each suggestion, provide the product name and a brief, friendly rationale (1-2 sentences) explaining why it's a good fit or why they might like it.
Do not suggest products already present in their purchase history.
Ensure your response is in the specified JSON format.
Focus on variety if the purchase history is diverse, or on similar items if the history shows a clear preference.
If no purchase history, suggest popular or generally well-liked items across different categories (e.g., a flower, an edible, a vape).
`,
});

const productRecommendationFlow = ai.defineFlow(
  {
    name: 'productRecommendationFlow',
    inputSchema: ProductRecommendationInputSchema,
    outputSchema: ProductRecommendationOutputSchema,
  },
  async (input) => {
    const { output } = await recommendationPrompt(input);

    if (!output) {
        // Fallback or error handling if the model doesn't return the expected output
        console.error("AI product recommendation flow did not return an output.");
        return { recommendations: [] };
    }
    // Ensure that if output.recommendations is null/undefined, we return an empty array.
    return { recommendations: output.recommendations || [] };
  }
);
