/* ==========================================================================
   HAIL OS — بيانات المنيو الرسمي
   مُفرّغة بالكامل من منيو هيل كافيه الرسمي (رمز QR)
   26 قسم · 209 صنف · الأسعار بالفلس (1000 فلس = 1 دينار) قبل ضريبة 7%
   ========================================================================== */

export const TAX_RATE = 0.07;
export const CURRENCY = { code: 'JOD', ar: 'د.أ', en: 'JOD', decimals: 3 };

/* محطات التحضير — يُوجَّه كل صنف تلقائياً لشاشة المحطة المسؤولة */
export const STATIONS = {
  hot:    { id: 'hot',    ar: 'المطبخ الساخن', en: 'Hot kitchen', color: '#E8663A', icon: 'flame' },
  grill:  { id: 'grill',  ar: 'الشوي',         en: 'Grill',       color: '#C0392B', icon: 'beef' },
  oven:   { id: 'oven',   ar: 'الفرن',         en: 'Oven',        color: '#D98324', icon: 'pizza' },
  cold:   { id: 'cold',   ar: 'المطبخ البارد', en: 'Cold kitchen',color: '#2E9E7E', icon: 'salad' },
  bar:    { id: 'bar',    ar: 'البار',         en: 'Bar',         color: '#3B82C4', icon: 'cup' },
  pastry: { id: 'pastry', ar: 'الحلويات',      en: 'Pastry',      color: '#B4638F', icon: 'cake' },
  hookah: { id: 'hookah', ar: 'المعسل',        en: 'Hookah',      color: '#7C6BAE', icon: 'smoke' },
};

/* [ id, arabic, english, station, prep-minutes, icon ] */
const CATS = [
  ['breakfast',       'الفطور',                    'Breakfast',          'hot',    12, 'egg'],
  ['salads',          'السلطات',                   'Salads',             'cold',    8, 'salad'],
  ['cold-appetizers', 'المقبلات الباردة',          'Cold appetizers',    'cold',    6, 'bowl'],
  ['hot-appetizers',  'المقبلات الساخنة',          'Hot appetizers',     'hot',    14, 'flame'],
  ['pasta',           'الباستا',                   'Pasta',              'hot',    16, 'pasta'],
  ['pasta-addons',    'إضافات الباستا',            'Pasta add-ons',      'hot',     5, 'plus'],
  ['pizza',           'البيتزا',                   'Pizza',              'oven',   18, 'pizza'],
  ['sandwiches',      'الساندوش',                  'Sandwiches',         'hot',    12, 'sandwich'],
  ['burgers',         'البرغر',                    'Burgers',            'grill',  15, 'burger'],
  ['fatta',           'الفتة',                     'Fatta',              'hot',    10, 'bowl'],
  ['soups',           'الشوربات',                  'Soups',              'hot',     7, 'soup'],
  ['mains',           'الأطباق الرئيسية',          'Main dishes',        'grill',  22, 'beef'],
  ['juices',          'العصائر',                   'Juices',             'bar',     4, 'juice'],
  ['smoothies',       'السموثي',                   'Smoothies',          'bar',     5, 'smoothie'],
  ['milkshakes',      'الميلك شيك',                'Milkshakes',         'bar',     5, 'shake'],
  ['mojito',          'الموهيتو',                  'Mojito',             'bar',     5, 'mojito'],
  ['iced-coffee',     'القهوة الباردة',            'Iced coffee',        'bar',     4, 'iced'],
  ['frappe',          'الفرابيه',                  'Frappe',             'bar',     5, 'shake'],
  ['iced-tea',        'الشاي المثلج',              'Iced tea',           'bar',     4, 'iced'],
  ['cocktails',       'الكوكتيل',                  'Cocktails',          'bar',     6, 'mojito'],
  ['hot-drinks',      'المشروبات الساخنة',         'Hot drinks',         'bar',     4, 'cup'],
  ['special-coffee',  'القهوة المختصة',            'Specialty coffee',   'bar',     7, 'cup'],
  ['herbs',           'الأعشاب',                   'Herbal infusions',   'bar',     4, 'leaf'],
  ['sweets',          'الحلويات',                  'Desserts',           'pastry',  6, 'cake'],
  ['hookah',          'المعسل',                    'Hookah',             'hookah', 10, 'smoke'],
  ['soft-drinks',     'المشروبات الغازية والمياه', 'Soft drinks & water','bar',     2, 'bottle'],
];

/* [ id, categoryId, arabic, english, priceFils, image, flags ]
   flags: f=مميّز  n=ملاحظة عربية  ne=ملاحظة إنجليزية  a=غير مؤكد من المصدر  t=وسوم */
