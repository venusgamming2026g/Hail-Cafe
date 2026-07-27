import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamp = (name: string) =>
  text(name).notNull().default(sql`CURRENT_TIMESTAMP`);

export const menuCategories = sqliteTable(
  "menu_categories",
  {
    id: text("id").primaryKey(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull().default(""),
    sortOrder: integer("sort_order").notNull(),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [index("menu_categories_order_idx").on(table.sortOrder)],
);

export const menuItems = sqliteTable(
  "menu_items",
  {
    id: text("id").primaryKey(),
    categoryId: text("category_id").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull().default(""),
    priceMils: integer("price_mils").notNull(),
    imageUrl: text("image_url").notNull().default(""),
    noteAr: text("note_ar").notNull().default(""),
    noteEn: text("note_en").notNull().default(""),
    sourceAmbiguous: integer("source_ambiguous", { mode: "boolean" })
      .notNull()
      .default(false),
    available: integer("available", { mode: "boolean" }).notNull().default(true),
    featured: integer("featured", { mode: "boolean" }).notNull().default(false),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("menu_items_category_idx").on(table.categoryId),
    index("menu_items_available_idx").on(table.available),
  ],
);

export const branches = sqliteTable("branches", {
  id: text("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull().default(""),
  addressAr: text("address_ar").notNull(),
  addressEn: text("address_en").notNull().default(""),
  phone: text("phone").notNull(),
  mapUrl: text("map_url").notNull(),
  hoursJson: text("hours_json").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: timestamp("updated_at"),
});

export const diningSessions = sqliteTable(
  "dining_sessions",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull(),
    branchId: text("branch_id").notNull(),
    tableNumber: integer("table_number").notNull(),
    status: text("status").notNull().default("active"),
    subtotalMils: integer("subtotal_mils").notNull().default(0),
    taxMils: integer("tax_mils").notNull().default(0),
    totalMils: integer("total_mils").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
    closedAt: text("closed_at"),
  },
  (table) => [
    uniqueIndex("dining_sessions_token_uidx").on(table.token),
    index("dining_sessions_table_idx").on(
      table.branchId,
      table.tableNumber,
      table.status,
    ),
  ],
);

export const orders = sqliteTable(
  "orders",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    sessionId: text("session_id"),
    branchId: text("branch_id").notNull(),
    orderType: text("order_type").notNull(),
    tableNumber: integer("table_number"),
    customerName: text("customer_name").notNull().default(""),
    phone: text("phone").notNull().default(""),
    status: text("status").notNull().default("new"),
    roundNumber: integer("round_number").notNull().default(1),
    subtotalMils: integer("subtotal_mils").notNull(),
    taxMils: integer("tax_mils").notNull(),
    totalMils: integer("total_mils").notNull(),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("orders_public_id_uidx").on(table.publicId),
    uniqueIndex("orders_idempotency_uidx").on(table.idempotencyKey),
    index("orders_status_created_idx").on(table.status, table.createdAt),
    index("orders_session_idx").on(table.sessionId, table.roundNumber),
  ],
);

export const orderItems = sqliteTable(
  "order_items",
  {
    id: text("id").primaryKey(),
    orderId: text("order_id").notNull(),
    menuItemId: text("menu_item_id").notNull(),
    nameAr: text("name_ar").notNull(),
    nameEn: text("name_en").notNull().default(""),
    quantity: integer("quantity").notNull(),
    unitPriceMils: integer("unit_price_mils").notNull(),
    status: text("status").notNull().default("new"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("order_items_order_idx").on(table.orderId),
    index("order_items_status_idx").on(table.status),
  ],
);

export const serviceRequests = sqliteTable(
  "service_requests",
  {
    id: text("id").primaryKey(),
    idempotencyKey: text("idempotency_key").notNull(),
    sessionId: text("session_id").notNull(),
    tableNumber: integer("table_number").notNull(),
    requestType: text("request_type").notNull(),
    status: text("status").notNull().default("new"),
    createdAt: timestamp("created_at"),
    acknowledgedAt: text("acknowledged_at"),
    onWayAt: text("on_way_at"),
    completedAt: text("completed_at"),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    uniqueIndex("service_requests_idempotency_uidx").on(table.idempotencyKey),
    index("service_requests_status_created_idx").on(
      table.status,
      table.createdAt,
    ),
  ],
);

export const eventLog = sqliteTable(
  "event_log",
  {
    id: text("id").primaryKey(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    eventType: text("event_type").notNull(),
    payloadJson: text("payload_json").notNull().default("{}"),
    actor: text("actor").notNull().default("system"),
    createdAt: timestamp("created_at"),
  },
  (table) => [
    index("event_log_entity_idx").on(table.entityType, table.entityId),
    index("event_log_created_idx").on(table.createdAt),
  ],
);

export const staffRoles = sqliteTable("staff_roles", {
  email: text("email").primaryKey(),
  role: text("role").notNull(),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  updatedAt: timestamp("updated_at"),
});

export const siteContent = sqliteTable("site_content", {
  key: text("key").primaryKey(),
  valueJson: text("value_json").notNull(),
  updatedAt: timestamp("updated_at"),
});

export const uploadedAssets = sqliteTable("uploaded_assets", {
  id: text("id").primaryKey(),
  objectKey: text("object_key").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: timestamp("created_at"),
});
