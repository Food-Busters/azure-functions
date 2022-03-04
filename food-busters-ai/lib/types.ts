export interface MLResult {
    foodName: string;
    foodNutrition: FoodNutrition;
    score: number;
    version: string;
}

export interface FoodNutrition {
    carbohydrate: number;
    fat: number;
    protein: number;
}
