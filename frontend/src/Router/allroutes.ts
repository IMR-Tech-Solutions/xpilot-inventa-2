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
  posorderstatement: "/orders/:orderID/statement",
  shoporderstatement: "/shop-orders/:orderID/statement",

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
  customerdetail: "/customers/:id",

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

  // ── Shop to Shop (S2S) ───────────────────────────────────────────────────
  s2spurchase: "/shop/s2s/purchase",
  s2sbuyerorders: "/shop/s2s/orders",
  s2sbuyerorderdetail: "/shop/s2s/order/:orderID",
  s2ssellerincoming: "/shop/s2s/incoming",
  s2sreport: "/shop/s2s/report",

  // ── Shop Order Requests (Manager) ─────────────────────────────────────────
  shoprequests: "/shop/orders/request",
  shoporders: "/shop-orders",

  // ── Reports ───────────────────────────────────────────────────────────────
  salesreport: "/reports/sales",
  purchasereport: "/reports/purchase",
  brokerreport: "/reports/broker",
  transporterreport: "/reports/transporter",
  franchisereport: "/reports/franchise",
  shopownerpurchasereport: "/shop/reports/purchase",

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
