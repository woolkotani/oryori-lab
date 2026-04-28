export interface SampleDish {
  name: string;
  emoji: string;
  imageQuery: string;
  keyIngredients: string[];
  reason: string;
  season: "春" | "夏" | "秋" | "冬" | "通年";
}

export const SAMPLE_DISHES: SampleDish[] = [
  // 春
  { name: "春キャベツのパスタ", emoji: "🍝", imageQuery: "cabbage,pasta", keyIngredients: ["春キャベツ", "ベーコン", "にんにく"], reason: "春キャベツの甘みが引き立つ一品", season: "春" },
  { name: "たけのこご飯", emoji: "🍚", imageQuery: "bamboo,rice,japanese", keyIngredients: ["たけのこ", "油揚げ", "米"], reason: "春の香りを楽しむ炊き込みご飯", season: "春" },
  { name: "新玉ねぎのサラダ", emoji: "🥗", imageQuery: "onion,salad", keyIngredients: ["新玉ねぎ", "かつお節", "ポン酢"], reason: "辛味が少なくみずみずしい新玉ねぎを生で", season: "春" },
  { name: "あさりの酒蒸し", emoji: "🦪", imageQuery: "clam,sake", keyIngredients: ["あさり", "酒", "バター"], reason: "旬のあさりを最もシンプルに味わう", season: "春" },
  { name: "菜の花のおひたし", emoji: "🥬", imageQuery: "rapeseed,greens", keyIngredients: ["菜の花", "醤油", "鰹節"], reason: "ほろ苦さで春を感じる副菜", season: "春" },

  // 夏
  { name: "冷やし中華", emoji: "🍜", imageQuery: "cold,ramen,chinese", keyIngredients: ["中華麺", "きゅうり", "ハム", "卵"], reason: "暑い日にさっぱり食べたい定番", season: "夏" },
  { name: "夏野菜カレー", emoji: "🍛", imageQuery: "summer,vegetable,curry", keyIngredients: ["なす", "ピーマン", "トマト", "ズッキーニ"], reason: "色鮮やかな夏野菜をたっぷり使う", season: "夏" },
  { name: "ガスパチョ", emoji: "🍅", imageQuery: "gazpacho,tomato,soup", keyIngredients: ["完熟トマト", "きゅうり", "オリーブオイル"], reason: "冷たい一皿で夏バテ予防", season: "夏" },
  { name: "そうめん", emoji: "🍜", imageQuery: "somen,japanese,noodle", keyIngredients: ["そうめん", "めんつゆ", "薬味"], reason: "食欲がない日でもツルッと", season: "夏" },
  { name: "焼きとうもろこし", emoji: "🌽", imageQuery: "grilled,corn", keyIngredients: ["とうもろこし", "醤油", "バター"], reason: "甘い旬のとうもろこしを香ばしく", season: "夏" },

  // 秋
  { name: "さんまの塩焼き", emoji: "🐟", imageQuery: "saury,grilled,fish", keyIngredients: ["さんま", "塩", "大根おろし"], reason: "脂ののった旬のさんまを塩だけで", season: "秋" },
  { name: "きのこの炊き込みご飯", emoji: "🍄", imageQuery: "mushroom,rice,japanese", keyIngredients: ["しめじ", "しいたけ", "舞茸", "米"], reason: "数種のきのこの旨みを米に閉じ込める", season: "秋" },
  { name: "かぼちゃの煮物", emoji: "🎃", imageQuery: "pumpkin,simmered", keyIngredients: ["かぼちゃ", "醤油", "みりん"], reason: "ほっこり甘い秋の味覚", season: "秋" },
  { name: "さつまいもご飯", emoji: "🍠", imageQuery: "sweet,potato,rice", keyIngredients: ["さつまいも", "米", "塩"], reason: "ほのかな甘みでご飯がすすむ", season: "秋" },
  { name: "栗の渋皮煮", emoji: "🌰", imageQuery: "chestnut,sweet", keyIngredients: ["栗", "砂糖", "醤油"], reason: "手間をかけて秋を堪能するデザート", season: "秋" },

  // 冬
  { name: "おでん", emoji: "🍢", imageQuery: "oden,japanese", keyIngredients: ["大根", "卵", "こんにゃく", "練り物"], reason: "体の芯から温まる冬の定番", season: "冬" },
  { name: "ぶり大根", emoji: "🐟", imageQuery: "yellowtail,radish", keyIngredients: ["ぶり", "大根", "生姜"], reason: "脂ののったぶりと冬の大根の組み合わせ", season: "冬" },
  { name: "白菜と豚の鍋", emoji: "🍲", imageQuery: "hotpot,napa,cabbage", keyIngredients: ["白菜", "豚バラ", "昆布"], reason: "シンプルだけど深い味わいの鍋", season: "冬" },
  { name: "牡蠣フライ", emoji: "🦪", imageQuery: "fried,oyster", keyIngredients: ["牡蠣", "パン粉", "卵"], reason: "ジューシーな旬の牡蠣をサクッと", season: "冬" },
  { name: "ほうれん草のおひたし", emoji: "🥬", imageQuery: "spinach,japanese", keyIngredients: ["ほうれん草", "醤油", "鰹節"], reason: "冬のほうれん草は甘くて栄養満点", season: "冬" },

  // 通年
  { name: "親子丼", emoji: "🍚", imageQuery: "oyakodon,chicken,egg", keyIngredients: ["鶏肉", "卵", "玉ねぎ"], reason: "家にある材料でササッと作れる定番", season: "通年" },
  { name: "肉じゃが", emoji: "🥘", imageQuery: "nikujaga,beef,potato", keyIngredients: ["牛肉", "じゃがいも", "玉ねぎ"], reason: "ほっとする家庭の味", season: "通年" },
  { name: "豚の生姜焼き", emoji: "🍖", imageQuery: "ginger,pork", keyIngredients: ["豚ロース", "生姜", "玉ねぎ"], reason: "ご飯がすすむ間違いない一品", season: "通年" },
  { name: "鶏の唐揚げ", emoji: "🍗", imageQuery: "karaage,fried,chicken", keyIngredients: ["鶏もも", "醤油", "にんにく"], reason: "みんな大好き、お弁当にも", season: "通年" },
  { name: "餃子", emoji: "🥟", imageQuery: "gyoza,dumpling", keyIngredients: ["豚ひき肉", "キャベツ", "ニラ"], reason: "包む楽しさも味わえる人気メニュー", season: "通年" },
  { name: "オムライス", emoji: "🍳", imageQuery: "omurice,omelette", keyIngredients: ["卵", "鶏肉", "玉ねぎ", "ケチャップ"], reason: "ふわとろ卵が幸せな洋食", season: "通年" },
  { name: "麻婆豆腐", emoji: "🌶️", imageQuery: "mapo,tofu", keyIngredients: ["豆腐", "豚ひき肉", "豆板醤"], reason: "ピリ辛で食欲をそそる中華", season: "通年" },
  { name: "ハンバーグ", emoji: "🍔", imageQuery: "hamburg,steak,japanese", keyIngredients: ["合いびき肉", "玉ねぎ", "パン粉"], reason: "子供から大人まで愛される一皿", season: "通年" },
];

export function getCurrentSeason(): "春" | "夏" | "秋" | "冬" {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "春";
  if (m >= 6 && m <= 8) return "夏";
  if (m >= 9 && m <= 11) return "秋";
  return "冬";
}

export function pickRandomDishes(
  count: number,
  ingredients: string[] = []
): SampleDish[] {
  const season = getCurrentSeason();

  // Score each dish
  const scored = SAMPLE_DISHES.map((dish) => {
    let score = Math.random(); // base randomness
    if (dish.season === season) score += 1.5;
    if (dish.season === "通年") score += 0.5;

    // Bonus if ingredients match
    if (ingredients.length > 0) {
      const matchCount = dish.keyIngredients.filter((ing) =>
        ingredients.some(
          (input) => ing.includes(input) || input.includes(ing)
        )
      ).length;
      score += matchCount * 2;
    }

    return { dish, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.dish);
}
