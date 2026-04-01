export interface BrokerCommissionReportFilters {
  broker_id?: number;
  start_date?: string;
  end_date?: string;
  filter_type?: string;
}

export interface BrokerCommissionReportResponse {
  success: boolean;
  data: {
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
      total_days: number;
    };
    filtered_broker_id: number | null;
    target_broker_name: string;
    summary: {
      total_commission_earned: number;
      total_batches: number;
      total_purchase_value: number;
      average_commission_per_batch: number;
      commission_percentage_of_purchases: number;
      daily_average_commission: number;
      unique_brokers: number;
    };
    broker_breakdown: Array<{
      broker_id: number;
      broker_name: string;
      commission_earned: number;
      batches_count: number;
      percentage_of_total: number;
    }>;
    trends: Array<{
      period: string;
      commission_earned: number;
      batches_count: number;
    }>;
    batch_details: Array<{
      batch_id: number;
      product_id: number;
      product_name: string;
      product_sku: string;
      vendor_name: string;
      broker_id: number;
      broker_name: string;
      quantity: number;
      original_quantity: number;
      purchase_price: number;
      total_purchase_value: number;
      commission_percent: number;
      commission_amount: number;
      reference_number: string;
      created_at: string;
      batch_status: string;
    }>;
  };
  message: string;
}

export interface TaxReportFilters {
  start_date?: string;
  end_date?: string;
  filter_type?: string;
}

export interface TaxReportResponse {
  success: boolean;
  data: {
    filter_type: string;
    date_range: {
      start_date: string | null;
      end_date: string | null;
      total_days: number;
    };
    summary: {
      total_tax_paid: number;
      total_batches_with_tax: number;
      total_purchase_value: number;
      tax_percentage_of_purchases: number;
      average_tax_per_batch: number;
      daily_average_tax: number;
      unique_vendors: number;
    };
    vendor_breakdown: Array<{
      vendor_id: number;
      vendor_name: string;
      tax_paid: number;
      batches_count: number;
      percentage_of_total: number;
    }>;
    trends: Array<{
      period: string;
      tax_paid: number;
      batches_count: number;
    }>;
    batch_details: Array<{
      batch_id: number;
      product_id: number;
      product_name: string;
      product_sku: string;
      vendor_id: number;
      vendor_name: string;
      broker_name: string;
      quantity: number;
      original_quantity: number;
      purchase_price: number;
      total_purchase_value: number;
      tax_amount: number;
      tax_percentage_of_purchase: number;
      reference_number: string;
      created_at: string;
      batch_status: string;
    }>;
  };
  message: string;
}

export interface AdminTaxReportFilters {
  user_id?: number;
  start_date?: string;
  end_date?: string;
  filter_type?: string;
}

export interface AdminTaxReportResponse {
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
    summary: {
      total_tax_paid: number;
      total_batches_with_tax: number;
      total_purchase_value: number;
      tax_percentage_of_purchases: number;
      average_tax_per_batch: number;
      daily_average_tax: number;
      unique_users: number;
    };
    user_breakdown: Array<{
      user_id: number;
      user_name: string;
      tax_paid: number;
      batches_count: number;
      percentage_of_total: number;
    }>;
    trends: Array<{
      period: string;
      tax_paid: number;
      batches_count: number;
    }>;
    batch_details: Array<{
      batch_id: number;
      user_id: number;
      user_name: string;
      product_id: number;
      product_name: string;
      product_sku: string;
      vendor_id: number;
      vendor_name: string;
      broker_name: string;
      quantity: number;
      original_quantity: number;
      purchase_price: number;
      total_purchase_value: number;
      tax_amount: number;
      tax_percentage_of_purchase: number;
      reference_number: string;
      created_at: string;
      batch_status: string;
    }>;
  };
  message: string;
}

export interface CustomerReportFilters {
  start_date?: string;
  end_date?: string;
  filter_type?: string;
  customer_type?: string;
}

export interface AdminCustomerReportFilters {
  start_date?: string;
  end_date?: string;
  filter_type?: string;
  customer_type?: string;
}
