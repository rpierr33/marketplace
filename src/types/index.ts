export type {
  UserModel as User,
  SellerModel as Seller,
  ProductModel as Product,
  OrderModel as Order,
  OrderItemModel as OrderItem,
  PaymentModel as Payment,
  ReviewModel as Review,
} from "@/generated/prisma/models";
export { UserRole, OrderStatus, PaymentStatus } from "@/generated/prisma/enums";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  imageUrl: string | null;
  quantity: number;
  sellerId: string;
  sellerName: string;
}

export interface ProductWithSeller {
  id: string;
  title: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  seller: {
    id: string;
    storeName: string;
    isVerified: boolean;
  };
  reviews: {
    rating: number;
  }[];
  _count?: {
    reviews: number;
  };
}

export interface OrderWithItems {
  id: string;
  status: string;
  total: number;
  createdAt: Date;
  items: {
    id: string;
    quantity: number;
    price: number;
    product: {
      id: string;
      title: string;
      imageUrl: string | null;
    };
  }[];
  payment: {
    status: string;
  } | null;
}

export interface SellerDashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  recentOrders: OrderWithItems[];
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}
