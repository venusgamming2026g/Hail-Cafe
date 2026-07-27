import { getChatGPTUser } from "../app/chatgpt-auth";
import { runtimeEnv } from "./server-db";

export type StaffRole = "manager" | "kitchen" | "floor";
export type StaffPermission =
  | "read_ops"
  | "update_order"
  | "update_service"
  | "manage_menu"
  | "manage_content"
  | "upload_asset";

const permissions: Record<StaffRole, StaffPermission[]> = {
  manager: [
    "read_ops",
    "update_order",
    "update_service",
    "manage_menu",
    "manage_content",
    "upload_asset",
  ],
  kitchen: ["read_ops", "update_order"],
  floor: ["read_ops", "update_order", "update_service"],
};

function parsedRules(): Record<string, StaffRole> {
  const rules = runtimeEnv().STAFF_ROLE_RULES;
  if (!rules) return {};
  try {
    const parsed = JSON.parse(rules) as Record<string, StaffRole>;
    return Object.fromEntries(
      Object.entries(parsed).map(([email, role]) => [
        email.trim().toLowerCase(),
        role,
      ]),
    );
  } catch {
    return {};
  }
}

export async function staffAccess(permission: StaffPermission) {
  const user = await getChatGPTUser();
  if (!user) {
    return {
      response: Response.json(
        { error: "يلزم تسجيل الدخول للوصول إلى منطقة الطاقم." },
        { status: 401 },
      ),
    } as const;
  }

  const email = user.email.toLowerCase();
  const rules = parsedRules();
  const allowlist = (runtimeEnv().ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  const configured = Object.keys(rules).length > 0 || allowlist.length > 0;
  const role = rules[email] ?? (allowlist.includes(email) ? "manager" : null);

  // A private Sites preview already restricts viewers through SIWC. When no
  // explicit staff rules are configured, its authenticated viewer is the
  // bootstrap manager. Public launches should set ADMIN_EMAILS or
  // STAFF_ROLE_RULES as hosted secrets.
  const effectiveRole = role ?? (!configured ? "manager" : null);
  if (!effectiveRole || !permissions[effectiveRole].includes(permission)) {
    return {
      response: Response.json(
        { error: "حسابك لا يملك الصلاحية المطلوبة." },
        { status: 403 },
      ),
    } as const;
  }

  return { user, role: effectiveRole } as const;
}
