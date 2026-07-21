export type UserRole = "customer" | "support" | "admin";
export type OrderStatus = "pending" | "paid" | "failed";

// =========================
// Admin Products
// =========================

export interface AdminProductsResponse {
  products: Product[];
}

export interface ProductFormData {
  slug: string;
  name: string;
  category: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string | null;
  imageKitFileId: string | null;
  active: boolean;
}

export type ProductPatch = Partial<ProductFormData>;

export interface SaveProductVariables {
  body: ProductFormData | ProductPatch;
  id?: string;
}

export interface ImageKitAuthResponse {
  publicKey: string;
  signature: string;
  token: string;
  expire: number;
}

export interface ImageKitUploadOptions {
  folder?: string;
  fileName?: string;
}

export interface ImageKitUploadResponse {
  url: string;
  fileId: string | null;
}

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
export interface ProductResponse {
  product: Product;
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


export interface OrderSummary {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  
  previewItems: OrderPreviewItem[];
}



export interface Order {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
  
  previewItems: OrderPreviewItem[];
}

export interface OrderDetail {
  id: string;
  status: OrderStatus;
  totalCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  quantity: number;
  unitPriceCents: number;

  product: Product;
}

export interface OrdersResponse {
    orders: OrderSummary[];
}

export interface OrderDetailResponse {
    order: OrderDetail;
    items: OrderItem[];
}