const ITEMS = [
  // ── الفطور ──────────────────────────────────────────────────────────────
  ['breakfast-foul','breakfast','فول','Foul',2000,'foul',{f:1,t:['نباتي']}],
  ['breakfast-tomato','breakfast','قلّاية بندورة','Tomato qalayet',2500,'',{t:['نباتي']}],
  ['breakfast-hummus','breakfast','حمص','Hummus',2000,'',{t:['نباتي']}],
  ['breakfast-labneh-zaatar','breakfast','لبنة مع زعتر وفرافيش','Labneh with zaatar',2750,'labneh-zaatar',{t:['نباتي']}],
  ['breakfast-fattet-hummus','breakfast','فتة حمص','Fattet hummus',2250,'',{t:['نباتي']}],
  ['breakfast-halloumi','breakfast','حلّوم','Halloumi',2950,'',{t:['نباتي']}],
  ['breakfast-omelette','breakfast','أومليت','Omelette',2750,'omelette',{}],
  ['breakfast-fried-eggs','breakfast','بيض عيون','Fried eggs',2000,'',{}],
  ['breakfast-falafel-taco','breakfast','تاكو فلافل','Falafel taco',2750,'',{t:['نباتي']}],
  ['breakfast-shakshuka','breakfast','شكشوكة خاصة','Special shakshuka',2250,'',{t:['حار']}],
  ['breakfast-potatoes','breakfast','بطاطا','Potatoes',2000,'',{t:['نباتي']}],
  ['breakfast-turkey-quiche','breakfast','كيش تيركي','Turkey quiche',3000,'',{}],
  ['breakfast-sausage-eggs','breakfast','صوصج مع البيض','Sausage with eggs',3100,'',{}],
  ['breakfast-roast-beef-kashkawan','breakfast','روست بيف مع كشكوان','Roast beef with kashkawan',2900,'',{}],
  ['breakfast-falafel-veg','breakfast','فلافل مع الخضار','Falafel with vegetables',2250,'',{t:['نباتي']}],
  ['breakfast-turkey-cheddar','breakfast','تيركي مع شدر','Turkey with cheddar',2900,'',{}],
  ['breakfast-labneh','breakfast','لبنة','Labneh',2250,'',{t:['نباتي']}],
  ['breakfast-cheese-mix','breakfast','مكس أجبان','Cheese mix',2750,'',{t:['نباتي']}],
  ['breakfast-muhammara-cheese','breakfast','محمرة مع مكس أجبان','Muhammara with cheese mix',2750,'',{t:['نباتي']}],
  ['breakfast-halloumi-rocket','breakfast','حلّوم مع الجرجير','Halloumi with rocket',2750,'',{t:['نباتي']}],
  ['breakfast-oil-zaatar','breakfast','زيت وزعتر','Oil and zaatar',2000,'',{t:['نباتي']}],
  ['breakfast-lotus-nutella','breakfast','لوتس ونوتيلا','Lotus and Nutella',3250,'',{t:['حلو']}],

  // ── السلطات ─────────────────────────────────────────────────────────────
  ['salad-fattoush-hail','salads','فتوش بخلطة الشيف','Special fattoush',4000,'',{t:['نباتي']}],
  ['salad-tabbouleh','salads','تبولة فاخرة','Special tabbouleh',4500,'',{t:['نباتي']}],
  ['salad-greek','salads','يونانية سلط','Greek salad',3950,'',{t:['نباتي']}],
  ['salad-hail','salads','سلطة الشيف الخاصة','Chef special salad',4750,'hail-salad',{f:1}],
  ['salad-shanklish','salads','شنكليش سلط','Shanklish salad',4500,'',{t:['نباتي']}],
  ['salad-caesar','salads','سيزر سلط','Caesar salad',4250,'',{}],
  ['salad-seafood','salads','مكس سي فود سلط','Mixed seafood salad',8500,'seafood-salad',{t:['بحري']}],

  // ── المقبلات الباردة ────────────────────────────────────────────────────
  ['cold-grape-leaves','cold-appetizers','ورق عنب','Grape leaves',2250,'',{t:['نباتي']}],
  ['cold-shanklish','cold-appetizers','شنكليش','Shanklish',2750,'',{t:['نباتي']}],
  ['cold-muhammara','cold-appetizers','محمرة','Muhammara',2250,'',{t:['نباتي','حار']}],
  ['cold-labneh-crisps','cold-appetizers','لبنة فراقيش','Labneh with crisps',2500,'',{t:['نباتي']}],
  ['cold-hail-hummus','cold-appetizers','حمص بالخلطة الخاصة','Special hummus',2750,'',{t:['نباتي']}],

  // ── المقبلات الساخنة ────────────────────────────────────────────────────
  ['hot-musakhan-cups','hot-appetizers','مسخن كب','Musakhan cups',3750,'',{}],
  ['hot-meat-crepe','hot-appetizers','كريب لحم','Meat crepe',4950,'',{}],
  ['hot-nachos','hot-appetizers','ناتشوز','Nachos',5250,'nachos',{}],
  ['hot-stuffed-mushroom','hot-appetizers','فطر محشي','Stuffed mushroom',4750,'',{t:['نباتي']}],
  ['hot-shrimp-jacket','hot-appetizers','شرم جاكيت','Shrimp jacket',5750,'',{t:['بحري']}],
  ['hot-dynamite-chicken','hot-appetizers','دجاج داينمايت','Dynamite chicken',3750,'dynamite-chicken',{t:['حار']}],
  ['hot-robito-balls','hot-appetizers','روبيتو بولز','Robito balls',4750,'',{}],
  ['hot-dynamite-shrimp','hot-appetizers','شريمب داينمايت','Dynamite shrimp',6500,'',{t:['بحري','حار']}],
  ['hot-spicy-potatoes','hot-appetizers','بطاطا حارة','Spicy potatoes',2500,'',{t:['نباتي','حار']}],
  ['hot-armenian-sujuk','hot-appetizers','سجق أرمني','Armenian sujuk',4250,'',{t:['حار']}],
  ['hot-kashmiri-chicken','hot-appetizers','دجاج كشميري','Kashmiri chicken',5250,'kashmiri-chicken',{}],
  ['hot-falafel-cigar','hot-appetizers','فلافل سيجار','Falafel cigar',2500,'',{t:['نباتي']}],
  ['hot-combo-platter','hot-appetizers','كومبو بلاتر','Combo platter',9950,'combo-platter',{f:1,t:['للمشاركة']}],

  // ── الباستا ─────────────────────────────────────────────────────────────
  ['pasta-penne-pesto','pasta','بينا بيستو','Penne pesto',5000,'pesto-pasta',{t:['نباتي']}],
  ['pasta-bolognese','pasta','بولونيز','Bolognese',4500,'',{}],
  ['pasta-arrabbiata','pasta','بينا أرابياتا','Penne arrabbiata',4500,'',{t:['نباتي','حار']}],
  ['pasta-fettuccine-alfredo','pasta','فوتوتشيني ألفريدو','Fettuccine alfredo',4500,'',{}],
  ['pasta-hail-special','pasta','فوتوتشيني سبيشل','Fettuccine special',7150,'pasta-special',{f:1}],
  ['addon-chicken','pasta-addons','إضافة دجاج','Chicken add-on',1500,'',{n:'إضافة للباستا',ne:'Pasta add-on'}],
  ['addon-shrimp','pasta-addons','إضافة شريمب','Shrimp add-on',3000,'',{n:'إضافة للباستا',ne:'Pasta add-on',t:['بحري']}],

  // ── البيتزا ─────────────────────────────────────────────────────────────
  ['pizza-hail','pizza','بيتزا الشيف الخاصة','Chef special pizza',5250,'hail-pizza',{f:1}],
  ['pizza-alfredo','pizza','بيتزا ألفريدو','Alfredo pizza',5500,'',{}],
  ['pizza-pepperoni','pizza','بيروني بيتزا','Pepperoni pizza',4500,'pepperoni-pizza',{}],
  ['pizza-vegetable','pizza','بيتزا خضار','Vegetable pizza',4500,'vegetable-pizza',{t:['نباتي']}],
  ['pizza-margherita','pizza','مارجاريتا بيتزا','Margherita pizza',3950,'',{t:['نباتي']}],
  ['pizza-source-unnamed','pizza','صنف بيتزا (الاسم غير ظاهر في المنيو)','Pizza item (name not legible)',4950,'',
    {a:1,n:'السعر والصورة ظاهران في المنيو الرسمي، لكن اسم الصنف غير واضح.',ne:'Price and photo appear in the official menu; the item name is not legible.'}],

  // ── الساندوش ────────────────────────────────────────────────────────────
  ['sandwich-turkey-cheese','sandwiches','ساندوش مكس شيز تيركي','Turkey cheese mix sandwich',5250,'',{}],
  ['sandwich-shish-tawook-wrap','sandwiches','ساندوش شيش طاووق راب','Shish tawook wrap',4750,'',{}],
  ['sandwich-chicken-cream','sandwiches','ساندوش كريما دجاج','Creamy chicken sandwich',5500,'',{}],
  ['sandwich-halloumi','sandwiches','حلّوم ساندوش','Halloumi sandwich',4950,'halloumi-sandwich',{t:['نباتي']}],
  ['sandwich-caesar','sandwiches','سيزر ساندوش','Caesar sandwich',5250,'caesar-sandwich',{}],
  ['sandwich-club-loaf','sandwiches','كلب لوف','Club loaf',5250,'',{}],

  // ── البرغر ──────────────────────────────────────────────────────────────
  ['burger-crispy-chicken','burgers','كريسبي تشكن برغر','Crispy chicken burger',4750,'',{}],
  ['burger-slider','burgers','سلايدر برغر','Slider burger',5250,'slider-burger',{}],
  ['burger-mushroom','burgers','مشروم برغر','Mushroom burger',5500,'',{}],
  ['burger-classic','burgers','كلاسيك برغر','Classic burger',5000,'classic-burger',{f:1}],
  ['burger-grilled-chicken','burgers','جريل تشكن برغر','Grilled chicken burger',4500,'',{}],

  // ── الفتة والشوربات ─────────────────────────────────────────────────────
  ['fatta-arayes','fatta','فتة العرايس','Arayes fatta',2950,'',{}],
  ['fatta-musakhan','fatta','فتة مسخن','Musakhan fatta',2750,'',{}],
  ['soup-lentil','soups','شوربة عدس','Lentil soup',2500,'',{t:['نباتي']}],
  ['soup-mushroom','soups','شوربة فطر','Mushroom soup',3000,'',{t:['نباتي']}],

  // ── الأطباق الرئيسية ────────────────────────────────────────────────────
  ['main-beef-steak','mains','بيف ستيك','Beef steak',12500,'beef-steak',{f:1}],
  ['main-classic-seafood','mains','كلاسيك مكس سي فود','Classic mixed seafood',13900,'seafood-main',{t:['بحري']}],
  ['main-grilled-chicken','mains','دجاج جريل','Grilled chicken',7750,'grilled-chicken',{}],
  ['main-chicken-roll','mains','دجاج رول محشي فستق حلبي','Chicken roll with pistachio',7750,'',{}],
  ['main-fish-chips','mains','فيش أند شيبس','Fish and chips',7000,'',{t:['بحري']}],
  ['main-black-pepper-beef','mains','بيف بلاك بيبر','Black pepper beef',8500,'black-pepper-beef',{t:['حار']}],
  ['main-meat-pot','mains','فخارة شرحات لحم','Beef clay pot',7950,'',{}],
  ['main-butter-chicken','mains','بتر تشكن','Butter chicken',7750,'',{}],
  ['main-chicken-cream-pot','mains','فخارة دجاج بالكريمة','Creamy chicken clay pot',7750,'chicken-cream-pot',{}],
  ['main-freekeh-chicken','mains','فخارة فريكة بالدجاج والكريمة','Freekeh chicken clay pot',7750,'',{}],

  // ── العصائر ─────────────────────────────────────────────────────────────
  ['juice-lemon','juices','عصير ليمون','Lemon juice',3500,'',{}],
  ['juice-pineapple','juices','عصير أناناس','Pineapple juice',3500,'',{}],
  ['juice-strawberry','juices','عصير فراولة','Strawberry juice',3500,'strawberry-juice',{}],
  ['juice-mango','juices','عصير مانجا','Mango juice',3500,'mango-juice',{f:1}],
  ['juice-kiwi','juices','عصير كيوي','Kiwi juice',3500,'',{}],
  ['juice-pineapple-mint','juices','عصير أناناس ونعنع','Pineapple and mint',3500,'',{}],
  ['juice-guava','juices','عصير جوافة','Guava juice',3500,'',{}],
  ['juice-lemon-mint','juices','عصير ليمون ونعنع','Lemon and mint',3500,'',{}],
  ['juice-orange','juices','عصير برتقال','Orange juice',3500,'',{}],
  ['juice-strawberry-passion','juices','عصير فراولة وباشن','Strawberry and passion',3500,'',{}],

  // ── السموثي ─────────────────────────────────────────────────────────────
  ['smoothie-peach','smoothies','خوخ سموثي','Peach smoothie',3750,'',{}],
  ['smoothie-passion','smoothies','باشن سموثي','Passion smoothie',3750,'',{}],
  ['smoothie-strawberry','smoothies','فراولة سموثي','Strawberry smoothie',3250,'strawberry-smoothie',{}],
  ['smoothie-melon-cardamom','smoothies','شمام وهيل','Muskmelon and cardamom',3750,'',{}],
  ['smoothie-mixed-berry','smoothies','مكس بيري سموثي','Mixed berry smoothie',3500,'',{}],
  ['smoothie-mango','smoothies','مانجا سموثي','Mango smoothie',3250,'',{}],
  ['smoothie-lemon-mint','smoothies','ليمون ونعنع سموثي','Lemon and mint smoothie',3250,'',{}],
  ['smoothie-lemon-kiwi','smoothies','ليمون وكيوي سموثي','Lemon and kiwi smoothie',3250,'',{}],
  ['smoothie-watermelon-lemonade','smoothies','بطيخ ليمونيد','Watermelon lemonade',3500,'',{}],
  ['smoothie-lemon','smoothies','ليمون سموثي','Lemon smoothie',3250,'',{}],

  // ── الميلك شيك ──────────────────────────────────────────────────────────
  ['milkshake-lotus','milkshakes','ميلك شيك لوتس','Lotus milkshake',3250,'milkshake',{f:1}],
  ['milkshake-strawberry','milkshakes','ميلك شيك فراولة','Strawberry milkshake',3250,'',{}],
  ['milkshake-chocolate','milkshakes','ميلك شيك شوكليت','Chocolate milkshake',3250,'',{}],
  ['milkshake-vanilla','milkshakes','ميلك شيك فانيلا','Vanilla milkshake',3250,'',{}],
  ['milkshake-cheesecake','milkshakes','ميلك شيك تشيز كيك','Cheesecake milkshake',3250,'',{}],
  ['milkshake-pinacolada','milkshakes','ميلك شيك بيناكولادا','Piña colada milkshake',3250,'',{}],
  ['milkshake-hail','milkshakes','ميلك شيك سبيشل','Special milkshake',3250,'',{}],
  ['milkshake-oreo','milkshakes','ميلك شيك أوريو','Oreo milkshake',3250,'',{}],
  ['milkshake-snickers','milkshakes','ميلك شيك سنكرز','Snickers milkshake',3250,'',{}],
  ['milkshake-crocant','milkshakes','ميلك شيك كروكان','Crocant milkshake',3250,'',{}],
  ['milkshake-arabian','milkshakes','ميلك شيك عربية','Arabian milkshake',3250,'',{}],
  ['milkshake-banana-berry','milkshakes','ميلك شيك موز وتوت','Banana and berry milkshake',3250,'',{}],
  ['milkshake-ferrero','milkshakes','ميلك شيك فيريرو','Ferrero milkshake',3250,'',{}],

  // ── الموهيتو ────────────────────────────────────────────────────────────
  ['mojito-candy','mojito','موهيتو كاندي','Candy mojito',3250,'mojito',{}],
  ['mojito-pineapple-lychee','mojito','موهيتو ليتشي أناناس','Pineapple lychee mojito',3250,'',{}],
  ['mojito-hail','mojito','موهيتو سبيشل منعش','Special mojito',3750,'',{f:1}],
  ['mojito-cucumber-basil','mojito','موهيتو خيار وريحان','Cucumber and basil mojito',3250,'',{}],
  ['mojito-blue-passion','mojito','موهيتو بلو باشن','Blue passion mojito',4250,'',{}],
  ['mojito-mango-peach','mojito','موهيتو مانجا بيتش','Mango peach mojito',3250,'',{}],
  ['mojito-blue-ocean','mojito','موهيتو بلو أوشن','Blue ocean mojito',3750,'',{}],

  // ── القهوة الباردة ──────────────────────────────────────────────────────
  ['iced-mocha','iced-coffee','موكا آيس كوفي','Mocha iced coffee',3500,'iced-coffee',{}],
  ['iced-hazelnut','iced-coffee','هيزل آيس كوفي','Hazelnut iced coffee',3500,'',{}],
  ['iced-creme-brulee','iced-coffee','كريم بروليه آيس شيكن','Crème brûlée iced shaken',3750,'',{}],
  ['iced-americano','iced-coffee','آيس أمريكانو','Iced Americano',3000,'',{}],
  ['iced-mint-chocolate-latte','iced-coffee','منت تشوكلت لاتيه','Mint chocolate latte',3750,'',{}],
  ['iced-latte','iced-coffee','لاتيه آيس كوفي','Iced latte',3250,'',{}],

  // ── الفرابيه ────────────────────────────────────────────────────────────
  ['frappe-caramel','frappe','كراميل فراب','Caramel frappe',4250,'caramel-frappe',{f:1}],
  ['frappe-oreo','frappe','أوريو فراب','Oreo frappe',3750,'',{}],
  ['frappe-fruit-flakes','frappe','فروت فليكس فراب','Fruit flakes frappe',3750,'',{}],
  ['frappe-vanilla','frappe','فانيلا فراب','Vanilla frappe',3750,'',{}],
  ['frappe-chocolate','frappe','شوكليت فراب','Chocolate frappe',3750,'',{}],
  ['frappe-wafer','frappe','ويفر فراب','Wafer frappe',3750,'',{}],
  ['frappe-pretzel','frappe','برتزل فراب','Pretzel frappe',3750,'',{}],

  // ── الشاي المثلج ────────────────────────────────────────────────────────
  ['iced-tea-lemon','iced-tea','ليمون آيس تي','Lemon iced tea',3500,'',{}],
  ['iced-tea-raspberry','iced-tea','رازبيري آيس تي','Raspberry iced tea',3500,'',{}],
  ['iced-tea-peach','iced-tea','خوخ آيس تي','Peach iced tea',3500,'',{}],

  // ── الكوكتيل ────────────────────────────────────────────────────────────
  ['cocktail-banana-arugula','cocktails','روكا بانانا','Banana arugula',3500,'',{}],
  ['cocktail-banana-milk','cocktails','موز وحليب','Banana and milk',3500,'',{}],
  ['cocktail-strawberry-banana','cocktails','فراولة وموز','Strawberry and banana',3500,'',{}],
  ['cocktail-berry-banana','cocktails','بنانا بيري','Berry and banana',4000,'',{}],
  ['cocktail-hail','cocktails','كوكتيل النخبة','Gourmet cocktail',4000,'hail-cocktail',{f:1}],
  ['cocktail-avocado','cocktails','أفوكادو','Avocado',4000,'',{}],
  ['cocktail-peach-colada','cocktails','بيتش كولادا','Peach colada',3750,'',{}],
  ['cocktail-guava-apple','cocktails','جوافة غرين أبل','Guava and green apple',3500,'',{}],
  ['cocktail-mango-passion','cocktails','مانجا باشن','Mango passion',3750,'',{}],

  // ── المشروبات الساخنة ───────────────────────────────────────────────────
  ['hot-cappuccino','hot-drinks','كابتشينو','Cappuccino',2750,'hot-coffee',{}],
  ['hot-cafe-mocha','hot-drinks','موكا','Caffè mocha',2750,'',{}],
  ['hot-pink-latte','hot-drinks','بينك لاتيه','Pink latte',2750,'',{}],
  ['hot-affogato','hot-drinks','إسبريسو أفوكاتو','Affogato espresso',2750,'',{}],
  ['hot-nescafe','hot-drinks','نسكافيه','Nescafé',2500,'',{}],
  ['hot-oreo-coffee','hot-drinks','أوريو كوفي','Oreo coffee',3250,'',{}],
  ['hot-snickers-coffee','hot-drinks','سنكرز كوفي','Snickers coffee',3250,'',{}],
  ['hot-french-coffee','hot-drinks','فرنش كوفي','French coffee',3250,'',{}],
  ['hot-spanish-latte','hot-drinks','سبانش لاتيه','Spanish latte',3750,'',{f:1}],
  ['hot-americano','hot-drinks','أمريكانو','Americano',2750,'',{}],
  ['hot-cortado','hot-drinks','كورتادو','Cortado',2750,'',{}],
  ['hot-double-espresso','hot-drinks','دبل إسبريسو','Double espresso',2750,'',{}],
  ['hot-single-espresso','hot-drinks','سنجل إسبريسو','Single espresso',2250,'',{}],
  ['hot-chocolate','hot-drinks','هوت شوكلت','Hot chocolate',3250,'hot-chocolate',{}],
  ['hot-hail-chocolate','hot-drinks','هوت شوكلت فاخر','Deluxe hot chocolate',3250,'',{}],
  ['hot-turkish-single','hot-drinks','قهوة تركية سنجل','Turkish coffee single',2250,'',{}],
  ['hot-turkish-double','hot-drinks','قهوة تركية دبل','Turkish coffee double',2750,'',{}],
  ['hot-macchiato','hot-drinks','مكياتو','Macchiato',2750,'',{}],

  // ── القهوة المختصة ──────────────────────────────────────────────────────
  ['special-v60','special-coffee','V60','V60',3500,'',{}],
  ['special-french-press','special-coffee','فرنش بريس','French press',2750,'',{}],
  ['special-siphon','special-coffee','سايفون','Siphon',3750,'',{}],

  // ── الأعشاب ─────────────────────────────────────────────────────────────
  ['herb-anise','herbs','يانسون','Anise',1750,'',{}],
  ['herb-mixed','herbs','أعشاب مشكلة','Mixed herbs',1750,'',{}],
  ['herb-green-tea','herbs','شاي أخضر','Green tea',1750,'',{}],
  ['herb-sage','herbs','ميرمية','Sage',1750,'',{}],
  ['herb-chamomile','herbs','بابونج','Chamomile',1750,'',{}],
  ['herb-tea','herbs','شاي','Tea',1750,'',{}],
  ['herb-ginger-lemon-honey','herbs','زنجبيل وليمون وعسل','Ginger, lemon and honey',2750,'',{}],
  ['herb-ginger-milk-honey','herbs','زنجبيل وحليب وعسل','Ginger, milk and honey',2750,'',{}],
  ['herb-karak','herbs','شاي كرك','Karak tea',2500,'',{f:1}],

  // ── الحلويات ────────────────────────────────────────────────────────────
  ['sweet-strawberry-tart','sweets','تارت فراولة','Strawberry tart',4500,'',{}],
  ['sweet-tiramisu','sweets','تيراميسو','Tiramisu',4500,'',{f:1}],
  ['sweet-san-sebastian','sweets','سان سيباستيان','San Sebastian',4500,'',{}],
  ['sweet-chocolate-mousse','sweets','موس شوكولاتة','Chocolate mousse',4500,'',{}],
  ['sweet-raspberry-cheesecake','sweets','تشيزكيك توت العليق','Raspberry cheesecake',4500,'',{}],
  ['sweet-brownies','sweets','براونيز','Brownies',4500,'',{}],
  ['sweet-oreo-cheesecake','sweets','تشيزكيك أوريو','Oreo cheesecake',4500,'',{}],

  // ── المعسل ──────────────────────────────────────────────────────────────
  ['hookah-double-apple-nakhla','hookah','تفاحتين نخلة','Double apple (Nakhla)',5000,'',{f:1}],
  ['hookah-double-apple-mazaya','hookah','تفاحتين مزايا','Double apple (Mazaya)',4200,'',{}],
  ['hookah-lemon-mint','hookah','ليمون ونعنع','Lemon and mint',4200,'',{}],
  ['hookah-watermelon-mint','hookah','بطيخ ونعنع','Watermelon and mint',4200,'',{}],
  ['hookah-blueberry','hookah','توت بلو بيري','Blueberry',4200,'',{}],
  ['hookah-grape','hookah','عنب','Grape',4200,'',{}],
  ['hookah-berry-mint','hookah','توت ونعنع','Berry and mint',4200,'',{}],
  ['hookah-cherry-mint','hookah','كرز ونعنع','Cherry and mint',4200,'',{}],
  ['hookah-mastic','hookah','مسكة','Mastic',4200,'',{}],
  ['hookah-gum-cinnamon','hookah','علكة وقرفة','Gum and cinnamon',4200,'',{}],
  ['hookah-gum-mint','hookah','علكة ونعنع','Gum and mint',4200,'',{}],
  ['hookah-apple-mint','hookah','تفاح ونعنع','Apple and mint',4200,'',{}],
  ['hookah-candy-drops','hookah','كاندي دروبس','Candy drops',4200,'',{}],
  ['hookah-hail-mix','hookah','خلطة المعسل الخاصة','Special hookah mix',4200,'',{f:1}],
  ['hookah-lovely','hookah','لفلي','Lovely',4200,'',{}],
  ['hookah-ice-sweet','hookah','آيس سويت','Ice sweet',4200,'',{}],
  ['hookah-orange-mint','hookah','برتقال ونعنع','Orange and mint',4200,'',{}],

  // ── المشروبات الغازية والمياه ───────────────────────────────────────────
  ['soft-boom-boom','soft-drinks','بوم بوم','Boom Boom',2500,'',{}],
  ['soft-red-bull','soft-drinks','ريد بول','Red Bull',3000,'red-bull',{}],
  ['soft-code-red','soft-drinks','كود ريد','Code Red',2500,'',{}],
  ['soft-perrier','soft-drinks','مياه بيريه','Perrier',2250,'',{}],
  ['soft-water','soft-drinks','ماء','Water',600,'water',{}],
];

