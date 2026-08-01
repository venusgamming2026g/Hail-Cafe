"use client";

import {
  Activity,
  Archive,
  BellRing,
  Check,
  ChefHat,
  ChevronLeft,
  CircleDollarSign,
  Coffee,
  FileClock,
  ImagePlus,
  LayoutDashboard,
  ListFilter,
  LoaderCircle,
  LogOut,
  MapPin,
  Menu,
  PackageCheck,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShoppingBag,
  SlidersHorizontal,
  TableProperties,
  Utensils,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatJod } from "../lib/menu-data";
import { officialBranch } from "../lib/restaurant";

type OpsOrder = {
  id: string;
  publicId: string;
  orderType: string;
  tableNumber: number | null;
  customerName: string;
  phone: string;
  status: string;
  roundNumber: number;
  subtotalMils: number;
  taxMils: number;
  totalMils: number;
  note: string;
  createdAt: string;
  items: Array<{
    id: string;
    nameAr: string;
    quantity: number;
    status: string;
    note: string;
  }>;
};

type OpsState = {
  user: { email: string; displayName: string };
  role: "manager" | "kitchen" | "floor";
  orders: OpsOrder[];
  sessions: Array<{
    id: string;
    tableNumber: number;
    status: string;
    subtotalMils: number;
    taxMils: number;
    totalMils: number;
    updatedAt: string;
  }>;
  serviceRequests: Array<{
    id: string;
    sessionId: string;
    tableNumber: number;
    requestType: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  }>;
  menu: {
    categories: Array<{
      id: string;
      nameAr: string;
      nameEn: string;
      sortOrder: number;
    }>;
    items: Array<{
      id: string;
      categoryId: string;
      nameAr: string;
      nameEn: string;
      priceMils: number;
      imageUrl: string;
      available: boolean;
      updatedAt: string;
    }>;
  };
  branches: Array<{
    id: string;
    nameAr: string;
    addressAr: string;
    addressEn: string;
    phone: string;
    active: boolean;
  }>;
  content: Record<string, Record<string, string>>;
  events: Array<{
    id: string;
    entityType: string;
    entityId: string;
    eventType: string;
    actor: string;
    createdAt: string;
  }>;
  serverTime: string;
};

type OpsView =
  | "overview"
  | "kitchen"
  | "hall"
  | "takeaway"
  | "menu"
  | "content"
  | "activity";

