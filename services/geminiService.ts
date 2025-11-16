import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

const getAi = () => {
    if (!ai) {
        if (!process.env.API_KEY) {
            console.error("API_KEY environment variable not set.");
            return null;
        }
        ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return ai;
}

export const generateProductSuggestions = async (
    category: string,
    supplierContextCategories?: string[]
): Promise<string[]> => {
    const genAI = getAi();
    if (!genAI) {
        return [];
    }
    
    let prompt = `Suggest a list of 10 specific product names for the category '${category}' commonly sold in a retail shop in Myanmar.`;

    if (supplierContextCategories && supplierContextCategories.length > 0) {
        const contextString = supplierContextCategories.join(', ');
        prompt = `A supplier in Myanmar already provides products in these categories: [${contextString}]. Now they want to add products for a new category: '${category}'. Suggest 10 specific product names for this new category that would complement their existing product lines.`;
    }

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        products: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.STRING
                            }
                        }
                    }
                },
            },
        });

        const jsonString = response.text;
        const result = JSON.parse(jsonString);
        
        if (result && Array.isArray(result.products)) {
            return result.products;
        }
        
        return [];
    } catch (error) {
        console.error("Error generating product suggestions:", error);
        return [];
    }
};

export const generateProductIcon = async (productName: string): Promise<string> => {
    const genAI = getAi();
    if (!genAI || !productName.trim()) {
        return '📦';
    }

    const prompt = `Provide a single, relevant emoji that best represents the product: "${productName}". Return only the emoji character itself, with no additional text or explanation. For example, if the product is "Coca-Cola", you should return "🥤".`;

    try {
        const response = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        const text = response.text.trim();
        // Basic validation: emojis are usually short.
        if (text && text.length < 5) {
            return text;
        }
        return '📦'; // Fallback if response is not a single emoji
    } catch (error) {
        console.error("Error generating product icon:", error);
        return '📦'; // Fallback on API error
    }
};