/* صور احتياطية لكل قسم — لا يبقى أي صنف بدون صورة */
const FALLBACK = {
  breakfast:'foul', salads:'hail-salad', 'cold-appetizers':'labneh-zaatar',
  'hot-appetizers':'combo-platter', pasta:'pesto-pasta', 'pasta-addons':'pesto-pasta',
  pizza:'hail-pizza', sandwiches:'caesar-sandwich', burgers:'classic-burger',
  fatta:'chicken-cream-pot', soups:'chicken-cream-pot', mains:'beef-steak',
  juices:'mango-juice', smoothies:'strawberry-smoothie', milkshakes:'milkshake',
  mojito:'mojito', 'iced-coffee':'iced-coffee', frappe:'caramel-frappe',
  'iced-tea':'mojito', cocktails:'hail-cocktail', 'hot-drinks':'hot-coffee',
  'special-coffee':'hot-coffee', herbs:'hot-coffee', sweets:'caramel-frappe',
  hookah:'mojito', 'soft-drinks':'red-bull',
};

/* خيارات إضافية حسب نوع الصنف */
const OPTION_SETS = {
  drink: [
    { id:'size', ar:'الحجم', en:'Size', required:true, choices:[
      { id:'regular', ar:'عادي', en:'Regular', delta:0 },
      { id:'large',   ar:'كبير', en:'Large',   delta:750 },
    ]},
    { id:'ice', ar:'الثلج', en:'Ice', choices:[
      { id:'normal', ar:'عادي', en:'Normal', delta:0 },
      { id:'less',   ar:'ثلج قليل', en:'Less ice', delta:0 },
      { id:'none',   ar:'بدون ثلج', en:'No ice', delta:0 },
    ]},
    { id:'sugar', ar:'السكر', en:'Sugar', choices:[
      { id:'normal', ar:'عادي', en:'Normal', delta:0 },
      { id:'light',  ar:'سكر خفيف', en:'Light', delta:0 },
      { id:'none',   ar:'بدون سكر', en:'No sugar', delta:0 },
    ]},
  ],
  hotdrink: [
    { id:'milk', ar:'الحليب', en:'Milk', choices:[
      { id:'full', ar:'حليب كامل', en:'Full fat', delta:0 },
      { id:'skim', ar:'حليب خفيف', en:'Skim', delta:0 },
      { id:'oat',  ar:'حليب شوفان', en:'Oat milk', delta:500 },
    ]},
    { id:'shot', ar:'جرعة إسبريسو', en:'Espresso shot', choices:[
      { id:'single', ar:'سنجل', en:'Single', delta:0 },
      { id:'double', ar:'دبل', en:'Double', delta:500 },
    ]},
  ],
  grill: [
    { id:'doneness', ar:'درجة النضج', en:'Doneness', required:true, choices:[
      { id:'medium-rare', ar:'ميديم رير', en:'Medium rare', delta:0 },
      { id:'medium',      ar:'ميديم', en:'Medium', delta:0 },
      { id:'well',        ar:'ويل دن', en:'Well done', delta:0 },
    ]},
    { id:'side', ar:'الطبق الجانبي', en:'Side', choices:[
      { id:'fries',  ar:'بطاطا مقلية', en:'Fries', delta:0 },
      { id:'rice',   ar:'أرز', en:'Rice', delta:0 },
      { id:'salad',  ar:'سلطة', en:'Salad', delta:500 },
    ]},
  ],
  food: [
    { id:'spice', ar:'درجة الحرارة', en:'Spice level', choices:[
      { id:'mild',   ar:'عادي', en:'Mild', delta:0 },
      { id:'spicy',  ar:'حار', en:'Spicy', delta:0 },
      { id:'xspicy', ar:'حار جداً', en:'Extra spicy', delta:0 },
    ]},
    { id:'extra', ar:'إضافات', en:'Extras', multi:true, choices:[
      { id:'cheese', ar:'جبنة إضافية', en:'Extra cheese', delta:750 },
      { id:'sauce',  ar:'صوص إضافي', en:'Extra sauce', delta:250 },
    ]},
  ],
  hookah: [
    { id:'head', ar:'نوع الرأس', en:'Head', choices:[
      { id:'clay',   ar:'رأس فخار', en:'Clay', delta:0 },
      { id:'fruit',  ar:'رأس فواكه', en:'Fruit head', delta:2000 },
    ]},
  ],
  none: [],
};

