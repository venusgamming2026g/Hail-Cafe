"use client";

import {
  ArrowLeft,
  Bell,
  Check,
  ChefHat,
  ChevronLeft,
  CircleHelp,
  Clock3,
  Coffee,
  Droplets,
  ExternalLink,
  Facebook,
  Instagram,
  Languages,
  LoaderCircle,
  MapPin,
  Minus,
  PackageCheck,
  Plus,
  ReceiptText,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  UserRound,
  Utensils,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  formatJod,
  getItemImage,
  menuCategories as officialCategories,
  menuItems as officialItems,
  type MenuCategory,
  type MenuItem,
} from "../lib/menu-data";
import {
  officialBranch,
  officialMapUrl,
  officialMenuUrl,
  officialSocial,
  type ServiceRequestType,
} from "../lib/restaurant";

type Locale = "ar" | "en";
type CartLine = { itemId: string; quantity: number };
type ToastState = { kind: "success" | "error" | "info"; message: string };
type SessionSnapshot = {
  session: {
    id: string;
    token: string;
    tableNumber: number;
    status: string;
    subtotalMils: number;
    taxMils: number;
    totalMils: number;
  };
  orders: Array<{
    id: string;
    publicId: string;
    status: string;
    roundNumber: number;
    subtotalMils: number;
    taxMils: number;
    totalMils: number;
    createdAt: string;
    items: Array<{
      id: string;
      nameAr: string;
      nameEn: string;
      quantity: number;
      status: string;
    }>;
  }>;
  serviceRequests: Array<{
    id: string;
    requestType: string;
    status: string;
    createdAt: string;
  }>;
};

type OfflineEntry = {
  id: string;
  url: string;
  body: unknown;
  createdAt: string;
};

const copy = {
  ar: {
    all: "الكل",
    search: "ابحث عن طبق أو مشروب",
    add: "أضف",
    askStaff: "اسأل الموظف",
    empty: "لم نجد صنفًا مطابقًا. جرّب كلمة أخرى.",
    cart: "سلتك",
    checkout: "أرسل الطلب",
    takeaway: "سفري",
    dineIn: "داخل المطعم",
    table: "رقم الطاولة",
    startSession: "ابدأ جلسة الطاولة",
    service: "خدمة الطاولة",
    session: "جلسة الطاولة",
    round: "جولة",
    subtotal: "المجموع قبل الضريبة",
    tax: "ضريبة المبيعات 7%",
    total: "الإجمالي",
    name: "الاسم",
    phone: "رقم الهاتف",
    note: "ملاحظة للمطبخ",
    status: "الحالة",
    close: "إغلاق",
    remove: "حذف",
    menu: "المنيو",
    location: "الموقع",
    officialMenu: "المنيو الرسمي PDF",
    orderReady: "تم إرسال الطلب إلى المطبخ.",
    queued: "الاتصال ضعيف. حفظنا الطلب وسيُرسل تلقائيًا عند عودة الشبكة.",
    sessionReady: "جلسة الطاولة جاهزة.",
  },
  en: {
    all: "All",
    search: "Search dishes and drinks",
    add: "Add",
    askStaff: "Ask staff",
    empty: "No matching item. Try another search.",
    cart: "Your cart",
    checkout: "Send order",
    takeaway: "Takeaway",
    dineIn: "Dine in",
    table: "Table number",
    startSession: "Start table session",
    service: "Table service",
    session: "Table session",
    round: "Round",
    subtotal: "Subtotal",
    tax: "7% sales tax",
    total: "Total",
    name: "Name",
    phone: "Phone",
    note: "Kitchen note",
    status: "Status",
    close: "Close",
    remove: "Remove",
    menu: "Menu",
    location: "Location",
    officialMenu: "Official PDF menu",
    orderReady: "Your order was sent to the kitchen.",
    queued: "Connection is weak. We saved this request and will retry online.",
    sessionReady: "Your table session is ready.",
  },
} as const;

const orderStatusLabel: Record<Locale, Record<string, string>> = {
  ar: {
    new: "جديد",
    preparing: "قيد التحضير",
    ready: "جاهز",
    served: "تم التقديم",
    cancelled: "ملغي",
  },
  en: {
    new: "New",
    preparing: "Preparing",
    ready: "Ready",
    served: "Served",
    cancelled: "Cancelled",
  },
};

const serviceStatusLabel: Record<Locale, Record<string, string>> = {
  ar: {
    new: "تم الاستلام",
    acknowledged: "أكّد الموظف",
    on_way: "الموظف بالطريق",
    completed: "تمت الخدمة",
    cancelled: "ملغي",
  },
  en: {
    new: "Received",
    acknowledged: "Acknowledged",
    on_way: "Staff on the way",
    completed: "Completed",
    cancelled: "Cancelled",
  },
};

