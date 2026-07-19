export type UserRole = "customer" | "support" | "admin";

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  imageKitFileId: string | null;
  active: boolean;
  createdAt: string;
}


export interface MeResponse {
  user: {
    id: string;
    clerkUserId: string;
    email: string;
    displayName: string | null;
    role: UserRole;
  };
}

export interface OrderPreviewItem {
  slug: string;
  imageUrl: string | null;
  quantity: number;
}

export interface Order {
  id: string;
  status: "pending" | "paid" | "failed";
  totalCents: number;
  createdAt: string;
  updatedAt: string;

  previewItems: OrderPreviewItem[];
}

export interface OrdersResponse {
  orders: Order[];
}