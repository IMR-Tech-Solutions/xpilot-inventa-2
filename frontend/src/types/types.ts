export type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: {
    name: string;
    path: string;
    pro?: boolean;
    new?: boolean;
    module: string;
  }[];
  module?: string;
};

export interface CategoryData {
  id: number;
  user: string;
  category_name: string;
  category_image: string;
  user_name?: string;
}

export interface RoleData {
  role_id: number;
  role_name: string;
}

export interface UserData {
  id: number;
  email: string;
  mobile_number: string;
  first_name: string;
  last_name: string;
  user_type: number;
  user_type_name: string;
  country: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  user_image: string;
  business_name: string | null,
}

export interface BrokerDataType {
  id: number;
  broker_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  pan_number?: string;
  gst_number?: string;
  license_number?: string;
  default_commission_amount?: string;
  is_active?: boolean;
  total_commission_earned?: number;
  active_stock_batches_count?: number;
  created_at?: string;
}

export interface ProductData {
  id: number;
  product_name: string;
  description?: string;
  unit: string;
  low_stock_threshold: number;
  is_active: boolean;
  product_image: string;
  category: number;
  category_name: string;
  user?: number;
  user_name?: string;
  sku_code: string;
  unit_name: string;
  selling_price: string | null;
  current_stock: number;
}

export interface VendorData {
  id: number;
  user_name: string;
  vendor_name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  gst_number: string | null;
  pan_number: string | null;
  registration_number: string | null;
  address: string | null;
  state: string | null;
  city: string | null;
  postal_code: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user: number;
}

// to send payload to API to add stock (legacy batch - kept for reference)
export interface StockBatch {
  product: number;
  reference_number: string;
  quantity: number;
  purchase_price: string;
  selling_price: string;
  manufacture_date: string;
  expiry_date: string;
  broker?: number;
  broker_commission_amount?: number;
  tax_amount?: string;
  weight_unit?: string;
}

// to send payload to API to add stock (legacy)
export interface StockBatchData {
  vendor_id: number;
  transporter_id?: number | null;
  transporter_cost?: string;
  varne_cost?: string;
  labour_cost?: string;
  stock_batches: StockBatch[];
}

// New StockEntry payload for POST stock/add/
export interface StockEntryPayload {
  vendor: number;
  product: number;
  quantity: number;
  purchase_price: string;
  cgst_percentage?: string;
  sgst_percentage?: string;
  varne_cost?: string;
  labour_cost?: string;
  transporter?: number | null;
  transporter_cost?: string;
  broker?: number | null;
  broker_commission_amount?: string;
  manufacture_date?: string;
}