const navItems: Array<{
  id: OpsView;
  label: string;
  icon: typeof LayoutDashboard;
  managerOnly?: boolean;
}> = [
  { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
  { id: "kitchen", label: "المطبخ KDS", icon: ChefHat },
  { id: "hall", label: "الصالة والطاولات", icon: TableProperties },
  { id: "takeaway", label: "السفري", icon: ShoppingBag },
  { id: "menu", label: "إدارة المنيو", icon: SlidersHorizontal, managerOnly: true },
  { id: "content", label: "الفروع والمحتوى", icon: Settings2, managerOnly: true },
  { id: "activity", label: "سجل الحالات", icon: FileClock, managerOnly: true },
];

const serviceLabels: Record<string, string> = {
  staff: "طلب موظف",
  water: "ماء",
  cutlery: "أدوات",
  cleaning: "تنظيف",
  bill: "الحساب",
};

const statusLabels: Record<string, string> = {
  new: "جديد",
  preparing: "قيد التحضير",
  ready: "جاهز",
  served: "تم التقديم",
  cancelled: "ملغي",
  acknowledged: "تم الاستلام",
  on_way: "بالطريق",
  completed: "تمت الخدمة",
};

const roleLabels: Record<string, string> = {
  manager: "مدير",
  kitchen: "مطبخ",
  floor: "صالة",
};

export function OpsApp({ initialMode }: { initialMode: "ops" | "kds" }) {
  const [state, setState] = useState<OpsState | null>(null);
  const [view, setView] = useState<OpsView>(
    initialMode === "kds" ? "kitchen" : "overview",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const seenOrders = useRef<Set<string>>(new Set());
  const mounted = useRef(false);

  const beep = useCallback(() => {
    if (!soundEnabled || typeof window === "undefined") return;
    const AudioContextClass =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const context = new AudioContextClass();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 620;
    gain.gain.setValueAtTime(0.0001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.24);
    oscillator.addEventListener("ended", () => void context.close());
  }, [soundEnabled]);

  const loadState = useCallback(
    async (announce = true) => {
      try {
        const response = await fetch("/api/ops/state", { cache: "no-store" });
        const payload = (await response.json()) as OpsState & { error?: string };
        if (!response.ok) throw new Error(payload.error);
        const next = payload as OpsState;
        if (announce && mounted.current) {
          const newOrders = next.orders.filter(
            (order) => order.status === "new" && !seenOrders.current.has(order.id),
          );
          if (newOrders.length) beep();
        }
        next.orders.forEach((order) => seenOrders.current.add(order.id));
        setState(next);
        setLastSync(new Date());
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "تعذر تحميل حالة التشغيل.",
        );
      } finally {
        setLoading(false);
        mounted.current = true;
      }
    },
    [beep],
  );

  useEffect(() => {
    const initialTimer = setTimeout(() => void loadState(false), 0);
    const pollTimer = setInterval(
      () => void loadState(document.visibilityState === "visible"),
      3200,
    );
    return () => {
      clearTimeout(initialTimer);
      clearInterval(pollTimer);
    };
  }, [loadState]);

  async function patch(
    url: string,
    body: unknown,
    pendingKey: string,
  ) {
    setPending(pendingKey);
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { error?: string } & Record<string, unknown>;
      if (!response.ok) throw new Error(payload.error);
      await loadState(false);
      return payload;
    } catch (patchError) {
      setError(
        patchError instanceof Error
          ? patchError.message
          : "تعذر حفظ التغيير.",
      );
      throw patchError;
    } finally {
      setPending(null);
    }
  }

  async function updateOrder(orderId: string, status: string) {
    await patch(
      "/api/ops/order",
      { orderId, status },
      `order-${orderId}-${status}`,
    );
  }

  async function updateService(requestId: string, status: string) {
    await patch(
      "/api/ops/service",
      { requestId, status },
      `service-${requestId}-${status}`,
    );
  }

  const visibleNav = navItems.filter(
    (entry) => !entry.managerOnly || state?.role === "manager",
  );

  return (
    <div className="ops-shell" dir="rtl">
      <aside className={`ops-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="ops-brand">
          <img src="/hail-logo.png" width="56" height="56" alt={officialBranch.nameAr} />
          <div>
            <strong>لوحة العمليات</strong>
            <span>إدارة المطعم والمقهى</span>
          </div>
          <button
            type="button"
            className="ops-mobile-close"
            onClick={() => setMenuOpen(false)}
            aria-label="إغلاق القائمة"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="تنقل لوحة التشغيل">
          {visibleNav.map((entry) => {
            const Icon = entry.icon;
            return (
              <button
                type="button"
                key={entry.id}
                className={view === entry.id ? "active" : ""}
                aria-current={view === entry.id ? "page" : undefined}
                onClick={() => {
                  setView(entry.id);
                  setMenuOpen(false);
                }}
              >
                <Icon size={20} aria-hidden="true" />
                <span>{entry.label}</span>
                {entry.id === "hall" &&
                  state?.serviceRequests.some(
                    (request) =>
                      !["completed", "cancelled"].includes(request.status),
                  ) && <i aria-label="طلبات خدمة جديدة" />}
              </button>
            );
          })}
        </nav>
        <div className="ops-sidebar-footer">
          {state && (
            <div className="staff-profile">
              <span>{state.user.displayName.slice(0, 1).toUpperCase()}</span>
              <div>
                <strong>{state.user.displayName}</strong>
                <small>{roleLabels[state.role]}</small>
              </div>
            </div>
          )}
          <a href="/signout-with-chatgpt?return_to=/">
            <LogOut size={18} aria-hidden="true" />
            تسجيل الخروج
          </a>
        </div>
      </aside>

      {menuOpen && (
        <button
          className="ops-sidebar-scrim"
          type="button"
          onClick={() => setMenuOpen(false)}
          aria-label="إغلاق القائمة"
        />
      )}

      <main className="ops-main">
        <header className="ops-topbar">
          <div>
            <button
              type="button"
              className="ops-menu-button"
              onClick={() => setMenuOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={22} aria-hidden="true" />
            </button>
            <div>
              <p>{officialBranch.nameAr}</p>
              <h1>
                {visibleNav.find((entry) => entry.id === view)?.label ??
                  "لوحة التشغيل"}
              </h1>
            </div>
          </div>
          <div className="ops-top-actions">
            <span className="sync-state">
              <span className={error ? "error" : ""} />
              {error
                ? "الاتصال متعثر"
                : lastSync
                  ? `آخر تحديث ${lastSync.toLocaleTimeString("ar-JO", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}`
                  : "جاري الاتصال"}
            </span>
            <button
              type="button"
              className="ops-icon-button"
              onClick={() => setSoundEnabled((current) => !current)}
              aria-label={soundEnabled ? "إيقاف صوت الطلبات" : "تشغيل صوت الطلبات"}
              title={soundEnabled ? "إيقاف التنبيهات الصوتية" : "تشغيل تنبيه واحد لكل طلب جديد"}
            >
              {soundEnabled ? (
                <Volume2 size={20} aria-hidden="true" />
              ) : (
                <VolumeX size={20} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              className="ops-icon-button"
              onClick={() => void loadState(false)}
              aria-label="تحديث الآن"
              disabled={loading}
            >
              <RefreshCw
                className={loading ? "spin" : ""}
                size={20}
                aria-hidden="true"
              />
            </button>
          </div>
        </header>

        {error && (
          <div className="ops-error" role="alert">
            <X size={19} aria-hidden="true" />
            <span>{error}</span>
            <button type="button" onClick={() => void loadState(false)}>
              حاول مجددًا
            </button>
          </div>
        )}

        {loading && !state ? (
          <div className="ops-loading" role="status">
            <LoaderCircle className="spin" size={30} aria-hidden="true" />
            <p>نجمع حالة المطبخ والصالة…</p>
          </div>
        ) : state ? (
          <div className="ops-view">
            {view === "overview" && (
              <Overview
                state={state}
                onNavigate={setView}
                onUpdateService={updateService}
                pending={pending}
              />
            )}
            {view === "kitchen" && (
              <KitchenBoard
                orders={state.orders}
                pending={pending}
                onUpdate={updateOrder}
              />
            )}
            {view === "hall" && (
              <HallBoard
                state={state}
                pending={pending}
                onUpdateService={updateService}
              />
            )}
            {view === "takeaway" && (
              <TakeawayBoard
                orders={state.orders}
                pending={pending}
                onUpdate={updateOrder}
              />
            )}
            {view === "menu" && state.role === "manager" && (
              <MenuManager state={state} patch={patch} />
            )}
            {view === "content" && state.role === "manager" && (
              <ContentManager state={state} patch={patch} />
            )}
            {view === "activity" && state.role === "manager" && (
              <ActivityLog events={state.events} />
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Overview({
  state,
  onNavigate,
  onUpdateService,
  pending,
}: {
  state: OpsState;
  onNavigate: (view: OpsView) => void;
  onUpdateService: (id: string, status: string) => Promise<void>;
  pending: string | null;
}) {
  const activeOrders = state.orders.filter(
    (order) => !["served", "cancelled"].includes(order.status),
  );
  const activeServices = state.serviceRequests.filter(
    (request) => !["completed", "cancelled"].includes(request.status),
  );
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayOrders = state.orders.filter((order) =>
    order.createdAt.startsWith(todayKey),
  );
  const todayTotal = todayOrders
    .filter((order) => order.status !== "cancelled")
    .reduce((sum, order) => sum + order.totalMils, 0);
  return (
    <>
      <section className="metric-grid" aria-label="مؤشرات التشغيل">
        <MetricCard
          label="طلبات نشطة"
          value={String(activeOrders.length)}
          hint={`${activeOrders.filter((order) => order.status === "new").length} جديدة`}
          icon={ChefHat}
          tone="clay"
        />
        <MetricCard
          label="طاولات نشطة"
          value={String(state.sessions.length)}
          hint={`${state.sessions.filter((session) => session.status === "bill_requested").length} تطلب الحساب`}
          icon={TableProperties}
          tone="mint"
        />
        <MetricCard
          label="طلبات خدمة"
          value={String(activeServices.length)}
          hint={`${activeServices.filter((request) => request.status === "new").length} بانتظار الاستلام`}
          icon={BellRing}
          tone="amber"
        />
        <MetricCard
          label="إجمالي اليوم"
          value={`${formatJod(todayTotal, "ar-JO")} د.أ`}
          hint={`${todayOrders.length} طلب`}
          icon={CircleDollarSign}
          tone="blue"
        />
      </section>

      <div className="ops-split">
        <section className="ops-panel">
          <PanelHeading
            title="آخر الطلبات"
            action="افتح المطبخ"
            onAction={() => onNavigate("kitchen")}
          />
          <div className="compact-order-list">
            {state.orders.slice(0, 7).map((order) => (
              <button
                type="button"
                key={order.id}
                onClick={() =>
                  onNavigate(
                    order.orderType === "takeaway" ? "takeaway" : "kitchen",
                  )
                }
              >
                <span className={`order-dot status-${order.status}`} />
                <div>
                  <strong>#{order.publicId}</strong>
                  <small>
                    {order.orderType === "dine_in"
                      ? `طاولة ${order.tableNumber} · جولة ${order.roundNumber}`
                      : order.customerName || "طلب سفري"}
                  </small>
                </div>
                <span>{statusLabels[order.status]}</span>
                <time>{relativeTime(order.createdAt)}</time>
              </button>
            ))}
          </div>
        </section>

        <section className="ops-panel">
          <PanelHeading
            title="خدمة الصالة"
            action="كل الطاولات"
            onAction={() => onNavigate("hall")}
          />
          <div className="service-request-list">
            {activeServices.length ? (
              activeServices.slice(0, 6).map((request) => (
                <ServiceRequestCard
                  key={request.id}
                  request={request}
                  onUpdate={onUpdateService}
                  pending={pending}
                  compact
                />
              ))
            ) : (
              <OpsEmpty
                icon={Check}
                title="الصالة هادئة"
                text="لا توجد طلبات خدمة معلّقة."
              />
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: typeof Activity;
  tone: string;
}) {
  return (
    <article className={`metric-card tone-${tone}`}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{hint}</small>
      </div>
      <span className="metric-icon">
        <Icon size={22} aria-hidden="true" />
      </span>
    </article>
  );
}

function PanelHeading({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <header className="panel-heading">
      <h2>{title}</h2>
      {action && onAction && (
        <button type="button" onClick={onAction}>
          {action}
          <ChevronLeft size={17} aria-hidden="true" />
        </button>
      )}
    </header>
  );
}

function KitchenBoard({
  orders,
  pending,
  onUpdate,
}: {
  orders: OpsOrder[];
  pending: string | null;
  onUpdate: (id: string, status: string) => Promise<void>;
}) {
  const columns = [
    { id: "new", label: "جديد", next: "preparing", action: "ابدأ التحضير" },
    {
      id: "preparing",
      label: "قيد التحضير",
      next: "ready",
      action: "جاهز للتقديم",
    },
    {
      id: "ready",
      label: "جاهز",
      next: "served",
      action: "تم التقديم",
    },
    { id: "served", label: "تم التقديم", next: null, action: "" },
  ];
  return (
    <section className="kds-board" aria-label="شاشة المطبخ">
      {columns.map((column) => {
        const columnOrders = orders.filter(
          (order) => order.status === column.id,
        );
        return (
          <div className={`kds-column kds-${column.id}`} key={column.id}>
            <header>
              <div>
                <span className={`order-dot status-${column.id}`} />
                <h2>{column.label}</h2>
              </div>
              <strong>{columnOrders.length}</strong>
            </header>
            <div className="kds-stack">
              {columnOrders.length ? (
                columnOrders.map((order) => (
                  <article className="kds-ticket" key={order.id}>
                    <header>
                      <div>
                        <strong>#{order.publicId}</strong>
                        <span>
                          {order.orderType === "dine_in"
                            ? `طاولة ${order.tableNumber} · جولة ${order.roundNumber}`
                            : `سفري · ${order.customerName || "بدون اسم"}`}
                        </span>
                      </div>
                      <time>{elapsed(order.createdAt)}</time>
                    </header>
                    <ul>
                      {order.items.map((line) => (
                        <li key={line.id}>
                          <strong>{line.quantity}</strong>
                          <span>
                            {line.nameAr}
                            {line.note && <small>{line.note}</small>}
                          </span>
                          <i className={`item-state status-${line.status}`}>
                            {statusLabels[line.status]}
                          </i>
                        </li>
                      ))}
                    </ul>
                    {order.note && (
                      <p className="ticket-note">ملاحظة: {order.note}</p>
                    )}
                    {column.next && (
                      <button
                        type="button"
                        className="ticket-action"
                        disabled={
                          pending === `order-${order.id}-${column.next}`
                        }
                        onClick={() => void onUpdate(order.id, column.next!)}
                      >
                        {pending === `order-${order.id}-${column.next}` ? (
                          <LoaderCircle
                            className="spin"
                            size={18}
                            aria-hidden="true"
                          />
                        ) : column.next === "ready" ? (
                          <PackageCheck size={18} aria-hidden="true" />
                        ) : column.next === "served" ? (
                          <Utensils size={18} aria-hidden="true" />
                        ) : (
                          <ChefHat size={18} aria-hidden="true" />
                        )}
                        {column.action}
                      </button>
                    )}
                  </article>
                ))
              ) : (
                <OpsEmpty
                  icon={Check}
                  title="لا طلبات هنا"
                  text={
                    column.id === "new"
                      ? "ستظهر الطلبات الجديدة فور وصولها."
                      : "الحالة محدثة."
                  }
                  compact
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

function HallBoard({
  state,
  pending,
  onUpdateService,
}: {
  state: OpsState;
  pending: string | null;
  onUpdateService: (id: string, status: string) => Promise<void>;
}) {
  const activeServices = state.serviceRequests.filter(
    (request) => !["completed", "cancelled"].includes(request.status),
  );
  return (
    <div className="hall-layout">
      <section className="ops-panel">
        <PanelHeading title="الطاولات النشطة" />
        <div className="table-grid">
          {state.sessions.length ? (
            state.sessions.map((session) => {
              const tableServices = activeServices.filter(
                (request) => request.sessionId === session.id,
              );
              const tableOrders = state.orders.filter(
                (order) =>
                  order.tableNumber === session.tableNumber &&
                  order.orderType === "dine_in",
              );
              return (
                <article
                  className={`table-card ${
                    session.status === "bill_requested" ? "bill-requested" : ""
                  }`}
                  key={session.id}
                >
                  <header>
                    <span>طاولة</span>
                    <strong>{session.tableNumber}</strong>
                    <i className={`order-dot status-${session.status}`} />
                  </header>
                  <div>
                    <p>
                      <span>الجولات</span>
                      <strong>{tableOrders.length}</strong>
                    </p>
                    <p>
                      <span>الإجمالي</span>
                      <strong>
                        {formatJod(session.totalMils, "ar-JO")} د.أ
                      </strong>
                    </p>
                  </div>
                  {tableServices.length > 0 && (
                    <footer>
                      <BellRing size={16} aria-hidden="true" />
                      {tableServices.map(
                        (request) => serviceLabels[request.requestType],
                      ).join("، ")}
                    </footer>
                  )}
                </article>
              );
            })
          ) : (
            <OpsEmpty
              icon={TableProperties}
              title="لا طاولات نشطة"
              text="تظهر الجلسة بمجرد مسح QR أو بدء الطلب برقم الطاولة."
            />
          )}
        </div>
      </section>

      <section className="ops-panel">
        <PanelHeading title="طلبات الخدمة" />
        <div className="service-request-list">
          {activeServices.length ? (
            activeServices.map((request) => (
              <ServiceRequestCard
                key={request.id}
                request={request}
                onUpdate={onUpdateService}
                pending={pending}
              />
            ))
          ) : (
            <OpsEmpty
              icon={Check}
              title="لا طلبات معلّقة"
              text="جميع طلبات الخدمة منجزة."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function ServiceRequestCard({
  request,
  onUpdate,
  pending,
  compact = false,
}: {
  request: OpsState["serviceRequests"][number];
  onUpdate: (id: string, status: string) => Promise<void>;
  pending: string | null;
  compact?: boolean;
}) {
  const nextStatus =
    request.status === "new"
      ? "acknowledged"
      : request.status === "acknowledged"
        ? "on_way"
        : "completed";
  const nextLabel =
    nextStatus === "acknowledged"
      ? "استلام"
      : nextStatus === "on_way"
        ? "بالطريق"
        : "تمت";
  return (
    <article className={`service-request ${compact ? "compact" : ""}`}>
      <div className="service-table">
        <span>طاولة</span>
        <strong>{request.tableNumber}</strong>
      </div>
      <div>
        <strong>{serviceLabels[request.requestType] ?? request.requestType}</strong>
        <span>
          {statusLabels[request.status]} · {relativeTime(request.createdAt)}
        </span>
      </div>
      <button
        type="button"
        disabled={pending === `service-${request.id}-${nextStatus}`}
        onClick={() => void onUpdate(request.id, nextStatus)}
      >
        {pending === `service-${request.id}-${nextStatus}` ? (
          <LoaderCircle className="spin" size={16} aria-hidden="true" />
        ) : (
          <Check size={16} aria-hidden="true" />
        )}
        {nextLabel}
      </button>
    </article>
  );
}

function TakeawayBoard({
  orders,
  pending,
  onUpdate,
}: {
  orders: OpsOrder[];
  pending: string | null;
  onUpdate: (id: string, status: string) => Promise<void>;
}) {
  const takeaway = orders.filter((order) => order.orderType === "takeaway");
  return (
    <section className="ops-panel">
      <PanelHeading title="طلبات السفري" />
      <div className="takeaway-table-wrap">
        <table className="takeaway-table">
          <thead>
            <tr>
              <th>الطلب</th>
              <th>العميل</th>
              <th>الأصناف</th>
              <th>الإجمالي</th>
              <th>الحالة</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {takeaway.map((order) => {
              const next =
                order.status === "new"
                  ? "preparing"
                  : order.status === "preparing"
                    ? "ready"
                    : order.status === "ready"
                      ? "served"
                      : null;
              return (
                <tr key={order.id}>
                  <td>
                    <strong>#{order.publicId}</strong>
                    <small>{relativeTime(order.createdAt)}</small>
                  </td>
                  <td>
                    <strong>{order.customerName || "بدون اسم"}</strong>
                    <small>{order.phone || "لا هاتف"}</small>
                  </td>
                  <td>{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td>{formatJod(order.totalMils, "ar-JO")} د.أ</td>
                  <td>
                    <span className={`status-pill status-${order.status}`}>
                      <i />
                      {statusLabels[order.status]}
                    </span>
                  </td>
                  <td>
                    {next ? (
                      <button
                        type="button"
                        disabled={pending === `order-${order.id}-${next}`}
                        onClick={() => void onUpdate(order.id, next)}
                      >
                        {pending === `order-${order.id}-${next}` ? (
                          <LoaderCircle className="spin" size={16} aria-hidden="true" />
                        ) : (
                          <ChevronLeft size={16} aria-hidden="true" />
                        )}
                        {statusLabels[next]}
                      </button>
                    ) : (
                      <span>مكتمل</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!takeaway.length && (
          <OpsEmpty
            icon={ShoppingBag}
            title="لا طلبات سفري"
            text="تظهر الطلبات هنا فور إرسالها."
          />
        )}
      </div>
    </section>
  );
}

function MenuManager({
  state,
  patch,
}: {
  state: OpsState;
  patch: (url: string, body: unknown, pendingKey: string) => Promise<unknown>;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const visible = state.menu.items.filter((item) => {
    const matchesCategory = category === "all" || item.categoryId === category;
    const matchesSearch = `${item.nameAr} ${item.nameEn}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  return (
    <section className="ops-panel">
      <div className="menu-manager-heading">
        <PanelHeading title="المنيو والأسعار" />
        <div className="manager-filters">
          <label>
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ابحث عن صنف"
            />
          </label>
          <label>
            <ListFilter size={18} aria-hidden="true" />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="التصنيف"
            >
              <option value="all">كل التصنيفات</option>
              {state.menu.categories.map((entry) => (
                <option value={entry.id} key={entry.id}>
                  {entry.nameAr}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
      <div className="menu-manager-list">
        {visible.map((item) => (
          <MenuEditorRow key={item.id} item={item} patch={patch} />
        ))}
      </div>
    </section>
  );
}

function MenuEditorRow({
  item,
  patch,
}: {
  item: OpsState["menu"]["items"][number];
  patch: (url: string, body: unknown, pendingKey: string) => Promise<unknown>;
}) {
  const [price, setPrice] = useState((item.priceMils / 1000).toFixed(3));
  const [available, setAvailable] = useState(item.available);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function save(imageUrl?: string) {
    setSaving(true);
    setSaved(false);
    try {
      await patch(
        "/api/ops/menu",
        {
          itemId: item.id,
          priceMils: Math.round(Number(price) * 1000),
          available,
          imageUrl,
        },
        `menu-${item.id}`,
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2200);
    } finally {
      setSaving(false);
    }
  }

  async function upload(file: File) {
    setSaving(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/ops/assets", {
        method: "POST",
        body: form,
      });
      const payload = (await response.json()) as { error?: string; url?: string };
      if (!response.ok) throw new Error(payload.error);
      await save(payload.url ?? "");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="menu-editor-row">
      <div className="menu-editor-image">
        {item.imageUrl ? (
          <img src={item.imageUrl} width="64" height="64" alt="" />
        ) : (
          <Coffee size={22} aria-hidden="true" />
        )}
      </div>
      <div className="menu-editor-name">
        <strong>{item.nameAr}</strong>
        <span>{item.nameEn}</span>
      </div>
      <label className="price-editor">
        <span>السعر د.أ</span>
        <input
          type="number"
          min="0.1"
          max="100"
          step="0.05"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <label className="availability-toggle">
        <input
          type="checkbox"
          checked={available}
          onChange={(event) => setAvailable(event.target.checked)}
        />
        <span aria-hidden="true" />
        <b>{available ? "متاح" : "موقوف"}</b>
      </label>
      <div className="menu-editor-actions">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
        <button
          type="button"
          className="image-button"
          onClick={() => fileRef.current?.click()}
          aria-label={`رفع صورة ${item.nameAr}`}
        >
          <ImagePlus size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="save-button"
          onClick={() => void save()}
          disabled={saving}
        >
          {saving ? (
            <LoaderCircle className="spin" size={17} aria-hidden="true" />
          ) : saved ? (
            <Check size={17} aria-hidden="true" />
          ) : (
            <Save size={17} aria-hidden="true" />
          )}
          {saved ? "حُفظ" : "حفظ"}
        </button>
      </div>
    </article>
  );
}

function ContentManager({
  state,
  patch,
}: {
  state: OpsState;
  patch: (url: string, body: unknown, pendingKey: string) => Promise<unknown>;
}) {
  const branch = state.branches[0];
  const homepage = state.content.homepage ?? {};
  const [phone, setPhone] = useState(branch?.phone ?? "");
  const [addressAr, setAddressAr] = useState(branch?.addressAr ?? "");
  const [heroAr, setHeroAr] = useState(homepage.heroAr ?? "");
  const [announcementAr, setAnnouncementAr] = useState(
    homepage.announcementAr ?? "",
  );
  const [saving, setSaving] = useState<string | null>(null);
  if (!branch) return null;
  return (
    <div className="content-manager-grid">
      <section className="ops-panel content-form">
        <PanelHeading title="بيانات الفرع" />
        <label>
          <span>رقم الهاتف</span>
          <input value={phone} onChange={(event) => setPhone(event.target.value)} />
        </label>
        <label>
          <span>العنوان العربي</span>
          <textarea
            value={addressAr}
            onChange={(event) => setAddressAr(event.target.value)}
            rows={3}
          />
        </label>
        <button
          type="button"
          className="ops-primary-action"
          disabled={saving === "branch"}
          onClick={async () => {
            setSaving("branch");
            try {
              await patch(
                "/api/ops/content",
                {
                  kind: "branch",
                  id: branch.id,
                  phone,
                  addressAr,
                },
                "content-branch",
              );
            } finally {
              setSaving(null);
            }
          }}
        >
          {saving === "branch" ? (
            <LoaderCircle className="spin" size={18} aria-hidden="true" />
          ) : (
            <Save size={18} aria-hidden="true" />
          )}
          حفظ الفرع
        </button>
      </section>

      <section className="ops-panel content-form">
        <PanelHeading title="محتوى الواجهة" />
        <label>
          <span>عنوان الواجهة</span>
          <textarea
            value={heroAr}
            onChange={(event) => setHeroAr(event.target.value)}
            rows={3}
          />
        </label>
        <label>
          <span>إعلان الأسعار</span>
          <input
            value={announcementAr}
            onChange={(event) => setAnnouncementAr(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="ops-primary-action"
          disabled={saving === "homepage"}
          onClick={async () => {
            setSaving("homepage");
            try {
              await patch(
                "/api/ops/content",
                {
                  kind: "content",
                  key: "homepage",
                  value: { ...homepage, heroAr, announcementAr },
                },
                "content-homepage",
              );
            } finally {
              setSaving(null);
            }
          }}
        >
          {saving === "homepage" ? (
            <LoaderCircle className="spin" size={18} aria-hidden="true" />
          ) : (
            <Save size={18} aria-hidden="true" />
          )}
          حفظ المحتوى
        </button>
      </section>

      <section className="ops-panel qr-panel">
        <PanelHeading title="روابط QR للطاولات" />
        <p>
          استخدم الرابط التالي داخل QR وغيّر رقم الطاولة. كل رابط يبدأ جلسة
          طاولة ويحفظ الجولات والخدمة والحساب معًا.
        </p>
        <code>/ ?table=12</code>
        <a href="/?table=12" target="_blank" rel="noreferrer">
          <ExternalPreviewIcon />
          تجربة طاولة 12
        </a>
      </section>
    </div>
  );
}

function ExternalPreviewIcon() {
  return <MapPin size={18} aria-hidden="true" />;
}

function ActivityLog({ events }: { events: OpsState["events"] }) {
  return (
    <section className="ops-panel">
      <PanelHeading title="سجل الحالات" />
      <div className="activity-list">
        {events.map((event) => (
          <article key={event.id}>
            <span className={`activity-mark entity-${event.entityType}`}>
              <Activity size={17} aria-hidden="true" />
            </span>
            <div>
              <strong>{event.eventType}</strong>
              <span>
                {event.entityType} · {event.entityId}
              </span>
            </div>
            <small>{event.actor}</small>
            <time>{new Date(event.createdAt).toLocaleString("ar-JO")}</time>
          </article>
        ))}
      </div>
    </section>
  );
}

function OpsEmpty({
  icon: Icon,
  title,
  text,
  compact = false,
}: {
  icon: typeof Archive;
  title: string;
  text: string;
  compact?: boolean;
}) {
  return (
    <div className={`ops-empty ${compact ? "compact" : ""}`}>
      <Icon size={26} aria-hidden="true" />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function relativeTime(value: string) {
  const diff = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  return `منذ ${Math.floor(minutes / 60)} س`;
}

function elapsed(value: string) {
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 60000),
  );
  return `${minutes} د`;
}