const OPTION_MAP = {
  juices:'drink', smoothies:'drink', milkshakes:'drink', mojito:'drink',
  'iced-coffee':'drink', frappe:'drink', 'iced-tea':'drink', cocktails:'drink',
  'hot-drinks':'hotdrink', 'special-coffee':'hotdrink', herbs:'hotdrink',
  mains:'grill', burgers:'grill',
  breakfast:'food', pasta:'food', pizza:'food', sandwiches:'food',
  'hot-appetizers':'food', fatta:'food',
  hookah:'hookah',
  'soft-drinks':'none', sweets:'none', salads:'none', 'cold-appetizers':'none',
  soups:'none', 'pasta-addons':'none',
};

/* ── بناء الكائنات النهائية ────────────────────────────────────────────── */

export const categories = CATS.map(([id, ar, en, station, prep, icon], i) => ({
  id, ar, en, station, prep, icon, order: i + 1, active: true,
}));

export const items = ITEMS.map(([id, categoryId, ar, en, price, image, flags = {}]) => {
  const cat = categories.find((c) => c.id === categoryId);
  return {
    id,
    categoryId,
    ar,
    en,
    price,
    image: `assets/menu/${image || FALLBACK[categoryId] || 'hail-salad'}.webp`,
    hasOwnPhoto: Boolean(image),
    station: cat ? cat.station : 'hot',
    prep: cat ? cat.prep : 10,
    featured: Boolean(flags.f),
    ambiguous: Boolean(flags.a),
    noteAr: flags.n || '',
    noteEn: flags.ne || '',
    tags: flags.t || [],
    options: OPTION_SETS[OPTION_MAP[categoryId] || 'none'] || [],
    available: true,
    /* مؤشرات تشغيلية يعدّلها المدير */
    cost: Math.round(price * 0.34),
    popularity: 0,
  };
});