const serviceOptions: Array<{
  type: ServiceRequestType;
  ar: string;
  en: string;
  icon: typeof Bell;
}> = [
  { type: "staff", ar: "طلب موظف", en: "Call staff", icon: UserRound },
  { type: "water", ar: "ماء", en: "Water", icon: Droplets },
  { type: "cutlery", ar: "أدوات", en: "Cutlery", icon: Utensils },
  { type: "cleaning", ar: "تنظيف", en: "Cleaning", icon: Sparkles },
  { type: "bill", ar: "طلب الحساب", en: "Ask for bill", icon: ReceiptText },
];

function normalizeMenuPayload(payload: {
  categories?: Array<Record<string, unknown>>;
  items?: Array<Record<string, unknown>>;
}) {
  const categories: MenuCategory[] = (payload.categories ?? []).map(
    (entry) => ({
      id: String(entry.id ?? ""),
      nameAr: String(entry.nameAr ?? entry.name_ar ?? ""),
      nameEn: String(entry.nameEn ?? entry.name_en ?? ""),
      order: Number(entry.sortOrder ?? entry.sort_order ?? 0),
    }),
  );
  const items: MenuItem[] = (payload.items ?? []).map((entry) => ({
    id: String(entry.id ?? ""),
    categoryId: String(entry.categoryId ?? entry.category_id ?? ""),
    nameAr: String(entry.nameAr ?? entry.name_ar ?? ""),
    nameEn: String(entry.nameEn ?? entry.name_en ?? ""),
    priceMils: Number(entry.priceMils ?? entry.price_mils ?? 0),
    image: String(entry.imageUrl ?? entry.image_url ?? entry.image ?? "") || undefined,
    noteAr: String(entry.noteAr ?? entry.note_ar ?? "") || undefined,
    noteEn: String(entry.noteEn ?? entry.note_en ?? "") || undefined,
    sourceAmbiguous: Boolean(
      entry.sourceAmbiguous ?? entry.source_ambiguous,
    ),
    available: Boolean(entry.available),
    featured: Boolean(entry.featured),
  }));
  return {
    categories: categories.length ? categories : officialCategories,
    items: items.length ? items : officialItems,
  };
}

function loadCart(): CartLine[] {
  try {
    return JSON.parse(localStorage.getItem("hail-cart-v1") ?? "[]");
  } catch {
    return [];
  }
}

function loadOfflineQueue(): OfflineEntry[] {
  try {
    return JSON.parse(localStorage.getItem("hail-offline-v1") ?? "[]");
  } catch {
    return [];
  }
}

