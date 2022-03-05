export interface MLResult {
    foodName: string;
    foodNutrition: FoodNutrition;
    confidence: number;
    version: string;
}

export interface FoodNutrition {
    carbohydrate: number;
    fat: number;
    protein: number;
}