export const byId = new Map(items.map((it) => [it.id, it]));
export const categoryById = new Map(categories.map((c) => [c.id, c]));

export const MENU_STATS = {
  categories: categories.length,
  items: items.length,
  photos: items.filter((i) => i.hasOwnPhoto).length,
  featured: items.filter((i) => i.featured).length,
};

/* ── معلومات الفرع الرسمية ─────────────────────────────────────────────── */
export const BRANCH = {
  id: 'main-branch',
  ar: 'مقهى ومطعم النخبة — الفرع الرئيسي',
  en: 'Gourmet Cafe & Restaurant — Main Branch',
  addressAr: 'شارع الفخامة، العاصمة',
  addressEn: 'Luxury Street, City Center',
  phone: '+962790000000',
  phoneDisplay: '+962 79 000 0000',
  map: 'https://maps.google.com',
  instagram: 'https://instagram.com',
  facebook: 'https://facebook.com',
  hours: [
    { ar: 'الأحد',    en: 'Sunday',    open: '10:00', close: '00:00' },
    { ar: 'الاثنين',  en: 'Monday',    open: '10:00', close: '00:00' },
    { ar: 'الثلاثاء', en: 'Tuesday',   open: '10:00', close: '00:00' },
    { ar: 'الأربعاء', en: 'Wednesday', open: '10:00', close: '00:00' },
    { ar: 'الخميس',   en: 'Thursday',  open: '10:00', close: '00:00' },
    { ar: 'الجمعة',   en: 'Friday',    open: '14:00', close: '00:00' },
    { ar: 'السبت',    en: 'Saturday',  open: '10:00', close: '00:00' },
  ],
};
