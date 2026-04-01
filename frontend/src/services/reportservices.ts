import api from "./baseapi";

// ─── Shared filter types ───────────────────────────────────────────────────
export interface DateRangeFilters {
  start_date?: string;
  end_date?: string;
}

export interface AdminFilters extends DateRangeFilters {
  user_id?: number | string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Sales Register
// ─────────────────────────────────────────────────────────────────────────────
export const getSalesRegisterService = async (
  filters: DateRangeFilters = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  const res = await api.get(`reports/sales-register/?${params}`);
  return res.data;
};

export const getAdminSalesRegisterService = async (
  filters: AdminFilters & { vendor_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  const res = await api.get(`admin/reports/sales-register/?${params}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Product Wise Sales Register
// ─────────────────────────────────────────────────────────────────────────────
export const getProductWiseSalesRegisterService = async (
  filters: DateRangeFilters & { product_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`reports/product-wise-sales/?${params}`);
  return res.data;
};

export const getAdminProductWiseSalesRegisterService = async (
  filters: AdminFilters & { product_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`admin/reports/product-wise-sales/?${params}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Purchase Register
// ─────────────────────────────────────────────────────────────────────────────
export const getPurchaseRegisterService = async (
  filters: DateRangeFilters & { vendor_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.vendor_id) params.append("vendor_id", String(filters.vendor_id));
  const res = await api.get(`reports/purchase-register/?${params}`);
  return res.data;
};

export const getAdminPurchaseRegisterService = async (
  filters: AdminFilters & { vendor_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  if (filters.vendor_id) params.append("vendor_id", String(filters.vendor_id));
  const res = await api.get(`admin/reports/purchase-register/?${params}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Product Wise Purchase Register
// ─────────────────────────────────────────────────────────────────────────────
export const getProductWisePurchaseRegisterService = async (
  filters: DateRangeFilters & {
    vendor_id?: number | string;
    product_id?: number | string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.vendor_id) params.append("vendor_id", String(filters.vendor_id));
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`reports/product-wise-purchase/?${params}`);
  return res.data;
};

export const getAdminProductWisePurchaseRegisterService = async (
  filters: AdminFilters & {
    vendor_id?: number | string;
    product_id?: number | string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  if (filters.vendor_id) params.append("vendor_id", String(filters.vendor_id));
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`admin/reports/product-wise-purchase/?${params}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Inventory Report
// ─────────────────────────────────────────────────────────────────────────────
export const getInventoryReportService = async (
  filters: DateRangeFilters & { product_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`reports/inventory/?${params}`);
  return res.data;
};

export const getAdminInventoryReportService = async (
  filters: AdminFilters & { product_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`admin/reports/inventory/?${params}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Receivable Report
// ─────────────────────────────────────────────────────────────────────────────
export const getReceivableReportService = async (
  filters: DateRangeFilters & {
    customer_id?: number | string;
    only_pending?: boolean;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.customer_id)
    params.append("customer_id", String(filters.customer_id));
  if (filters.only_pending) params.append("only_pending", "true");
  const res = await api.get(`reports/receivable/?${params}`);
  return res.data;
};

export const getAdminReceivableReportService = async (
  filters: AdminFilters & {
    customer_id?: number | string;
    only_pending?: boolean;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  if (filters.customer_id)
    params.append("customer_id", String(filters.customer_id));
  if (filters.only_pending) params.append("only_pending", "true");
  const res = await api.get(`admin/reports/receivable/?${params}`);
  return res.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Age Wise Receivable Report
// ─────────────────────────────────────────────────────────────────────────────
export const getAgeWiseReceivableReportService = async (
  filters: DateRangeFilters & { customer_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.customer_id)
    params.append("customer_id", String(filters.customer_id));
  const res = await api.get(`reports/age-wise-receivable/?${params}`);
  return res.data;
};

export const getAdminAgeWiseReceivableReportService = async (
  filters: AdminFilters & { customer_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.user_id) params.append("user_id", String(filters.user_id));
  if (filters.customer_id)
    params.append("customer_id", String(filters.customer_id));
  const res = await api.get(`admin/reports/age-wise-receivable/?${params}`);
  return res.data;
};

// 8. Shop Sales Register
export const getShopSalesRegisterService = async (
  filters: DateRangeFilters & { shop_owner_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  const res = await api.get(`reports/shop-sales-register/?${params}`);
  return res.data;
};

export const getAdminShopSalesRegisterService = async (
  filters: AdminFilters & {
    shop_owner_id?: number | string;
    manager_id?: number | string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.manager_id)
    params.append("manager_id", String(filters.manager_id));
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  const res = await api.get(`admin/reports/shop-sales-register/?${params}`);
  return res.data;
};

// 9. Product Wise Shop Sales Register
export const getProductWiseShopSalesRegisterService = async (
  filters: DateRangeFilters & {
    shop_owner_id?: number | string;
    product_id?: number | string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`reports/product-wise-shop-sales/?${params}`);
  return res.data;
};

export const getAdminProductWiseShopSalesRegisterService = async (
  filters: AdminFilters & {
    shop_owner_id?: number | string;
    product_id?: number | string;
    manager_id?: number | string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.manager_id)
    params.append("manager_id", String(filters.manager_id));
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  if (filters.product_id)
    params.append("product_id", String(filters.product_id));
  const res = await api.get(`admin/reports/product-wise-shop-sales/?${params}`);
  return res.data;
};

// 10. Shop Receivable Report
export const getShopReceivableReportService = async (
  filters: DateRangeFilters & {
    shop_owner_id?: number | string;
    only_pending?: boolean;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  if (filters.only_pending) params.append("only_pending", "true");
  const res = await api.get(`reports/shop-receivable/?${params}`);
  return res.data;
};

export const getAdminShopReceivableReportService = async (
  filters: AdminFilters & {
    shop_owner_id?: number | string;
    manager_id?: number | string;
    only_pending?: boolean;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.manager_id)
    params.append("manager_id", String(filters.manager_id));
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  if (filters.only_pending) params.append("only_pending", "true");
  const res = await api.get(`admin/reports/shop-receivable/?${params}`);
  return res.data;
};

// 11. Age Wise Shop Receivable Report
export const getAgeWiseShopReceivableReportService = async (
  filters: DateRangeFilters & { shop_owner_id?: number | string } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  const res = await api.get(`reports/age-wise-shop-receivable/?${params}`);
  return res.data;
};

export const getAdminAgeWiseShopReceivableReportService = async (
  filters: AdminFilters & {
    shop_owner_id?: number | string;
    manager_id?: number | string;
  } = {},
) => {
  const params = new URLSearchParams();
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  if (filters.manager_id)
    params.append("manager_id", String(filters.manager_id));
  if (filters.shop_owner_id)
    params.append("shop_owner_id", String(filters.shop_owner_id));
  const res = await api.get(
    `admin/reports/age-wise-shop-receivable/?${params}`,
  );
  return res.data;
};