export interface TransporterData {
  id: number;
  transporter_name: string;
  contact_person: string;
  contact_number: string;
  email: string;
  gst_number?: string | null;
  pan_number?: string | null;
  vehicle_number?: string | null;
  address?: string | null;
  state?: string | null;
  city?: string | null;
  postal_code?: string | null;
  bank_name?: string | null;
  account_number?: string | null;
  ifsc_code?: string | null;
  upi_id?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Stock entry list item (from GET stock/)
export interface StockEntryItem {
  id: number;
  product: number;
  product_name: string;
  vendor: number;
  vendor_name: string;
  quantity: number;
  purchase_price: string;
  broker: number | null;
  broker_name: string | null;
  transporter: number | null;
  transporter_name: string | null;
  invoice_number: string | null;
  manufacture_date: string;
  created_at: string;
}

// Stock entry detail (from GET stock/<id>/ or inside product entries)
export interface StockEntryDetail {
  id: number;
  product: number;
  product_name: string;
  vendor: number;
  vendor_name: string;
  vendor_invoice: number | null;
  invoice_number: string | null;
  quantity: number;
  purchase_price: string;
  cgst_percentage: string | null;
  cgst: string | null;
  sgst_percentage: string | null;
  sgst: string | null;
  varne_cost: string | null;
  labour_cost: string | null;
  transporter: number | null;
  transporter_name: string | null;
  transporter_cost: string | null;
  broker: number | null;
  broker_name: string | null;
  broker_commission_amount: string | null;
  manufacture_date: string;
  created_at: string;
}

// Response from GET stock/product/<id>/
export interface ProductStockEntriesResponse {
  product_id: number;
  product_name: string;
  current_stock: number;
  stock_entries: StockEntryDetail[];
}

// ── Legacy batch types kept for any remaining references ──────────────────
export interface ProductStockBatch {
  product_id: number;
  product_name: string;
  active_batches: {
    batch_id: number;
    reference_number?: string;
    quantity: number;
    original_quantity: number;
    purchase_price: number;
    selling_price: number;
    manufacture_date: string;
    expiry_date: string;
    vendor_id: number;
    vendor_name: string;
  }[];
}

export interface ProductStockBatchResponse {
  product_id: number;
  product_name: string;
  total_batches: number;
  active_batches: number;
  total_quantity: number;
  total_active_quantity: number;
  stock_batches: ParticularProductStockBatch[];
}

export interface ParticularProductStockBatch {
  id: number;
  vendor: number;
  vendor_name: string;
  product: number;
  product_name: string;
  reference_number?: string;
  quantity: number;
  purchase_price: string;
  selling_price: string;
  purchase_invoice_number: string;
  manufacture_date: string;
  expiry_date: string;
  batch_status: string;
  is_expired: boolean;
  created_at: string;
}

export interface VendorInvoiceData {
  id: number;
  invoice_number: string;
  vendor_name: string;
  total_amount: string;
  items_count: number;
  created_at: string;
}

export interface CustomerData {
  id: number;
  user: number;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  village: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  date_of_birth: string | null; // ISO string or null
  gender: string;
  num_of_animals: number;
  type_of_customer: string;
  customer_image: string;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

export interface OrderItem {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  total_amount: string;
  amount_paid: string;
  remaining_amount: string;
  items_count: number;
  created_at: string;
}

export interface POSOrderItem {
  product: number;
  quantity: number;
  unit_price: string;
}

export interface POSOrderPayload {
  id?: number;
  customer: number;
  order_items: POSOrderItem[];
  order_status:
    | "pending"
    | "confirmed"
    | "processing"
    | "ready"
    | "completed"
    | "cancelled";
  payment_status: "pending" | "paid" | "partial" | "failed" | "refunded";
  payment_method: "cash" | "card" | "upi" | "bank_transfer" | "credit" | "mix";
  cgst_percentage: number;
  sgst_percentage: number;
  discount_amount: string;
  transport_charges: string;
  labour_charges: string;
  amount_paid: string;
  online_amount?: string;
  offline_amount?: string;
  notes?: string;
}

//sending shop order
export interface ShopOrderPayload {
  order_items: {
    product: number;
    requested_quantity: number;
  }[];
  notes?: string;
}

//receving shop order
export interface ShopOrderRequestPayload {
  id: number;
  product_name: string;
  requested_quantity: number;
  offered_price: number | null;
  status: string;
  shop_owner_name: string;
  order_number: string;
  created_at: string;
}

//viewing shop order
export interface ShopOrderRequestDetailedView {
  request_details: {
    id: number;
    product: number;
    product_name: string;
    product_sku: string;
    requested_quantity: number;
    offered_price: number | null;
    status: string;
    shop_owner_name: string;
    order_number: string;
    manager_response_notes: string | null;
    response_date: string | null;
    created_at: string;
  };
  stock_info: {
    available_quantity: number;
    requested_quantity: number;
    can_fulfill_fully: boolean;
    shortage: number;
    product_selling_price: number | null;
  };
}

//shop owner orders
export interface ShopOwnerOrder {
  id: number;
  order_number: string;
  shop_owner_name: string;
  status: string;
  total_amount: string;
  items_count: number;
  created_at: string;
}

export interface ShopOwnerOrderItemDetail {
  product: number;
  product_name: string;
  product_sku: string;
  requested_quantity: number;
  expected_price: string | null;
}

export interface ShopOwnerOrderDetailsType {
  order: {
    id: number;
    order_number: string;
    shop_owner_name: string;
    status: string;
    total_amount: string;
    notes: string;
    order_items_details: ShopOwnerOrderItemDetail[];
    created_at: string;
  };
}

export interface ShopPurchasedProduct {
  id: number;
  product: number;
  product_name: string;
  product_sku: string;
  product_image?: string;
  category_name: string;
  quantity: number;
  purchase_price: string;
  selling_price: string;
  is_active: boolean;
  source_manager_name: string;
  purchase_date: string;
}

export interface EcommerceMetricsResponse {
  total_orders: number;
  total_customers: number;
  orders_comparison: ComparisonData;
  customers_comparison: ComparisonData;
}

interface ComparisonData {
  this_month: number;
  last_month: number;
  percentage_change: number;
}

export interface ReportFilters {
  start_date?: string;
  end_date?: string;
  filter_type?: "day" | "month" | "year";
}

export interface AdminReportFilters extends ReportFilters {
  user_id?: number;
}

export interface SalesReportResponse {
  success: boolean;
  data: {
    filter_type: string;
    filtered_user_id?: number | null;
    date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    summary: {
      total_sales: number;
      total_orders: number;
      average_order_value: number;
    };
    trends: Array<{
      period: string;
      sales: number;
      orders: number;
    }>;
    top_performers?: Array<{
      user_id: number;
      username: string;
      total_sales: number;
      total_orders: number;
    }>;
  };
  message: string;
}

export interface PurchaseReportFilters {
  vendor_id?: number;
  start_date?: string;
  end_date?: string;
  filter_type?: "day" | "month" | "year";
}

export interface PurchaseReportResponse {
  success: boolean;
  data: {
    vendor: {
      id: number | null;
      name: string;
      contact_person: string | null;
    };
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    summary: {
      total_quantity_purchased: number;
      total_amount_spent: number;
      total_batches: number;
      average_batch_value: number;
    };
    trends: Array<{
      period: string;
      quantity_purchased: number;
      amount_spent: number;
      batches_count: number;
    }>;
    products: Array<{
      product_id: number;
      product_name: string;
      total_quantity: number;
      total_amount: number;
    }>;
    vendor_breakdown: Array<{
      vendor_id: number;
      vendor_name: string;
      total_quantity: number;
      total_amount: number;
      total_batches: number;
    }>;
  };
  message: string;
}

export interface AdminPurchaseReportFilters {
  vendor_id?: number;
  user_id?: number;
  start_date?: string;
  end_date?: string;
  filter_type?: "day" | "month" | "year";
}

export interface AdminPurchaseReportResponse {
  success: boolean;
  data: {
    filters_applied: {
      vendor: {
        id: number | null;
        name: string;
      };
      manager: {
        id: number | null;
        name: string;
      };
      date_range: {
        start_date: string | null;
        end_date: string | null;
      };
      filter_type: string;
    };
    system_summary: {
      total_quantity_purchased: number;
      total_amount_spent: number;
      total_batches: number;
      average_batch_value: number;
      active_managers: number;
      active_vendors: number;
      unique_products: number;
    };
    trends: Array<{
      period: string;
      quantity_purchased: number;
      amount_spent: number;
      batches_count: number;
    }>;
    top_vendors: Array<{
      vendor_id: number;
      vendor_name: string;
      total_quantity: number;
      total_amount: number;
      total_batches: number;
    }>;
    top_managers: Array<{
      manager_id: number;
      manager_name: string;
      total_quantity: number;
      total_amount: number;
      total_batches: number;
    }>;
    products: Array<{
      product_id: number;
      product_name: string;
      total_quantity: number;
      total_amount: number;
    }>;
  };
  message: string;
}

export interface ShopPurchaseReportFilters {
  manager_id?: number;
  start_date?: string;
  end_date?: string;
  filter_type?: "day" | "month" | "year";
}

export interface ShopPurchaseReportResponse {
  success: boolean;
  data: {
    manager: {
      id: number | null;
      name: string;
    };
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
    };
    summary: {
      total_quantity_purchased: number;
      total_amount_spent: number;
      total_items: number;
      average_item_value: number;
    };
    trends: Array<{
      period: string;
      quantity_purchased: number;
      amount_spent: number;
      items_count: number;
    }>;
    products: Array<{
      product_id: number;
      product_name: string;
      manager_id: number;
      manager_name: string;
      total_quantity: number;
      total_amount: number;
    }>;
    manager_breakdown: Array<{
      manager_id: number;
      manager_name: string;
      total_quantity: number;
      total_amount: number;
      total_items: number;
      unique_products: number;
    }>;
  };
  message: string;
}

export interface AdminShopPurchaseReportFilters {
  shop_owner_id?: number;
  manager_id?: number;
  start_date?: string;
  end_date?: string;
  filter_type?: "day" | "month" | "year";
}

export interface AdminShopPurchaseReportResponse {
  success: boolean;
  data: {
    filters_applied: {
      shop_owner_id: number | null;
      manager_id: number | null;
      date_range: {
        start_date: string | null;
        end_date: string | null;
      };
      filter_type: string;
    };
    summary: {
      total_quantity_purchased: number;
      total_amount_spent: number;
      total_items: number;
      average_item_value: number;
      active_shop_owners: number;
      active_managers: number;
    };
    trends: Array<{
      period: string;
      quantity_purchased: number;
      amount_spent: number;
      items_count: number;
    }>;
    products: Array<{
      product_id: number;
      product_name: string;
      manager_id: number;
      manager_name: string;
      shop_owner_id: number;
      shop_owner_name: string;
      total_quantity: number;
      total_amount: number;
    }>;
  };
  message: string;
}

export interface ManagerProductSalesReportFilters {
  start_date?: string;
  end_date?: string;
  filter_type?: "day" | "month" | "year";
  shop_owner_id?: string;
}

export interface ManagerProductSalesReportResponse {
  success: boolean;
  data: {
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
      total_days: number;
    };
    filtered_shop_owner_id: string;
    summary: {
      total_quantity_sold: number;
      total_revenue_earned: number;
      total_items_sold: number;
      unique_products_sold: number;
      unique_shop_owners_served: number;
      average_item_value: number;
      daily_average_quantity: number;
      daily_average_revenue: number;
    };
    trends: Array<{
      period: string;
      quantity_sold: number;
      revenue_earned: number;
      items_sold: number;
    }>;
    products: Array<{
      product_id: number;
      product_name: string;
      total_quantity_sold: number;
      total_revenue: number;
      total_orders: number;
      shop_owners_bought: number;
      avg_daily_quantity: number;
      avg_daily_revenue: number;
      sales_velocity: string;
    }>;
    shop_owners: Array<{
      shop_owner_id: number;
      shop_owner_name: string;
      total_quantity_bought: number;
      total_revenue_generated: number;
      total_orders: number;
      unique_products_bought: number;
    }>;
  };
  message: string;
}

