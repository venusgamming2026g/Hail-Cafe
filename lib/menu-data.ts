export type MenuCategory = {
  id: string;
  nameAr: string;
  nameEn: string;
  order: number;
};

export type MenuItem = {
  id: string;
  categoryId: string;
  nameAr: string;
  nameEn?: string;
  priceMils: number;
  image?: string;
  noteAr?: string;
  noteEn?: string;
  sourceAmbiguous?: boolean;
  available: boolean;
  featured?: boolean;
};

const category = (
  id: string,
  nameAr: string,
  nameEn: string,
  order: number,
): MenuCategory => ({ id, nameAr, nameEn, order });

const item = (
  id: string,
  categoryId: string,
  nameAr: string,
  priceMils: number,
  extra: Partial<MenuItem> = {},
): MenuItem => ({
  id,
  categoryId,
  nameAr,
  priceMils,
  available: true,
  ...extra,
});

export const menuCategories: MenuCategory[] = [
  category("breakfast", "الفطور", "Breakfast", 1),
  category("salads", "السلطات", "Salads", 2),
  category("cold-appetizers", "المقبلات الباردة", "Cold appetizers", 3),
  category("hot-appetizers", "المقبلات الساخنة", "Hot appetizers", 4),
  category("pasta", "الباستا", "Pasta", 5),
  category("pasta-addons", "إضافات الباستا", "Pasta add-ons", 6),
  category("pizza", "البيتزا", "Pizza", 7),
  category("sandwiches", "الساندوش", "Sandwiches", 8),
  category("burgers", "البرغر", "Burgers", 9),
  category("fatta", "الفتة", "Fatta", 10),
  category("soups", "الشوربات", "Soups", 11),
  category("mains", "الأطباق الرئيسية", "Main dishes", 12),
  category("juices", "العصائر", "Juices", 13),
  category("smoothies", "السموثي", "Smoothies", 14),
  category("milkshakes", "الميلك شيك", "Milkshakes", 15),
  category("mojito", "الموهيتو", "Mojito", 16),
  category("iced-coffee", "القهوة الباردة", "Iced coffee", 17),
  category("frappe", "الفرابيه", "Frappe", 18),
  category("iced-tea", "الشاي المثلج", "Iced tea", 19),
  category("cocktails", "الكوكتيل", "Cocktails", 20),
  category("hot-drinks", "المشروبات الساخنة", "Hot drinks", 21),
  category("special-coffee", "القهوة المختصة", "Special coffee", 22),
  category("herbs", "الأعشاب", "Herbs", 23),
  category("sweets", "الحلويات", "Sweets", 24),
  category("hookah", "المعسل", "Hookah", 25),
  category("soft-drinks", "المشروبات الغازية والمياه", "Soft drinks & water", 26),
];

