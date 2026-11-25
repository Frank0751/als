// Shared types for the ALS platform

export type PriceTier = { minQty: number; price: number; label: string };

export type ProductDTO = {
  id: string;
  kind: "FINGERLING" | "MARKET";
  name: string;
  category: string;
  description: string;
  spec: string | null;
  price: number;
  unit: string;
  stock: number;
  imageUrl: string | null;
  priceTiers: PriceTier[] | null;
  featured: boolean;
};

export type ReviewDTO = {
  id: string;
  productId: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export type CollectionDateDTO = {
  id: string;
  date: string;
  isOpen: boolean;
  capacity: number;
  booked: number;
  note: string | null;
};

export type DeliveryAreaDTO = { id: string; name: string; fee: number };

export type SessionDTO = {
  id: string;
  courseId: string;
  date: string;
  timeText: string;
  location: string;
  seats: number;
  booked: number;
};

export type CourseDTO = {
  id: string;
  title: string;
  type: string;
  description: string;
  fee: number;
  durationText: string;
  covers: string[];
  imageUrl: string | null;
  sessions: SessionDTO[];
};

export type CatalogDTO = {
  products: ProductDTO[];
  reviews: ReviewDTO[];
  collectionDates: CollectionDateDTO[];
  deliveryAreas: DeliveryAreaDTO[];
  courses: CourseDTO[];
  content: Record<string, string>;
};

export type OrderItemDTO = {
  kind: string; // FINGERLING | MARKET | TRAINING
  refId: string;
  name: string;
  variant: string;
  qty: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
  date?: string | null;
};

export type OrderEventDTO = {
  id: string;
  status: string;
  note: string | null;
  actor: string | null;
  createdAt: string;
};

export type ProofDTO = {
  id: string;
  name: string;
  uploadedAt: string;
};

export type OrderDTO = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  customerCity: string | null;
  fulfilment: "PICKUP" | "DELIVERY";
  areaName: string | null;
  areaFee: number;
  deliveryDate: string | null;
  items: OrderItemDTO[];
  subtotal: number;
  total: number;
  status: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  receiptCode: string | null;
  receiptIssuedAt: string | null;
  whatsappSent: boolean;
  notes: string | null;
  createdAt: string;
  events: OrderEventDTO[];
  proofs: ProofDTO[];
};

export type BookingDTO = {
  id: string;
  reference: string;
  sessionId: string;
  courseTitle: string;
  courseType: string;
  date: string;
  timeText: string;
  location: string;
  seats: number;
  total: number;
  status: string;
  customerName: string;
  phone: string;
  email: string | null;
  createdAt: string;
};

export type StaffDTO = { id: string; username: string; name: string; role: string };

export type AuditDTO = { id: string; actor: string; action: string; detail: string | null; createdAt: string };

export type EmailDTO = { id: string; toEmail: string; subject: string; body: string; kind: string; createdAt: string };

export type AdminOrdersDTO = { orders: OrderDTO[]; demand: { id: string; name: string; phone: string; productName: string; createdAt: string }[]; quotes: { id: string; name: string; org: string | null; phone: string; email: string | null; message: string; createdAt: string }[]; inbox: { id: string; name: string; email: string | null; phone: string | null; subject: string; message: string; createdAt: string }[] };

export type ReportsDTO = {
  byDay: { date: string; total: number; count: number }[];
  byMethod: { method: string; total: number }[];
  byProduct: { name: string; total: number; qty: number }[];
  totals: { revenue: number; orders: number; fingerlingsSold: number; completed: number };
};
