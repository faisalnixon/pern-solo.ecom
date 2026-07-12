import { pgTable, text, integer, timestamp, uuid, boolean, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export type OrderStatus = "pending" | "paid" | "failed";
export type UserRole = "customer" | "support" | "admin";

export type CheckoutSessionLine = {
  productId: string;
  quantity: number;
  unitPriceCents: number;
};


export const users = pgTable("users", { //"users" is the name of the table in the database
  id: uuid("id").defaultRandom().primaryKey(), 
  clerkUserId: text("clerk_user_id").notNull().unique(),
    //clerkUserId will come from Clerk
  email: text("email").notNull().default(""),
  displayName: text("display_name"),
  role: text("role").$type<UserRole>().notNull().default("customer"),
    //$type<UserRole>() is a TypeScript type assertion that tells the compiler that the value of the "role" column should be treated as a UserRole type. This allows for better type checking and autocompletion when working with the "role" column in the code.
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(), 
    // if product name is Nike Shoes then the slug will be nike-shoes. This is used in the URL to identify the product.
  name: text("name").notNull(),
  category: text("category").notNull().default("General"),
  description: text("description").notNull().default(""),
  priceCents: integer("price_cents").notNull(), 
    //integer converts the price to cents to avoid floating point issues. For example, $10.99 would be stored as 1099.
  currency: text("currency").notNull().default("usd"),
  imageUrl: text("image_url"),
  imageKitFileId: text("image_kit_file_id"),
      /** ImageKit `fileId` for deletes from ImageKit */ 
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const checkoutSessions = pgTable("checkout_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }), 
    // foreign key to the users table. Here by references user.id will be attached to checkout_sessions.user_id. This means that each checkout session belongs to a user. and user information can be accessed from the checkout session.
    // If the user is deleted, the checkout session will also be deleted. onDelete: "cascade" means that if the user/parent is deleted, all their checkout sessions/children will also be deleted.
  polarCheckoutId: text("polar_checkout_id").unique(),
  lines: jsonb("lines").$type<CheckoutSessionLine[]>().notNull(),
    //jsonb is a JSONB column type in PostgreSQL that allows for storing JSON data.
    // lines is an array of CheckoutSessionLine objects, which contains the productId, quantity, and unitPriceCents for each item in the checkout session. Each line contains seperate productId, quantity, and unitPriceCents.
  totalCents: integer("total_cents").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  status: text("status").$type<OrderStatus>().notNull().default("pending"),
  polarCheckoutId: text("polar_checkout_id"),
  polarOrderId: text("polar_order_id").unique(),
  totalCents: integer("total_cents").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});


export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull(),
  unitPriceCents: integer("unit_price_cents").notNull(),
});

// cascade = “delete children when parent is deleted”; restrict = “don’t delete the parent if any child still points at it.”


// a user can have many orders over time.
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}));

// the same product can show up on many order lines or items
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

// each order belongs to exactly one user; each order can have many line items or order item.
export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

// each line item is for exactly one order and one product
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