export const menuItems: MenuItem[] = [
  item("breakfast-foul", "breakfast", "فول", 2000, {
    nameEn: "Foul",
    image: "/menu/foul.webp",
    featured: true,
  }),
  item("breakfast-tomato", "breakfast", "قلّاية بندورة", 2500),
  item("breakfast-hummus", "breakfast", "حمص", 2000),
  item("breakfast-labneh-zaatar", "breakfast", "لبنة مع زعتر وفرافيش", 2750, {
    image: "/menu/labneh-zaatar.webp",
  }),
  item("breakfast-fattet-hummus", "breakfast", "فتة حمص", 2250),
  item("breakfast-halloumi", "breakfast", "حلّوم", 2950),
  item("breakfast-omelette", "breakfast", "أومليت", 2750, {
    nameEn: "Omelette",
    image: "/menu/omelette.webp",
  }),
  item("breakfast-fried-eggs", "breakfast", "بيض عيون", 2000),
  item("breakfast-falafel-taco", "breakfast", "تاكو فلافل", 2750),
  item("breakfast-shakshuka", "breakfast", "شكشوكة خاصة", 2250),
  item("breakfast-potatoes", "breakfast", "بطاطا", 2000),
  item("breakfast-turkey-quiche", "breakfast", "كيش تيركي", 3000),
  item("breakfast-sausage-eggs", "breakfast", "صوصج مع البيض", 3100),
  item("breakfast-roast-beef-kashkawan", "breakfast", "روست بيف مع كشكوان", 2900),
  item("breakfast-falafel-veg", "breakfast", "فلافل مع الخضار", 2250),
  item("breakfast-turkey-cheddar", "breakfast", "تيركي مع شدر", 2900),
  item("breakfast-labneh", "breakfast", "لبنة", 2250),
  item("breakfast-cheese-mix", "breakfast", "مكس أجبان", 2750),
  item("breakfast-muhammara-cheese", "breakfast", "محمرة مع مكس أجبان", 2750),
  item("breakfast-halloumi-rocket", "breakfast", "حلّوم مع الجرجير", 2750),
  item("breakfast-oil-zaatar", "breakfast", "زيت وزعتر", 2000),
  item("breakfast-lotus-nutella", "breakfast", "لوتس ونوتيلا", 3250),

  item("salad-fattoush-hail", "salads", "فتوش بخلطة الشيف", 4000),
  item("salad-tabbouleh", "salads", "تبولة فاخرة", 4500),
  item("salad-greek", "salads", "يونانية سلط", 3950),
  item("salad-hail", "salads", "سلطة الشيف الخاصة", 4750, {
    nameEn: "Special Chef Salad",
    image: "/menu/hail-salad.webp",
    featured: true,
  }),
  item("salad-shanklish", "salads", "شنكليش سلط", 4500),
  item("salad-caesar", "salads", "سيزر سلط", 4250),
  item("salad-seafood", "salads", "مكس سي فود سلط", 8500, {
    image: "/menu/seafood-salad.webp",
  }),

  item("cold-grape-leaves", "cold-appetizers", "ورق عنب", 2250),
  item("cold-shanklish", "cold-appetizers", "شنكليش", 2750),
  item("cold-muhammara", "cold-appetizers", "محمرة", 2250),
  item("cold-labneh-crisps", "cold-appetizers", "لبنة فراقيش", 2500),
  item("cold-hail-hummus", "cold-appetizers", "حمص بالخلطة الخاصة", 2750),

  item("hot-musakhan-cups", "hot-appetizers", "مسخن كب", 3750),
  item("hot-meat-crepe", "hot-appetizers", "كريب لحم", 4950),
  item("hot-nachos", "hot-appetizers", "ناتشوز", 5250, {
    nameEn: "Nachos",
    image: "/menu/nachos.webp",
  }),
  item("hot-stuffed-mushroom", "hot-appetizers", "فطر محشي", 4750),
  item("hot-shrimp-jacket", "hot-appetizers", "شرم جاكيت", 5750),
  item("hot-dynamite-chicken", "hot-appetizers", "دجاج داينمايت", 3750, {
    image: "/menu/dynamite-chicken.webp",
  }),
  item("hot-robito-balls", "hot-appetizers", "روبيتو بولز", 4750),
  item("hot-dynamite-shrimp", "hot-appetizers", "شريمب داينمايت", 6500),
  item("hot-spicy-potatoes", "hot-appetizers", "بطاطا حارة", 2500),
  item("hot-armenian-sujuk", "hot-appetizers", "سجق أرمني", 4250),
  item("hot-kashmiri-chicken", "hot-appetizers", "دجاج كشميري", 5250, {
    image: "/menu/kashmiri-chicken.webp",
  }),
  item("hot-falafel-cigar", "hot-appetizers", "فلافل سيجار", 2500),
  item("hot-combo-platter", "hot-appetizers", "كومبو بلاتر", 9950, {
    nameEn: "Combo platter",
    image: "/menu/combo-platter.webp",
    featured: true,
  }),

  item("pasta-penne-pesto", "pasta", "بينا بيستو", 5000, {
    image: "/menu/pesto-pasta.webp",
  }),
  item("pasta-bolognese", "pasta", "بولونيز", 4500),
  item("pasta-arrabbiata", "pasta", "بينا أرابياتا", 4500),
  item("pasta-fettuccine-alfredo", "pasta", "فوتوتشيني ألفريدو", 4500),
  item("pasta-hail-special", "pasta", "فوتوتشيني سبيشل", 7150, {
    image: "/menu/pasta-special.webp",
  }),
  item("addon-chicken", "pasta-addons", "إضافة دجاج", 1500, {
    noteAr: "إضافة للباستا",
    noteEn: "Pasta add-on",
  }),
  item("addon-shrimp", "pasta-addons", "إضافة شريمب", 3000, {
    noteAr: "إضافة للباستا",
    noteEn: "Pasta add-on",
  }),

  item("pizza-hail", "pizza", "بيتزا الشيف الخاصة", 5250, {
    nameEn: "Special Chef Pizza",
    image: "/menu/hail-pizza.webp",
    featured: true,
  }),
  item("pizza-alfredo", "pizza", "بيتزا ألفريدو", 5500),
  item("pizza-pepperoni", "pizza", "بيروني بيتزا", 4500, {
    nameEn: "Pepperoni pizza",
    image: "/menu/pepperoni-pizza.webp",
  }),
  item("pizza-vegetable", "pizza", "بيتزا خضار", 4500, {
    nameEn: "Vegetable pizza",
    image: "/menu/vegetable-pizza.webp",
  }),
  item("pizza-margherita", "pizza", "مارجاريتا بيتزا", 3950),
  item("pizza-source-unnamed", "pizza", "صنف بيتزا (الاسم غير ظاهر في الملف)", 4950, {
    noteAr: "السعر والصورة ظاهران في المنيو الرسمي، لكن اسم الصنف غير ظاهر.",
    noteEn: "Price and photo are visible in the official menu; the item name is not.",
    sourceAmbiguous: true,
  }),

  item("sandwich-turkey-cheese", "sandwiches", "ساندوش مكس شيز تيركي", 5250),
  item("sandwich-shish-tawook-wrap", "sandwiches", "ساندوش شيش طاووق راب", 4750),
  item("sandwich-chicken-cream", "sandwiches", "ساندوش كريما دجاج", 5500),
  item("sandwich-halloumi", "sandwiches", "حلّوم ساندوش", 4950, {
    image: "/menu/halloumi-sandwich.webp",
  }),
  item("sandwich-caesar", "sandwiches", "سيزر ساندوش", 5250, {
    image: "/menu/caesar-sandwich.webp",
  }),
  item("sandwich-club-loaf", "sandwiches", "كلب لوف", 5250, {
    nameEn: "Club loaf",
  }),

  item("burger-crispy-chicken", "burgers", "كريسبي تشكن برغر", 4750),
  item("burger-slider", "burgers", "سلايدر برغر", 5250, {
    image: "/menu/slider-burger.webp",
  }),
  item("burger-mushroom", "burgers", "مشروم برغر", 5500),
  item("burger-classic", "burgers", "كلاسيك برغر", 5000, {
    image: "/menu/classic-burger.webp",
  }),
  item("burger-grilled-chicken", "burgers", "جريل تشكن برغر", 4500),

  item("fatta-arayes", "fatta", "فتة العرايس", 2950),
  item("fatta-musakhan", "fatta", "فتة مسخن", 2750),
  item("soup-lentil", "soups", "شوربة عدس", 2500),
  item("soup-mushroom", "soups", "شوربة فطر", 3000),

  item("main-beef-steak", "mains", "بيف ستيك", 12500, {
    nameEn: "Beef steak",
    image: "/menu/beef-steak.webp",
    featured: true,
  }),
  item("main-classic-seafood", "mains", "كلاسيك مكس سي فود", 13900, {
    image: "/menu/seafood-main.webp",
  }),
  item("main-grilled-chicken", "mains", "دجاج جريل", 7750, {
    image: "/menu/grilled-chicken.webp",
  }),
  item("main-chicken-roll", "mains", "دجاج رول محشي فستق حلبي", 7750),
  item("main-fish-chips", "mains", "فيش أند شيبس", 7000),
  item("main-black-pepper-beef", "mains", "بيف بلاك بيبر", 8500, {
    image: "/menu/black-pepper-beef.webp",
  }),
  item("main-meat-pot", "mains", "فخارة شرحات لحم", 7950),
  item("main-butter-chicken", "mains", "بتر تشكن", 7750),
  item("main-chicken-cream-pot", "mains", "فخارة دجاج بالكريمة", 7750, {
    image: "/menu/chicken-cream-pot.webp",
  }),
  item("main-freekeh-chicken", "mains", "فخارة فريكة بالدجاج والكريمة", 7750),

  item("juice-lemon", "juices", "عصير ليمون", 3500, { nameEn: "Lemon juice" }),
  item("juice-pineapple", "juices", "عصير أناناس", 3500, { nameEn: "Pineapple juice" }),
  item("juice-strawberry", "juices", "عصير فراولة", 3500, {
    nameEn: "Strawberry juice",
    image: "/menu/strawberry-juice.webp",
  }),
  item("juice-mango", "juices", "عصير مانجا", 3500, {
    nameEn: "Mango juice",
    image: "/menu/mango-juice.webp",
    featured: true,
  }),
  item("juice-kiwi", "juices", "عصير كيوي", 3500, { nameEn: "Kiwi juice" }),
  item("juice-pineapple-mint", "juices", "عصير أناناس ونعنع", 3500, { nameEn: "Pineapple and mint" }),
  item("juice-guava", "juices", "عصير جوافة", 3500, { nameEn: "Guava juice" }),
  item("juice-lemon-mint", "juices", "عصير ليمون ونعنع", 3500, { nameEn: "Lemon and mint" }),
  item("juice-orange", "juices", "عصير برتقال", 3500, { nameEn: "Orange juice" }),
  item("juice-strawberry-passion", "juices", "عصير فراولة وباشن", 3500, { nameEn: "Strawberry and passion" }),

  item("smoothie-peach", "smoothies", "خوخ سموثي", 3750, { nameEn: "Peach smoothie" }),
  item("smoothie-passion", "smoothies", "باشن سموثي", 3750, { nameEn: "Passion smoothie" }),
  item("smoothie-strawberry", "smoothies", "فراولة سموثي", 3250, {
    nameEn: "Strawberry smoothie",
    image: "/menu/strawberry-smoothie.webp",
  }),
  item("smoothie-melon-cardamom", "smoothies", "شمام وهيل", 3750, { nameEn: "Muskmelon and cardamom" }),
  item("smoothie-mixed-berry", "smoothies", "مكس بيري سموثي", 3500, { nameEn: "Mixed berry smoothie" }),
  item("smoothie-mango", "smoothies", "مانجا سموثي", 3250, { nameEn: "Mango smoothie" }),
  item("smoothie-lemon-mint", "smoothies", "ليمون ونعنع سموثي", 3250, { nameEn: "Lemon and mint smoothie" }),
  item("smoothie-lemon-kiwi", "smoothies", "ليمون وكيوي سموثي", 3250, { nameEn: "Lemon and kiwi smoothie" }),
  item("smoothie-watermelon-lemonade", "smoothies", "بطيخ ليمونيد", 3500, { nameEn: "Watermelon lemonade" }),
  item("smoothie-lemon", "smoothies", "ليمون سموثي", 3250, { nameEn: "Lemon smoothie" }),

  item("milkshake-lotus", "milkshakes", "ميلك شيك لوتس", 3250, { nameEn: "Lotus milkshake", image: "/menu/milkshake.webp" }),
  item("milkshake-strawberry", "milkshakes", "ميلك شيك فراولة", 3250, { nameEn: "Strawberry milkshake" }),
  item("milkshake-chocolate", "milkshakes", "ميلك شيك شوكليت", 3250, { nameEn: "Chocolate milkshake" }),
  item("milkshake-vanilla", "milkshakes", "ميلك شيك فانيلا", 3250, { nameEn: "Vanilla milkshake" }),
  item("milkshake-cheesecake", "milkshakes", "ميلك شيك تشيز كيك", 3250, { nameEn: "Cheesecake milkshake" }),
  item("milkshake-pinacolada", "milkshakes", "ميلك شيك بيناكولادا", 3250, { nameEn: "Piña colada milkshake" }),
  item("milkshake-hail", "milkshakes", "ميلك شيك سبيشل", 3250, { nameEn: "Special milkshake" }),
  item("milkshake-oreo", "milkshakes", "ميلك شيك أوريو", 3250, { nameEn: "Oreo milkshake" }),
  item("milkshake-snickers", "milkshakes", "ميلك شيك سنكرز", 3250, { nameEn: "Snickers milkshake" }),
  item("milkshake-crocant", "milkshakes", "ميلك شيك كروكان", 3250, { nameEn: "Crocant milkshake" }),
  item("milkshake-arabian", "milkshakes", "ميلك شيك عربية", 3250, { nameEn: "Arabian milkshake" }),
  item("milkshake-banana-berry", "milkshakes", "ميلك شيك موز وتوت", 3250, { nameEn: "Banana and berry milkshake" }),
  item("milkshake-ferrero", "milkshakes", "ميلك شيك فيريرو", 3250, { nameEn: "Ferrero milkshake" }),

  item("mojito-candy", "mojito", "موهيتو كاندي", 3250, { nameEn: "Candy mojito", image: "/menu/mojito.webp" }),
  item("mojito-pineapple-lychee", "mojito", "موهيتو ليتشي أناناس", 3250, { nameEn: "Pineapple lychee mojito" }),
  item("mojito-hail", "mojito", "موهيتو سبيشل منعش", 3750, { nameEn: "Special mojito" }),
  item("mojito-cucumber-basil", "mojito", "موهيتو خيار وريحان", 3250, { nameEn: "Cucumber and basil mojito" }),
  item("mojito-blue-passion", "mojito", "موهيتو بلو باشن", 4250, { nameEn: "Blue passion mojito" }),
  item("mojito-mango-peach", "mojito", "موهيتو مانجا بيتش", 3250, { nameEn: "Mango peach mojito" }),
  item("mojito-blue-ocean", "mojito", "موهيتو بلو أوشن", 3750, { nameEn: "Blue ocean mojito" }),

  item("iced-mocha", "iced-coffee", "موكا آيس كوفي", 3500, { nameEn: "Mocha iced coffee", image: "/menu/iced-coffee.webp" }),
  item("iced-hazelnut", "iced-coffee", "هيزل آيس كوفي", 3500, { nameEn: "Hazelnut iced coffee" }),
  item("iced-creme-brulee", "iced-coffee", "كريم بروليه آيس شيكن", 3750, { nameEn: "Crème brûlée iced shaken" }),
  item("iced-americano", "iced-coffee", "آيس أمريكانو", 3000, { nameEn: "Iced Americano" }),
  item("iced-mint-chocolate-latte", "iced-coffee", "منت تشوكلت لاتيه", 3750, { nameEn: "Mint chocolate latte" }),
  item("iced-latte", "iced-coffee", "لاتيه آيس كوفي", 3250, { nameEn: "Iced latte" }),

  item("frappe-caramel", "frappe", "كراميل فراب", 4250, { nameEn: "Caramel frappe", image: "/menu/caramel-frappe.webp", featured: true }),
  item("frappe-oreo", "frappe", "أوريو فراب", 3750, { nameEn: "Oreo frappe" }),
  item("frappe-fruit-flakes", "frappe", "فروت فليكس فراب", 3750, { nameEn: "Fruit flakes frappe" }),
  item("frappe-vanilla", "frappe", "فانيلا فراب", 3750, { nameEn: "Vanilla frappe" }),
  item("frappe-chocolate", "frappe", "شوكليت فراب", 3750, { nameEn: "Chocolate frappe" }),
  item("frappe-wafer", "frappe", "ويفر فراب", 3750, { nameEn: "Wafer frappe" }),
  item("frappe-pretzel", "frappe", "برتزل فراب", 3750, { nameEn: "Pretzel frappe" }),

  item("iced-tea-lemon", "iced-tea", "ليمون آيس تي", 3500, { nameEn: "Lemon iced tea" }),
  item("iced-tea-raspberry", "iced-tea", "رازبيري آيس تي", 3500, { nameEn: "Raspberry iced tea" }),
  item("iced-tea-peach", "iced-tea", "خوخ آيس تي", 3500, { nameEn: "Peach iced tea" }),

  item("cocktail-banana-arugula", "cocktails", "روكا بانانا", 3500, { nameEn: "Banana arugula" }),
  item("cocktail-banana-milk", "cocktails", "موز وحليب", 3500, { nameEn: "Banana and milk" }),
  item("cocktail-strawberry-banana", "cocktails", "فراولة وموز", 3500, { nameEn: "Strawberry and banana" }),
  item("cocktail-berry-banana", "cocktails", "بنانا بيري", 4000, { nameEn: "Berry and banana" }),
  item("cocktail-hail", "cocktails", "كوكتيل النخبة", 4000, { nameEn: "Gourmet cocktail", image: "/menu/hail-cocktail.webp" }),
  item("cocktail-avocado", "cocktails", "أفوكادو", 4000, { nameEn: "Avocado juice" }),
  item("cocktail-peach-colada", "cocktails", "بيتش كولادا", 3750, { nameEn: "Peach colada" }),
  item("cocktail-guava-apple", "cocktails", "جوافة غرين أبل", 3500, { nameEn: "Guava and green apple" }),
  item("cocktail-mango-passion", "cocktails", "مانجا باشن", 3750, { nameEn: "Mango passion" }),

  item("hot-cappuccino", "hot-drinks", "كابتشينو", 2750, { nameEn: "Cappuccino", image: "/menu/hot-coffee.webp" }),
  item("hot-cafe-mocha", "hot-drinks", "موكا", 2750, { nameEn: "Caffè mocha" }),
  item("hot-pink-latte", "hot-drinks", "بينك لاتيه", 2750, { nameEn: "Pink latte" }),
  item("hot-affogato", "hot-drinks", "إسبريسو أفوكاتو", 2750, { nameEn: "Affogato espresso" }),
  item("hot-nescafe", "hot-drinks", "نسكافيه", 2500, { nameEn: "Nescafé" }),
  item("hot-oreo-coffee", "hot-drinks", "أوريو كوفي", 3250, { nameEn: "Oreo coffee" }),
  item("hot-snickers-coffee", "hot-drinks", "سنكرز كوفي", 3250, { nameEn: "Snickers coffee" }),
  item("hot-french-coffee", "hot-drinks", "فرنش كوفي", 3250, { nameEn: "French coffee" }),
  item("hot-spanish-latte", "hot-drinks", "سبانش لاتيه", 3750, { nameEn: "Spanish latte" }),
  item("hot-americano", "hot-drinks", "أمريكانو", 2750, { nameEn: "Americano" }),
  item("hot-cortado", "hot-drinks", "كورتادو", 2750, { nameEn: "Cortado" }),
  item("hot-double-espresso", "hot-drinks", "دبل إسبريسو", 2750, { nameEn: "Double espresso" }),
  item("hot-single-espresso", "hot-drinks", "سنجل إسبريسو", 2250, { nameEn: "Single espresso" }),
  item("hot-chocolate", "hot-drinks", "هوت شوكلت", 3250, { nameEn: "Hot chocolate", image: "/menu/hot-chocolate.webp" }),
  item("hot-hail-chocolate", "hot-drinks", "هوت شوكلت فاخر", 3250, { nameEn: "Deluxe hot chocolate" }),
  item("hot-turkish-single", "hot-drinks", "قهوة تركية سنجل", 2250, { nameEn: "Turkish single" }),
  item("hot-turkish-double", "hot-drinks", "قهوة تركية دبل", 2750, { nameEn: "Turkish double" }),
  item("hot-macchiato", "hot-drinks", "مكياتو", 2750, { nameEn: "Macchiato" }),

  item("special-v60", "special-coffee", "V60", 3500, { nameEn: "V60" }),
  item("special-french-press", "special-coffee", "فرنش بريس", 2750, { nameEn: "French press" }),
  item("special-siphon", "special-coffee", "سايفون", 3750, { nameEn: "Siphon" }),

  item("herb-anise", "herbs", "يانسون", 1750, { nameEn: "Anise" }),
  item("herb-mixed", "herbs", "أعشاب مشكلة", 1750, { nameEn: "Mixed herbs" }),
  item("herb-green-tea", "herbs", "شاي أخضر", 1750, { nameEn: "Green tea" }),
  item("herb-sage", "herbs", "ميرمية", 1750, { nameEn: "Sage" }),
  item("herb-chamomile", "herbs", "بابونج", 1750, { nameEn: "Chamomile" }),
  item("herb-tea", "herbs", "شاي", 1750, { nameEn: "Tea" }),
  item("herb-ginger-lemon-honey", "herbs", "زنجبيل وليمون وعسل", 2750, { nameEn: "Ginger, lemon and honey" }),
  item("herb-ginger-milk-honey", "herbs", "زنجبيل وحليب وعسل", 2750, { nameEn: "Ginger, milk and honey" }),
  item("herb-karak", "herbs", "شاي كرك", 2500, { nameEn: "Karak tea" }),

  item("sweet-strawberry-tart", "sweets", "تارت فراولة", 4500, { nameEn: "Strawberry tart" }),
  item("sweet-tiramisu", "sweets", "تيراميسو", 4500, { nameEn: "Tiramisu" }),
  item("sweet-san-sebastian", "sweets", "سان سيباستيان", 4500, { nameEn: "San Sebastian" }),
  item("sweet-chocolate-mousse", "sweets", "موس شوكولاتة", 4500, { nameEn: "Chocolate mousse" }),
  item("sweet-raspberry-cheesecake", "sweets", "تشيزكيك توت العليق", 4500, { nameEn: "Raspberry cheesecake" }),
  item("sweet-brownies", "sweets", "براونيز", 4500, { nameEn: "Brownies" }),
  item("sweet-oreo-cheesecake", "sweets", "تشيزكيك أوريو", 4500, { nameEn: "Oreo cheesecake" }),

  item("hookah-double-apple-nakhla", "hookah", "تفاحتين نخلة", 5000),
  item("hookah-double-apple-mazaya", "hookah", "تفاحتين مزايا", 4200),
  item("hookah-lemon-mint", "hookah", "ليمون ونعنع", 4200),
  item("hookah-watermelon-mint", "hookah", "بطيخ ونعنع", 4200),
  item("hookah-blueberry", "hookah", "توت بلو بيري", 4200),
  item("hookah-grape", "hookah", "عنب", 4200),
  item("hookah-berry-mint", "hookah", "توت ونعنع", 4200),
  item("hookah-cherry-mint", "hookah", "كرز ونعنع", 4200),
  item("hookah-mastic", "hookah", "مسكة", 4200),
  item("hookah-gum-cinnamon", "hookah", "علكة وقرفة", 4200),
  item("hookah-gum-mint", "hookah", "علكة ونعنع", 4200),
  item("hookah-apple-mint", "hookah", "تفاح ونعنع", 4200),
  item("hookah-candy-drops", "hookah", "كاندي دروبس", 4200),
  item("hookah-hail-mix", "hookah", "خلطة المعسل الخاصة", 4200),
  item("hookah-lovely", "hookah", "لفلي", 4200),
  item("hookah-ice-sweet", "hookah", "آيس سويت", 4200),
  item("hookah-orange-mint", "hookah", "برتقال ونعنع", 4200),

  item("soft-boom-boom", "soft-drinks", "بوم بوم", 2500, { nameEn: "Boom Boom" }),
  item("soft-red-bull", "soft-drinks", "ريد بول", 3000, { nameEn: "Red Bull", image: "/menu/red-bull.webp" }),
  item("soft-code-red", "soft-drinks", "كود ريد", 2500, { nameEn: "Code Red" }),
  item("soft-perrier", "soft-drinks", "مياه بيريه", 2250, { nameEn: "Perrier" }),
  item("soft-water", "soft-drinks", "ماء", 600, { nameEn: "Water", image: "/menu/water.webp" }),
];