export function CustomerApp() {
  const [locale, setLocale] = useState<Locale>("ar");
  const [categories, setCategories] =
    useState<MenuCategory[]>(officialCategories);
  const [items, setItems] = useState<MenuItem[]>(officialItems);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [serviceOpen, setServiceOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [tablePromptOpen, setTablePromptOpen] = useState(false);
  const [orderType, setOrderType] = useState<"takeaway" | "dine_in">(
    "takeaway",
  );
  const [tableNumber, setTableNumber] = useState("");
  const [session, setSession] = useState<SessionSnapshot | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [online, setOnline] = useState(true);
  const [queuedCount, setQueuedCount] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const text = copy[locale];
  const direction = locale === "ar" ? "rtl" : "ltr";

  const showToast = useCallback((next: ToastState) => {
    setToast(next);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4800);
  }, []);

  const refreshSession = useCallback(
    async (token: string) => {
      try {
        const response = await fetch(
          `/api/session?token=${encodeURIComponent(token)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const snapshot = (await response.json()) as SessionSnapshot;
        setSession(snapshot);
      } catch {
        // The last known table state stays visible during weak connectivity.
      }
    },
    [],
  );

  const flushQueue = useCallback(async () => {
    const entries = loadOfflineQueue();
    if (!entries.length) {
      setQueuedCount(0);
      return;
    }
    const remaining: OfflineEntry[] = [];
    let rejected = 0;
    for (const entry of entries) {
      try {
        const response = await fetch(entry.url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(entry.body),
        });
        if (!response.ok) {
          if (response.status >= 500) remaining.push(entry);
          else rejected += 1;
        }
      } catch {
        remaining.push(entry);
      }
    }
    localStorage.setItem("hail-offline-v1", JSON.stringify(remaining));
    setQueuedCount(remaining.length);
    if (rejected) {
      showToast({
        kind: "error",
        message:
          locale === "ar"
            ? `تعذر إرسال ${rejected} طلب محفوظ بعد التحقق منه. افتح السلة وحاول مجددًا.`
            : `${rejected} saved request could not be validated. Reopen the cart and try again.`,
      });
    }
  }, [locale, showToast]);

  useEffect(() => {
    let cancelled = false;
    async function initialize() {
      await Promise.resolve();
      if (cancelled) return;
      setCart(loadCart());
      setQueuedCount(loadOfflineQueue().length);
      setOnline(navigator.onLine);
      const params = new URLSearchParams(window.location.search);
      const table = Number(params.get("table"));
      if (Number.isInteger(table) && table >= 1 && table <= 80) {
        setTableNumber(String(table));
        setOrderType("dine_in");
        const saved = localStorage.getItem(`hail-session-table-${table}`);
        if (saved) void refreshSession(saved);
        else {
          setTablePromptOpen(true);
        }
      }
      try {
        const response = await fetch("/api/menu", { cache: "no-store" });
        const payload = (await response.json()) as {
          categories?: Array<Record<string, unknown>>;
          items?: Array<Record<string, unknown>>;
        };
        if (cancelled) return;
        const normalized = normalizeMenuPayload(payload);
        setCategories(normalized.categories);
        setItems(normalized.items);
      } catch {
        // The complete official menu is bundled as the resilient fallback.
      }
    }
    void initialize();
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js");
    }
    const onOnline = () => {
      setOnline(true);
      void flushQueue();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushQueue, refreshSession]);

  useEffect(() => {
    localStorage.setItem("hail-cart-v1", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!session?.session.token) return;
    const timer = setInterval(
      () => void refreshSession(session.session.token),
      4500,
    );
    return () => clearInterval(timer);
  }, [refreshSession, session?.session.token]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const itemMap = useMemo(
    () => new Map(items.map((entry) => [entry.id, entry])),
    [items],
  );

  const cartLines = useMemo(
    () =>
      cart
        .map((line) => ({ ...line, item: itemMap.get(line.itemId) }))
        .filter(
          (line): line is CartLine & { item: MenuItem } => Boolean(line.item),
        ),
    [cart, itemMap],
  );

  const subtotalMils = cartLines.reduce(
    (sum, line) => sum + line.item.priceMils * line.quantity,
    0,
  );
  const taxMils = Math.round(subtotalMils * 0.07);
  const totalMils = subtotalMils + taxMils;
  const cartQuantity = cart.reduce((sum, line) => sum + line.quantity, 0);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return items.filter((entry) => {
      const categoryMatches =
        activeCategory === "all" || entry.categoryId === activeCategory;
      const searchMatches =
        !query ||
        `${entry.nameAr} ${entry.nameEn ?? ""}`
          .toLocaleLowerCase()
          .includes(query);
      return categoryMatches && searchMatches;
    });
  }, [activeCategory, items, search]);

  function updateQuantity(itemId: string, delta: number) {
    setCart((current) => {
      const line = current.find((entry) => entry.itemId === itemId);
      if (!line && delta > 0) {
        return [...current, { itemId, quantity: 1 }];
      }
      return current
        .map((entry) =>
          entry.itemId === itemId
            ? {
                ...entry,
                quantity: Math.max(0, Math.min(20, entry.quantity + delta)),
              }
            : entry,
        )
        .filter((entry) => entry.quantity > 0);
    });
  }

  async function startTableSession() {
    const number = Number(tableNumber);
    if (!Number.isInteger(number) || number < 1 || number > 80) {
      showToast({
        kind: "error",
        message:
          locale === "ar"
            ? "أدخل رقم طاولة صحيحًا بين 1 و80."
            : "Enter a table number from 1 to 80.",
      });
      return;
    }
    setLoading("session");
    try {
      const response = await fetch("/api/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          branchId: officialBranch.id,
          tableNumber: number,
        }),
      });
      const payload = (await response.json()) as { error?: string } & SessionSnapshot;
      if (!response.ok) throw new Error(payload.error);
      const snapshot = payload as SessionSnapshot;
      setSession(snapshot);
      localStorage.setItem(
        `hail-session-table-${number}`,
        snapshot.session.token,
      );
      setTablePromptOpen(false);
      setOrderType("dine_in");
      showToast({ kind: "success", message: text.sessionReady });
    } catch (error) {
      showToast({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : locale === "ar"
              ? "تعذر بدء جلسة الطاولة."
              : "Could not start the table session.",
      });
    } finally {
      setLoading(null);
    }
  }

  function queueOffline(url: string, body: unknown) {
    const entries = loadOfflineQueue();
    entries.push({
      id: crypto.randomUUID(),
      url,
      body,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("hail-offline-v1", JSON.stringify(entries));
    setQueuedCount(entries.length);
  }

  async function submitOrder() {
    if (!cartLines.length) return;
    if (orderType === "dine_in" && !session?.session.token) {
      setTablePromptOpen(true);
      return;
    }
    const body = {
      idempotencyKey: crypto.randomUUID(),
      branchId: officialBranch.id,
      orderType,
      tableNumber:
        orderType === "dine_in" ? session?.session.tableNumber : undefined,
      sessionToken:
        orderType === "dine_in" ? session?.session.token : undefined,
      customerName,
      phone,
      note: orderNote,
      items: cartLines.map((line) => ({
        id: line.itemId,
        quantity: line.quantity,
      })),
    };
    setLoading("order");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string; session?: SessionSnapshot };
      if (!response.ok) throw new Error(payload.error);
      setCart([]);
      setOrderNote("");
      setCartOpen(false);
      if (payload.session) setSession(payload.session);
      showToast({ kind: "success", message: text.orderReady });
      if (orderType === "dine_in") setSessionOpen(true);
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        queueOffline("/api/orders", body);
        setCart([]);
        setCartOpen(false);
        showToast({ kind: "info", message: text.queued });
      } else {
        showToast({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : locale === "ar"
                ? "تعذر إرسال الطلب."
                : "Could not send the order.",
        });
      }
    } finally {
      setLoading(null);
    }
  }

  async function requestService(requestType: ServiceRequestType) {
    if (!session?.session.token) {
      setTablePromptOpen(true);
      return;
    }
    const body = {
      idempotencyKey: crypto.randomUUID(),
      sessionToken: session.session.token,
      requestType,
    };
    setLoading(`service-${requestType}`);
    try {
      const response = await fetch("/api/service", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as {
        error?: string;
        session?: SessionSnapshot;
        message?: string;
      };
      if (!response.ok) throw new Error(payload.error);
      if (payload.session) setSession(payload.session);
      showToast({
        kind: "success",
        message:
          payload.message ??
          (locale === "ar"
            ? "وصل طلب الخدمة إلى فريق الصالة."
            : "The floor team received your request."),
      });
    } catch (error) {
      if (!navigator.onLine || error instanceof TypeError) {
        queueOffline("/api/service", body);
        showToast({ kind: "info", message: text.queued });
      } else {
        showToast({
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : locale === "ar"
                ? "تعذر إرسال طلب الخدمة."
                : "Could not request service.",
        });
      }
    } finally {
      setLoading(null);
    }
  }

  function scrollToMenu() {
    document.getElementById("menu")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <div className="customer-shell" dir={direction}>
      <a className="skip-link" href="#main">
        {locale === "ar" ? "انتقل إلى المحتوى" : "Skip to content"}
      </a>

      <header className="site-header">
        <a href="#" className="brand-link" aria-label="Hail Cafe">
          <img src="/hail-logo.png" width="70" height="70" alt="شعار هيل كافيه" />
        </a>
        <nav className="desktop-nav" aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
          <button type="button" onClick={scrollToMenu}>
            {text.menu}
          </button>
          <a href={officialMapUrl} target="_blank" rel="noreferrer">
            {text.location}
          </a>
          <a href={officialMenuUrl} target="_blank" rel="noreferrer">
            {text.officialMenu}
          </a>
        </nav>
        <div className="header-actions">
          {!online && (
            <span className="offline-pill" role="status">
              <WifiOff size={16} aria-hidden="true" />
              {locale === "ar" ? "دون اتصال" : "Offline"}
            </span>
          )}
          {queuedCount > 0 && (
            <button
              type="button"
              className="queue-pill"
              onClick={() => void flushQueue()}
              aria-label={
                locale === "ar"
                  ? `${queuedCount} طلبات بانتظار الإرسال`
                  : `${queuedCount} requests awaiting sync`
              }
            >
              {queuedCount}
            </button>
          )}
          <button
            className="icon-button"
            type="button"
            onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
          >
            <Languages size={20} aria-hidden="true" />
            <span>{locale === "ar" ? "EN" : "ع"}</span>
          </button>
        </div>
      </header>

      <main id="main">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="diamond" aria-hidden="true" />
              {locale === "ar"
                ? "مطعم وكافيه هيل · إربد"
                : "Hail Restaurant & Cafe · Irbid"}
            </p>
            <h1>
              {locale === "ar" ? (
                <>
                  من المطبخ للطاولة،
                  <br />
                  <span>الطلب ما يضيع.</span>
                </>
              ) : (
                <>
                  From kitchen to table,
                  <br />
                  <span>every order stays visible.</span>
                </>
              )}
            </h1>
            <p className="hero-lead">
              {locale === "ar"
                ? "منيو حقيقي، طلبات بجولات، خدمة طاولة فورية، وحالة واضحة من أول كبسة حتى التقديم."
                : "A real menu, multi-round ordering, instant table service, and a clear status from tap to serving."}
            </p>
            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={scrollToMenu}>
                <ShoppingBag size={20} aria-hidden="true" />
                {locale === "ar" ? "ابدأ طلبك" : "Start an order"}
              </button>
              <button
                className="secondary-button"
                type="button"
                onClick={() => {
                  setOrderType("dine_in");
                  setTablePromptOpen(true);
                }}
              >
                <Utensils size={20} aria-hidden="true" />
                {locale === "ar" ? "أنا على طاولة" : "I'm at a table"}
              </button>
            </div>
            <div className="hero-facts">
              <a href={officialMapUrl} target="_blank" rel="noreferrer">
                <MapPin size={19} aria-hidden="true" />
                <span>
                  <strong>{locale === "ar" ? "الموقع" : "Location"}</strong>
                  {locale === "ar" ? "إربد سيتي سنتر" : "Irbid City Center"}
                </span>
              </a>
              <span>
                <Clock3 size={19} aria-hidden="true" />
                <span>
                  <strong>{locale === "ar" ? "الدوام" : "Hours"}</strong>
                  {locale === "ar" ? "10 ص - 12 ص" : "10 am - 12 am"}
                </span>
              </span>
            </div>
          </div>

          <div className="hero-hatch" aria-label={locale === "ar" ? "أطباق حقيقية من منيو هيل" : "Real dishes from Hail's menu"}>
            <div className="hatch-arch" aria-hidden="true">
              <img
                className="hero-dish hero-dish-main"
                src="/menu/combo-platter.webp"
                width="460"
                height="320"
                alt=""
              />
              <img
                className="hero-dish hero-dish-side"
                src="/menu/mango-juice.webp"
                width="180"
                height="260"
                alt=""
              />
              <span className="hatch-label">
                {locale === "ar" ? "صور المنيو الرسمية" : "Official menu photography"}
              </span>
            </div>
            <div className="double-diamond" aria-hidden="true">
              <i />
              <i />
            </div>
          </div>
        </section>

        <section className="service-strip" aria-label={locale === "ar" ? "مراحل الطلب" : "Order stages"}>
          {[
            [ShoppingBag, "اختر", "Choose"],
            [ChefHat, "يُحضّر", "Prepare"],
            [PackageCheck, "جاهز", "Ready"],
            [Utensils, "يُقدّم", "Serve"],
          ].map(([Icon, ar, en], index) => {
            const StageIcon = Icon as typeof ShoppingBag;
            return (
              <div key={String(ar)} className="service-stage">
                <span>{index + 1}</span>
                <StageIcon size={21} aria-hidden="true" />
                <strong>{locale === "ar" ? String(ar) : String(en)}</strong>
              </div>
            );
          })}
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <span className="diamond" aria-hidden="true" />
                {locale === "ar" ? "المنيو الرسمي" : "Official menu"}
              </p>
              <h2>{locale === "ar" ? "اختَر على مزاجك" : "Pick what feels right"}</h2>
            </div>
            <p>
              {locale === "ar"
                ? "الأسعار بالدينار الأردني، وتُضاف ضريبة مبيعات 7% كما هو مذكور في المصدر الرسمي."
                : "Prices are in Jordanian dinars. The official source states that 7% sales tax is added."}
            </p>
          </div>

          <div className="menu-toolbar">
            <div className="search-box">
              <Search size={20} aria-hidden="true" />
              <label className="sr-only" htmlFor="menu-search">
                {text.search}
              </label>
              <input
                id="menu-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.search}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label={text.close}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              )}
            </div>
            <a
              className="pdf-link"
              href={officialMenuUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ReceiptText size={19} aria-hidden="true" />
              {text.officialMenu}
              <ExternalLink size={15} aria-hidden="true" />
            </a>
          </div>

          <div className="category-rail" role="tablist" aria-label={locale === "ar" ? "تصنيفات المنيو" : "Menu categories"}>
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === "all"}
              className={activeCategory === "all" ? "active" : ""}
              onClick={() => setActiveCategory("all")}
            >
              {text.all}
            </button>
            {categories.map((entry) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === entry.id}
                className={activeCategory === entry.id ? "active" : ""}
                key={entry.id}
                onClick={() => setActiveCategory(entry.id)}
              >
                {locale === "ar" ? entry.nameAr : entry.nameEn}
              </button>
            ))}
          </div>

          {visibleItems.length ? (
            <div className="menu-grid">
              {visibleItems.map((entry) => {
                const quantity =
                  cart.find((line) => line.itemId === entry.id)?.quantity ?? 0;
                const imageUrl = getItemImage(entry);
                return (
                  <article
                    className={`menu-card ${imageUrl ? "with-image" : ""} ${!entry.available ? "unavailable" : ""}`}
                    key={entry.id}
                  >
                    {imageUrl ? (
                      <div className="menu-card-image">
                        <img
                          src={imageUrl}
                          width="280"
                          height="220"
                          loading="lazy"
                          alt={locale === "ar" ? entry.nameAr : entry.nameEn || entry.nameAr}
                        />
                      </div>
                    ) : (
                      <div className="menu-card-mark" aria-hidden="true">
                        <span />
                        <span />
                      </div>
                    )}
                    <div className="menu-card-body">
                      <div>
                        <p className="menu-card-category">
                          {locale === "ar"
                            ? categories.find(
                                (category) => category.id === entry.categoryId,
                              )?.nameAr
                            : categories.find(
                                (category) => category.id === entry.categoryId,
                              )?.nameEn}
                        </p>
                        <h3>
                          {locale === "ar"
                            ? entry.nameAr
                            : entry.nameEn || entry.nameAr}
                        </h3>
                        {(entry.noteAr || entry.sourceAmbiguous) && (
                          <p className="menu-card-note">
                            <CircleHelp size={15} aria-hidden="true" />
                            {locale === "ar"
                              ? entry.noteAr
                              : entry.noteEn || entry.noteAr}
                          </p>
                        )}
                      </div>
                      <div className="menu-card-footer">
                        <strong className="price">
                          {formatJod(entry.priceMils, locale === "ar" ? "ar-JO" : "en-JO")}
                          <small>{locale === "ar" ? " د.أ" : " JD"}</small>
                        </strong>
                        {entry.available && !entry.sourceAmbiguous ? (
                          quantity ? (
                            <div className="quantity-control" aria-label={`${entry.nameAr}: ${quantity}`}>
                              <button
                                type="button"
                                onClick={() => updateQuantity(entry.id, -1)}
                                aria-label={`${text.remove} ${entry.nameAr}`}
                              >
                                <Minus size={17} aria-hidden="true" />
                              </button>
                              <span aria-live="polite">{quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(entry.id, 1)}
                                aria-label={`${text.add} ${entry.nameAr}`}
                              >
                                <Plus size={17} aria-hidden="true" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="add-button"
                              onClick={() => updateQuantity(entry.id, 1)}
                            >
                              <Plus size={18} aria-hidden="true" />
                              {text.add}
                            </button>
                          )
                        ) : (
                          <span className="ask-staff">{text.askStaff}</span>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Search size={32} aria-hidden="true" />
              <p>{text.empty}</p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("all");
                }}
              >
                {locale === "ar" ? "اعرض كل المنيو" : "Show the full menu"}
              </button>
            </div>
          )}
        </section>

        <section className="visit-section" id="visit">
          <div className="visit-card">
            <p className="eyebrow">
              <MapPin size={17} aria-hidden="true" />
              {locale === "ar" ? "الفرع المؤكد" : "Confirmed branch"}
            </p>
            <h2>
              {locale === "ar"
                ? "إربد سيتي سنتر"
                : "Irbid City Center"}
            </h2>
            <p>
              {locale === "ar"
                ? officialBranch.addressAr
                : officialBranch.addressEn}
            </p>
            <div className="visit-actions">
              <a
                className="primary-button"
                href={officialMapUrl}
                target="_blank"
                rel="noreferrer"
              >
                <MapPin size={19} aria-hidden="true" />
                {locale === "ar" ? "افتح الخريطة" : "Open map"}
              </a>
              <a
                className="secondary-button"
                href={`tel:${officialBranch.phone}`}
              >
                {officialBranch.phoneDisplay}
              </a>
            </div>
          </div>
          <div className="hours-card">
            <div className="hours-title">
              <Clock3 size={22} aria-hidden="true" />
              <h3>{locale === "ar" ? "أوقات العمل" : "Opening hours"}</h3>
            </div>
            <ul>
              {officialBranch.hours.map((entry) => (
                <li key={entry.dayEn}>
                  <span>{locale === "ar" ? entry.dayAr : entry.dayEn}</span>
                  <strong>
                    {entry.opens === "14:00"
                      ? locale === "ar"
                        ? "2 م - 12 ص"
                        : "2 pm - 12 am"
                      : locale === "ar"
                        ? "10 ص - 12 ص"
                        : "10 am - 12 am"}
                  </strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <img src="/hail-logo.png" width="86" height="86" alt="" />
        <div>
          <strong>{locale === "ar" ? "مطعم وكافيه هيل" : "Hail Restaurant & Cafe"}</strong>
          <p>{locale === "ar" ? "إربد سيتي سنتر · الأردن" : "Irbid City Center · Jordan"}</p>
        </div>
        <div className="social-links">
          <a href={officialSocial.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">
            <Instagram size={21} aria-hidden="true" />
          </a>
          <a href={officialSocial.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">
            <Facebook size={21} aria-hidden="true" />
          </a>
          <a href="/ops" className="staff-link">
            {locale === "ar" ? "دخول الطاقم" : "Staff access"}
          </a>
        </div>
      </footer>

      {cartQuantity > 0 && (
        <button
          className="cart-dock"
          type="button"
          onClick={() => setCartOpen(true)}
          aria-label={`${text.cart}: ${cartQuantity}`}
        >
          <span className="cart-count">{cartQuantity}</span>
          <ShoppingBag size={21} aria-hidden="true" />
          <strong>{text.cart}</strong>
          <span>
            {formatJod(totalMils, locale === "ar" ? "ar-JO" : "en-JO")}{" "}
            {locale === "ar" ? "د.أ" : "JD"}
          </span>
        </button>
      )}

      {session && (
        <div className="table-dock">
          <button
            type="button"
            onClick={() => setServiceOpen(true)}
            aria-label={text.service}
          >
            <Bell size={20} aria-hidden="true" />
            {text.service}
          </button>
          <button
            type="button"
            onClick={() => setSessionOpen(true)}
            aria-label={text.session}
          >
            <ReceiptText size={20} aria-hidden="true" />
            {locale === "ar"
              ? `طاولة ${session.session.tableNumber}`
              : `Table ${session.session.tableNumber}`}
          </button>
        </div>
      )}

      {cartOpen && (
        <ModalShell title={text.cart} onClose={() => setCartOpen(false)} locale={locale}>
          <div className="cart-sheet">
            <div className="order-type-switch" role="radiogroup" aria-label={locale === "ar" ? "نوع الطلب" : "Order type"}>
              <button
                type="button"
                role="radio"
                aria-checked={orderType === "takeaway"}
                className={orderType === "takeaway" ? "active" : ""}
                onClick={() => setOrderType("takeaway")}
              >
                <ShoppingBag size={19} aria-hidden="true" />
                {text.takeaway}
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={orderType === "dine_in"}
                className={orderType === "dine_in" ? "active" : ""}
                onClick={() => {
                  setOrderType("dine_in");
                  if (!session) setTablePromptOpen(true);
                }}
              >
                <Utensils size={19} aria-hidden="true" />
                {text.dineIn}
              </button>
            </div>

            {orderType === "dine_in" && session && (
              <div className="table-confirmation">
                <Check size={18} aria-hidden="true" />
                {locale === "ar"
                  ? `سيُضاف الطلب إلى جلسة الطاولة ${session.session.tableNumber}`
                  : `This order will join table ${session.session.tableNumber}`}
              </div>
            )}

            <div className="cart-lines">
              {cartLines.map((line) => (
                <div className="cart-line" key={line.itemId}>
                  {getItemImage(line.item) ? (
                    <img src={getItemImage(line.item)} width="72" height="72" alt="" />
                  ) : (
                    <span className="cart-line-placeholder">
                      <Coffee size={22} aria-hidden="true" />
                    </span>
                  )}
                  <div>
                    <strong>
                      {locale === "ar"
                        ? line.item.nameAr
                        : line.item.nameEn || line.item.nameAr}
                    </strong>
                    <span>
                      {formatJod(
                        line.item.priceMils * line.quantity,
                        locale === "ar" ? "ar-JO" : "en-JO",
                      )}{" "}
                      {locale === "ar" ? "د.أ" : "JD"}
                    </span>
                  </div>
                  <div className="quantity-control">
                    <button type="button" onClick={() => updateQuantity(line.itemId, -1)} aria-label={text.remove}>
                      {line.quantity === 1 ? <Trash2 size={16} aria-hidden="true" /> : <Minus size={16} aria-hidden="true" />}
                    </button>
                    <span>{line.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(line.itemId, 1)} aria-label={text.add}>
                      <Plus size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {orderType === "takeaway" && (
              <div className="form-grid">
                <label>
                  <span>{text.name}</span>
                  <input value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" />
                </label>
                <label>
                  <span>{text.phone}</span>
                  <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" inputMode="tel" />
                </label>
              </div>
            )}
            <label className="note-field">
              <span>{text.note}</span>
              <textarea value={orderNote} onChange={(event) => setOrderNote(event.target.value)} maxLength={240} rows={2} />
            </label>

            <div className="totals">
              <p><span>{text.subtotal}</span><strong>{formatJod(subtotalMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong></p>
              <p><span>{text.tax}</span><strong>{formatJod(taxMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong></p>
              <p className="grand-total"><span>{text.total}</span><strong>{formatJod(totalMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong></p>
            </div>
            <button className="primary-button full-button" type="button" onClick={() => void submitOrder()} disabled={loading === "order"}>
              {loading === "order" ? <LoaderCircle className="spin" size={20} aria-hidden="true" /> : <ChevronLeft size={20} aria-hidden="true" />}
              {text.checkout}
            </button>
          </div>
        </ModalShell>
      )}

      {tablePromptOpen && (
        <ModalShell title={text.startSession} onClose={() => setTablePromptOpen(false)} locale={locale} compact>
          <div className="table-start-sheet">
            <div className="table-number-visual" aria-hidden="true">
              <span>{tableNumber || "—"}</span>
              <small>{locale === "ar" ? "طاولة" : "TABLE"}</small>
            </div>
            <p>
              {locale === "ar"
                ? "أدخل الرقم المثبّت على طاولتك. سيجمع النظام كل جولات الطلب في حساب واحد."
                : "Enter the number shown on your table. Every order round will stay in one session."}
            </p>
            <label>
              <span>{text.table}</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={80}
                value={tableNumber}
                onChange={(event) => setTableNumber(event.target.value)}
                autoFocus
              />
            </label>
            <button className="primary-button full-button" type="button" onClick={() => void startTableSession()} disabled={loading === "session"}>
              {loading === "session" ? <LoaderCircle className="spin" size={20} aria-hidden="true" /> : <ArrowLeft size={20} aria-hidden="true" />}
              {text.startSession}
            </button>
          </div>
        </ModalShell>
      )}

      {serviceOpen && session && (
        <ModalShell title={text.service} onClose={() => setServiceOpen(false)} locale={locale} compact>
          <div className="service-sheet">
            <p className="service-table-number">
              {locale === "ar" ? `الطاولة ${session.session.tableNumber}` : `Table ${session.session.tableNumber}`}
            </p>
            <div className="service-grid">
              {serviceOptions.map((option) => {
                const Icon = option.icon;
                const activeRequest = session.serviceRequests.find(
                  (entry) =>
                    entry.requestType === option.type &&
                    !["completed", "cancelled"].includes(entry.status),
                );
                return (
                  <button
                    type="button"
                    key={option.type}
                    onClick={() => void requestService(option.type)}
                    disabled={Boolean(activeRequest) || loading === `service-${option.type}`}
                  >
                    {loading === `service-${option.type}` ? <LoaderCircle className="spin" size={23} aria-hidden="true" /> : <Icon size={23} aria-hidden="true" />}
                    <strong>{locale === "ar" ? option.ar : option.en}</strong>
                    <span>
                      {activeRequest
                        ? serviceStatusLabel[locale][activeRequest.status]
                        : locale === "ar"
                          ? "كبسة واحدة"
                          : "One tap"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </ModalShell>
      )}

      {sessionOpen && session && (
        <ModalShell title={`${text.session} · ${locale === "ar" ? "طاولة" : "Table"} ${session.session.tableNumber}`} onClose={() => setSessionOpen(false)} locale={locale}>
          <div className="session-sheet">
            {session.orders.length ? (
              <div className="round-list">
                {session.orders.map((order) => (
                  <article className="round-card" key={order.id}>
                    <header>
                      <div>
                        <span>{text.round} {order.roundNumber}</span>
                        <strong>#{order.publicId}</strong>
                      </div>
                      <StatusPill status={order.status} label={orderStatusLabel[locale][order.status] ?? order.status} />
                    </header>
                    <ul>
                      {order.items.map((line) => (
                        <li key={line.id}>
                          <span>{line.quantity}× {locale === "ar" ? line.nameAr : line.nameEn || line.nameAr}</span>
                          <small>{orderStatusLabel[locale][line.status] ?? line.status}</small>
                        </li>
                      ))}
                    </ul>
                    <strong className="round-total">{formatJod(order.totalMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <ReceiptText size={30} aria-hidden="true" />
                <p>{locale === "ar" ? "لم تُرسل أي جولة بعد." : "No order rounds yet."}</p>
              </div>
            )}
            <div className="session-total-card">
              <p><span>{text.subtotal}</span><strong>{formatJod(session.session.subtotalMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong></p>
              <p><span>{text.tax}</span><strong>{formatJod(session.session.taxMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong></p>
              <p className="grand-total"><span>{text.total}</span><strong>{formatJod(session.session.totalMils, locale === "ar" ? "ar-JO" : "en-JO")} {locale === "ar" ? "د.أ" : "JD"}</strong></p>
            </div>
            <div className="session-actions">
              <button type="button" className="secondary-button" onClick={() => { setSessionOpen(false); setServiceOpen(true); }}>
                <Bell size={19} aria-hidden="true" />
                {text.service}
              </button>
              <button type="button" className="primary-button" onClick={() => void requestService("bill")} disabled={loading === "service-bill"}>
                <ReceiptText size={19} aria-hidden="true" />
                {locale === "ar" ? "اطلب الحساب" : "Request bill"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {toast && (
        <div className={`toast ${toast.kind}`} role="status" aria-live="polite">
          {toast.kind === "success" ? <Check size={19} aria-hidden="true" /> : toast.kind === "error" ? <X size={19} aria-hidden="true" /> : <WifiOff size={19} aria-hidden="true" />}
          <span>{toast.message}</span>
          <button type="button" onClick={() => setToast(null)} aria-label={text.close}>
            <X size={17} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  locale,
  compact = false,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  locale: Locale;
  compact?: boolean;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.classList.add("modal-open");
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("modal-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section
        className={`modal-sheet ${compact ? "compact-sheet" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header>
          <h2 id="modal-title">{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={locale === "ar" ? "إغلاق" : "Close"} autoFocus>
            <X size={21} aria-hidden="true" />
          </button>
        </header>
        <div className="modal-content">{children}</div>
      </section>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  return (
    <span className={`status-pill status-${status}`}>
      <span aria-hidden="true" />
      {label}
    </span>
  );
}