export interface InventoryReportFilters {
  start_date?: string;
  end_date?: string;
  status?: string;
  filter_type?: string;
}

export interface InventoryReportResponse {
  success: boolean;
  data: {
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
      total_days: number;
    };
    filtered_status: string | null;
    summary: {
      total_batches: number;
      total_stock_value: number;
      total_commission: number;
      total_tax: number;
      total_with_tax: number;
      average_batch_value: number;
      active_batches: number;
      expired_batches: number;
    };
    status_breakdown: Array<{
      status: string;
      status_label: string;
      count: number;
      percentage: number;
    }>;
    products_by_status: Array<{
      status: string;
      status_label: string;
      count: number;
      products: Array<{
        batch_id: number;
        product_name: string;
        quantity: number;
        original_quantity: number;
        purchase_price: number;
        selling_price: number;
        vendor_name: string;
        broker_name: string;
        expiry_date: string;
        batch_status: string;
        batch_status_label: string;
      }>;
    }>;
  };
  message: string;
}

export interface AdminInventoryReportFilters {
  user_id?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  filter_type?: string;
}

export interface AdminInventoryReportResponse {
  success: boolean;
  data: {
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
      total_days: number;
    };
    filtered_user_id: number | null;
    target_user_name: string;
    filtered_status: string | null;
    summary: {
      total_batches: number;
      total_stock_value: number;
      total_commission: number;
      total_tax: number;
      total_with_tax: number;
      average_batch_value: number;
      active_batches: number;
      expired_batches: number;
    };
    status_breakdown: Array<{
      status: string;
      status_label: string;
      count: number;
      percentage: number;
    }>;
    products_by_status: Array<{
      status: string;
      status_label: string;
      count: number;
      products: Array<{
        batch_id: number;
        product_id: number;
        product_name: string;
        product_sku: string;
        quantity: number;
        original_quantity: number;
        purchase_price: number;
        selling_price: number;
        vendor_name: string;
        broker_name: string;
        broker_commission: number;
        tax_amount: number;
        reference_number: string;
        manufacture_date: string;
        expiry_date: string;
        created_at: string;
        is_expired: boolean;
        batch_status: string;
        batch_status_label: string;
        user_id: number;
        user_name: string;
      }>;
    }>;
  };
  message: string;
}
