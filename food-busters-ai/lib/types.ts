export interface MLResult {
    foodName: Label;
    foodNutrition: FoodNutrition;
    confidence: number;
    version: string;
}

export interface Label {
    en: string;
    th?: string;
}

export interface FoodNutrition {
    carbohydrate: number;
    fat: number;
    protein: number;
    pollution: number;
}
