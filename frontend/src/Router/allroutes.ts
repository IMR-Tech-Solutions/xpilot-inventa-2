export const all_routes = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  signIn: "/signin",
  signUp: "/signup",
  resetpassword: "/reset-password",

  // ── Core ──────────────────────────────────────────────────────────────────
  home: "/",
  profile: "/profile",

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: "/orders",
  createorders: "/new-order",

  // ── Products & Categories ─────────────────────────────────────────────────
  products: "/products",
  addproducts: "/add-products",
  categories: "/categories",
  addcategories: "/add-categories",

  // ── Stock Management ──────────────────────────────────────────────────────
  addstock: "/add-stock",
  managestock: "/manage-stock",
  manageproductstock: "/manage-stock/product/:productID",
  stockalert: "/stock-alerts",
  purchaseinvoice: "/purchase-inovice",

  // ── Product Units ─────────────────────────────────────────────────────────
  addunit: "/add-unit",
  allunits: "/all-unit",

  // ── Customers ─────────────────────────────────────────────────────────────
  customer: "/customers",
  addcustomer: "/add-customers",

  // ── Vendors ───────────────────────────────────────────────────────────────
  vendors: "/vendors",
  addvendors: "/add-vendors",

  // ── Brokers ───────────────────────────────────────────────────────────────
  addbroker: "/add-broker",
  allbrokers: "/brokers",
  brokercommission: "/broker-commission/:invoiceId",

  // ── Transporters ──────────────────────────────────────────────────────────
  addtransporter: "/add-transporter",
  alltransporters: "/all-transporters",

  // ── Shop (Shop Owner) ─────────────────────────────────────────────────────
  shop: "/shop",
  shopownerorders: "/shop/orders",
  shopownerorderstatus: "/shop/order/:orderID",
  shopownerproducts: "/shop/products/",
  shopownerproducthistory: "/shop/product/:productID",
  shopownerpos: "/shop/pos",

  // ── Shop Order Requests (Manager) ─────────────────────────────────────────
  shoprequests: "/shop/orders/request",
  shoporders: "/shop-orders",

  // ── Reports ───────────────────────────────────────────────────────────────
  salesreport: "/reports/sales",
  purchasereport: "/reports/purchase",
  brokerreport: "/reports/broker",

  // ── Notifications ─────────────────────────────────────────────────────────
  notifications: "/notifications",

  // ── Chat ──────────────────────────────────────────────────────────────────
  chat: "/chat",

  // ── Misc / Dev ────────────────────────────────────────────────────────────
  calendar: "/calendar",
  blank: "/blank",
  formElements: "/form-elements",
  basicTables: "/basic-tables",
  alerts: "/alerts",
  avatars: "/avatars",
  badge: "/badge",
  buttons: "/buttons",
  images: "/images",
  videos: "/videos",
  lineChart: "/line-chart",
  barChart: "/bar-chart",
  pos: "/pos",
};