export const TAX_RATE = 0.07;

export function formatJod(mils: number, locale = "ar-JO") {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: mils % 1000 === 0 ? 2 : 2,
    maximumFractionDigits: 3,
  }).format(mils / 1000);
}

export function menuItemById(id: string) {
  return menuItems.find((menuItem) => menuItem.id === id);
}

export function categoryById(id: string) {
  return menuCategories.find((menuCategory) => menuCategory.id === id);
}

export function getFallbackImageForCategory(categoryId: string): string {
  switch (categoryId) {
    case "breakfast":
      return "/menu/foul.webp";
    case "salads":
      return "/menu/hail-salad.webp";
    case "cold-appetizers":
      return "/menu/labneh-zaatar.webp";
    case "hot-appetizers":
      return "/menu/combo-platter.webp";
    case "pasta":
    case "pasta-addons":
      return "/menu/pesto-pasta.webp";
    case "pizza":
      return "/menu/hail-pizza.webp";
    case "sandwiches":
      return "/menu/caesar-sandwich.webp";
    case "burgers":
      return "/menu/classic-burger.webp";
    case "fatta":
      return "/menu/kashmiri-chicken.webp";
    case "soups":
      return "/menu/chicken-cream-pot.webp";
    case "mains":
      return "/menu/beef-steak.webp";
    case "juices":
      return "/menu/mango-juice.webp";
    case "smoothies":
      return "/menu/strawberry-smoothie.webp";
    case "milkshakes":
      return "/menu/milkshake.webp";
    case "mojito":
      return "/menu/mojito.webp";
    case "iced-coffee":
      return "/menu/iced-coffee.webp";
    case "frappe":
      return "/menu/caramel-frappe.webp";
    case "iced-tea":
      return "/menu/mojito.webp";
    case "cocktails":
      return "/menu/hail-cocktail.webp";
    case "hot-drinks":
    case "special-coffee":
    case "herbs":
      return "/menu/hot-coffee.webp";
    case "sweets":
      return "/menu/caramel-frappe.webp";
    case "hookah":
      return "/menu/mojito.webp";
    case "soft-drinks":
      return "/menu/red-bull.webp";
    default:
      return "/menu/hail-salad.webp";
  }
}

export function getItemImage(item: { image?: string; categoryId: string }): string {
  if (item.image && item.image.trim() !== "") {
    return item.image;
  }
  return getFallbackImageForCategory(item.categoryId);
}
