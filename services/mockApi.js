// import { analyzeWithN8N } from './n8nService';

// Fallback mock analysis if AI fails or for testing
const mockAnalyze = (product, userPreferences) => {
    // Simple logic: if vegan and product has milk -> NO
    const ingredients = (product.ingredients_text || "").toLowerCase();
    const { diets = [] } = userPreferences || {};

    let status = 'YES';
    let reason = 'Safe to consume based on your profile.';

    if (diets.includes('vegan')) {
        if (ingredients.includes('milk') || ingredients.includes('egg') || ingredients.includes('honey')) {
            status = 'NO';
            reason = 'Contains animal products (milk/egg/honey).';
        }
    }

    return {
        status,
        ingredient: product.ingredients_text || "Unknown Ingredients",
        reason,
        health_score: status === 'YES' ? 90 : (status === 'MODERATE' ? 50 : 20),
        harmful_ingredients: status === 'NO' ? "Contains allergens/unwanted ingredients" : "None"
    };
};

// Hardcoded mock for specific UPC
const MOCK_PRODUCT_UPC = "8886467124723";
const MOCK_PRODUCT_DATA = {
    productName: "Pringles Sour Cream and Onion",
    ingredient: "Corn, Vegetable Oil (Palm Oil), Sugar, High Fructose Corn Syrup, Salt, Artificial Flavor, Red 40, Yellow 5.",
    imageUri: "https://images.unsplash.com/photo-1621447591183-5f34ccf9cd9e?auto=format&fit=crop&w=800&q=80",
    nutritionImageUri: "https://images.unsplash.com/photo-1621447591183-5f34ccf9cd9e?auto=format&fit=crop&w=800&q=80",
    status: "NO",
    reason: "Contains multiple unhealthy additives.",
    health_score: 15,
    harmful_ingredients: "High Fructose Corn Syrup, Red 40, Yellow 5, Palm Oil"
};

export const lookupProduct = async (barcodeData, userPreferences) => {
    try {
        console.log(`Fetching data for barcode: ${barcodeData}`);

        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcodeData}.json`, {
            headers: {
                'User-Agent': 'FoodScannerApp/1.0 (expo-react-native) - Android'
            }
        });
        const data = await response.json();

        // 1. Immediate Mock Check (After fetch to try and get image)
        if (barcodeData === MOCK_PRODUCT_UPC) {
            console.log("Mock UPC detected. Returning hardcoded data (with real image if found).");

            let fetchedImage = MOCK_PRODUCT_DATA.imageUri;
            if (data.status === 1 && data.product) {
                fetchedImage = data.product.image_url || data.product.image_front_url || fetchedImage;
            }

            return {
                ...MOCK_PRODUCT_DATA,
                imageUri: fetchedImage,
                nutritionImageUri: fetchedImage,
                // Ensure ingredients are passed for chat context
                ingredient: MOCK_PRODUCT_DATA.ingredient
            };
        }

        if (data.status === 1) {
            const product = data.product;

            console.log("Product keys:", Object.keys(product).filter(k => k.includes('ingredient')));

            let ingredient = product.ingredients_text_en || product.ingredients_text;

            if (!ingredient && product.ingredients && Array.isArray(product.ingredients)) {
                console.log("Constructing ingredients from array...");
                ingredient = product.ingredients.map(i => i.text).join(", ");
            }

            if (!ingredient) {
                ingredient = "Ingredients not found";
            }

            const imageUri = product.image_url || product.image_front_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80";
            const nutritionImageUri = product.image_nutrition_url || product.image_nutrition_small_url || imageUri;
            const productName = product.product_name || "Unknown Product";

            // Fallback to local logic (No AI/n8n)
            console.log("Falling back to local logic.");
            const localResult = mockAnalyze(product, userPreferences);

            return {
                imageUri,
                productName,
                ingredient,
                nutritionImageUri,
                ...localResult
            };
        } else {
            console.log("Product not found in Open Food Facts");
            return null;
        }
    } catch (error) {
        console.error("API Lookup Error:", error);
        return null;
    }
};

export const analyzeImage = async (imageUri) => {
    // Placeholder for image-based analysis (OCR) if implemented later
    return {
        status: 'MODERATE',
        ingredient: 'Image Analysis Not Implemented',
        reason: 'This feature is coming soon.'
    };
};
