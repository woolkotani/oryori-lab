export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  cost: number;
}

export interface DishWithRecipe {
  id: string;
  name: string;
  photo: string | null;
  memo: string | null;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  recipe: RecipeData | null;
}

export interface RecipeData {
  id: string;
  dishId: string;
  ingredients: Ingredient[];
  steps: string;
  estimatedCost: number;
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface DailyLogWithDish {
  id: string;
  date: Date;
  dishId: string;
  dish: DishWithRecipe;
  note: string | null;
}

export interface NutritionDay {
  date: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface StreakInfo {
  current: number;
  longest: number;
  lastLogDate: string | null;
}

export interface MonthlySummary {
  totalCookedDays: number;
  totalHomeCost: number;
  estimatedEatingOutCost: number;
  savedAmount: number;
  mostCookedDish: string | null;
  avgCalories: number;
}
