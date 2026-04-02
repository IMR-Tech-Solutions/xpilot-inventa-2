import { lazy } from "react";
import { all_modules } from "../modules/modules";
import { all_routes } from "./allroutes";
import { admin_modules } from "../modules/adminmodules";
import { admin_routes } from "./adminRoutes";
//////////////////////////////////////////////////////////// Reports
const SalesReport = lazy(
  () => import("../pages/Reports/sales-report/SalesReport"),
);
const AdminSalesReport = lazy(
  () => import("../Admin/Reports/adminsalesreport/AdminSalesReport"),
);
const PurchaseReport = lazy(
  () => import("../pages/Reports/purchasereport/PurchaseReport"),
);
const AdminPurchaseReport = lazy(
  () => import("../Admin/Reports/adminpurchasereport/AdminPurchaseReport"),
);
const BrokerReport = lazy(
  () => import("../pages/Reports/brokerreport/BrokerReport"),
);
const AdminBrokerReport = lazy(
  () => import("../Admin/Reports/adminbrokerreport/AdminBrokerReport"),
);
const FranchiseReport = lazy(
  () => import("../pages/Reports/franchisereport/FranchiseReport"),
);
const AdminFranchiseReport = lazy(
  () => import("../Admin/Reports/adminfranchisereport/AdminFranchiseReport"),
);
//////////////////////////////////////////////////////////// Reports
const Purchaseinvoice = lazy(
  () => import("../pages/Purchaseinvoice/Purchaseinvoice"),
);

const AddTransporter = lazy(
  () => import("../pages/Transporter/AddTrasnporter"),
);
const AllTrasnporters = lazy(
  () => import("../pages/Transporter/AllTrasnporters"),
);
const ViewUnit = lazy(() => import("../pages/ProductUnits/ViewUnit"));
const AddUnit = lazy(() => import("../pages/ProductUnits/AddUnit"));
const BrokerCommissionDetails = lazy(
  () => import("../pages/Purchaseinvoice/BrokerCommissionDetails"),
);
const AddBroker = lazy(() => import("../pages/Broker/AddBroker"));
const Brokers = lazy(() => import("../pages/Broker/Brokers"));

const ResetPassword = lazy(
  () => import("../pages/ResetPassword/ResetPasswordLayout"),
);
const SignIn = lazy(() => import("../pages/AuthPages/SignIn"));
const SignUp = lazy(() => import("../pages/AuthPages/SignUp"));
const Home = lazy(() => import("../pages/Dashboard/Home"));
const UserProfiles = lazy(() => import("../pages/UserProfiles"));
const Videos = lazy(() => import("../pages/UiElements/Videos"));
const Images = lazy(() => import("../pages/UiElements/Images"));
const Alerts = lazy(() => import("../pages/UiElements/Alerts"));
const Badges = lazy(() => import("../pages/UiElements/Badges"));
const Avatars = lazy(() => import("../pages/UiElements/Avatars"));
const Buttons = lazy(() => import("../pages/UiElements/Buttons"));
const LineChart = lazy(() => import("../pages/Charts/LineChart"));
const BarChart = lazy(() => import("../pages/Charts/BarChart"));
const Calendar = lazy(() => import("../pages/Calendar"));
const BasicTables = lazy(() => import("../pages/Tables/BasicTables"));
const FormElements = lazy(() => import("../pages/Forms/FormElements"));
const Blank = lazy(() => import("../pages/Blank"));
const Orders = lazy(() => import("../pages/Orders/Orders"));
const Createorders = lazy(() => import("../pages/Orders/Createorder"));
const Products = lazy(() => import("../pages/Product/Products"));
const Addproducts = lazy(() => import("../pages/Product/Addproducts"));
const Categories = lazy(() => import("../pages/Category/Categories"));
const Addcategories = lazy(() => import("../pages/Category/Addcategories"));
const Customers = lazy(() => import("../pages/Customer/Customers"));
const Addcustomer = lazy(() => import("../pages/Customer/Addcustomer"));
const Vendor = lazy(() => import("../pages/Vendors/Vendor"));
const Addvendors = lazy(() => import("../pages/Vendors/Addvendors"));

// Admin
const Roles = lazy(() => import("../Admin/Roles/Roles"));
const Rolepermissions = lazy(() => import("../Admin/Roles/Rolepermissions"));
const Users = lazy(() => import("../Admin/Users/Users"));
const AdminHome = lazy(() => import("../Admin/Home/AdminHome"));
const Allcategories = lazy(() => import("../Admin/Categories/Allcategories"));
const AdminProducts = lazy(() => import("../Admin/Products/Products"));
const AllUsersData = lazy(
  () => import("../Admin/Pages/AllUsersData/AllUsersData"),
);
const AllStockManagement = lazy(
  () => import("../Admin/Pages/AllStockManagement/AllStockManagement"),
);

// Chat
const Chat = lazy(() => import("../pages/Chat/Chat"));

//  s
const Addstock = lazy(() => import("../pages/Stocks/Addstock"));
const Managestock = lazy(() => import("../pages/Stocks/Managestock"));
const Stockalert = lazy(() => import("../pages/Stocks/Stockalert"));
const ProductStock = lazy(() => import("../pages/Stocks/ProductStock"));

// Notifications
const Notifications = lazy(
  () => import("../pages/Notifications/Notifications"),
);

// POS & Shop
const Pos = lazy(() => import("../POS/Pos"));
const Shop = lazy(() => import("../Shop/Shop"));
const ShopOrderRequest = lazy(
  () => import("../Shop/ShopOrderRequest/ShopOrderRequest"),
);
const AllShopOrders = lazy(
  () => import("../Shop/ShopOrderRequest/AllShopOrders"),
);
const ShopOwnerOrders = lazy(
  () => import("../Shop/ShopOwnerOrders/ShopOwnerOrders"),
);
const ShopOwnerOrderStatus = lazy(
  () => import("../Shop/ShopOwnerOrders/ShopOwnerOrderStatus"),
);
const ShopOwnerProducts = lazy(
  () => import("../Shop/ShopOwnerProducts/ShopOwnerProducts"),
);
const ShopownerProductHistory = lazy(
  () => import("../Shop/ShopOwnerProducts/ShopownerProductHistory"),
);
const ShopOwnerPOS = lazy(() => import("../Shop/ShopOwnerPOS/ShopOwnerPOS"));

export const websiteRoutes = [
  {
    id: "1",
    name: "Dashboard",
    link: all_routes.home,
    module: all_modules.home,
    element: <Home />,
  },
  {
    id: "2",
    name: "Orders",
    link: all_routes.orders,
    module: all_modules.orders,
    element: <Orders />,
  },
  {
    id: "3",
    name: "Calendar",
    link: all_routes.calendar,
    module: all_modules.calendar,
    element: <Calendar />,
  },
  {
    id: "4",
    name: "User Profiles",
    link: all_routes.profile,
    module: all_modules.profile,
    element: <UserProfiles />,
  },
  {
    id: "5",
    name: "Blank",
    link: all_routes.blank,
    module: all_modules.blank,
    element: <Blank />,
  },
  {
    id: "6",
    name: "Form Elements",
    link: all_routes.formElements,
    module: all_modules.forms,
    element: <FormElements />,
  },
  {
    id: "7",
    name: "Basic Tables",
    link: all_routes.basicTables,
    module: all_modules.tables,
    element: <BasicTables />,
  },
  {
    id: "8",
    name: "Alerts",
    link: all_routes.alerts,
    module: all_modules.ui,
    element: <Alerts />,
  },
  {
    id: "9",
    name: "Avatars",
    link: all_routes.avatars,
    module: all_modules.ui,
    element: <Avatars />,
  },
  {
    id: "10",
    name: "Badges",
    link: all_routes.badge,
    module: all_modules.ui,
    element: <Badges />,
  },
  {
    id: "11",
    name: "Buttons",
    link: all_routes.buttons,
    module: all_modules.ui,
    element: <Buttons />,
  },
  {
    id: "12",
    name: "Images",
    link: all_routes.images,
    module: all_modules.ui,
    element: <Images />,
  },
  {
    id: "13",
    name: "Videos",
    link: all_routes.videos,
    module: all_modules.ui,
    element: <Videos />,
  },
  {
    id: "14",
    name: "Line Chart",
    link: all_routes.lineChart,
    module: all_modules.charts,
    element: <LineChart />,
  },
  {
    id: "15",
    name: "Bar Chart",
    link: all_routes.barChart,
    module: all_modules.charts,
    element: <BarChart />,
  },
  {
    id: "16",
    name: "Create Orders",
    link: all_routes.createorders,
    module: all_modules.createorders,
    element: <Createorders />,
  },
  {
    id: "17",
    name: "Products",
    link: all_routes.products,
    module: all_modules.products,
    element: <Products />,
  },
  {
    id: "18",
    name: "Categories",
    link: all_routes.categories,
    module: all_modules.categories,
    element: <Categories />,
  },
  {
    id: "19",
    name: "Customers",
    link: all_routes.customer,
    module: all_modules.customers,
    element: <Customers />,
  },
  {
    id: "20",
    name: "Vendors",
    link: all_routes.vendors,
    module: all_modules.vendors,
    element: <Vendor />,
  },
  {
    id: "21",
    name: "Add Products",
    link: all_routes.addproducts,
    module: all_modules.addproducts,
    element: <Addproducts />,
  },
  {
    id: "22",
    name: "Add Categories",
    link: all_routes.addcategories,
    module: all_modules.addcategories,
    element: <Addcategories />,
  },
  {
    id: "23",
    name: "Add Customers",
    link: all_routes.addcustomer,
    module: all_modules.addcustomer,
    element: <Addcustomer />,
  },
  {
    id: "24",
    name: "Add Vendors",
    link: all_routes.addvendors,
    module: all_modules.addvendors,
    element: <Addvendors />,
  },
  {
    id: "27",
    name: "Chat",
    link: all_routes.chat,
    module: all_modules.chat,
    element: <Chat />,
  },
  {
    id: "28",
    name: "Add Stock",
    link: all_routes.addstock,
    module: all_modules.addstock,
    element: <Addstock />,
  },
  {
    id: "29",
    name: "Manage Stock",
    link: all_routes.managestock,
    module: all_modules.managestock,
    element: <Managestock />,
  },
  {
    id: "30",
    name: "Stock Alert",
    link: all_routes.stockalert,
    module: all_modules.stockalert,
    element: <Stockalert />,
  },
  {
    id: "37",
    name: "Notifications",
    link: all_routes.notifications,
    module: all_modules.home,
    element: <Notifications />,
  },
  {
    id: "38",
    name: "Manage Product Stock",
    link: all_routes.manageproductstock,
    module: all_modules.managestock,
    element: <ProductStock />,
  },
  {
    id: "39",
    name: "Order Request",
    link: all_routes.shoprequests,
    module: all_modules.shoprequests,
    element: <ShopOrderRequest />,
  },
  {
    id: "40",
    name: "Shop Owner Orders",
    link: all_routes.shopownerorders,
    module: all_modules.shop,
    element: <ShopOwnerOrders />,
  },
  {
    id: "41",
    name: "Shop Owner Products",
    link: all_routes.shopownerproducts,
    module: all_modules.shop,
    element: <ShopOwnerProducts />,
  },
  {
    id: "42",
    name: "Shop Owner Order Status",
    link: all_routes.shopownerorderstatus,
    module: all_modules.shop,
    element: <ShopOwnerOrderStatus />,
  },
  {
    id: "43",
    name: "Shop Owner Product History",
    link: all_routes.shopownerproducthistory,
    module: all_modules.shop,
    element: <ShopownerProductHistory />,
  },
  {
    id: "44",
    name: "Manager Shop Orders",
    link: all_routes.shoporders,
    module: all_modules.shoprequests,
    element: <AllShopOrders />,
  },
  {
    id: "46",
    name: "Add Broker",
    link: all_routes.addbroker,
    module: all_modules.brokermanagement,
    element: <AddBroker />,
  },
  {
    id: "47",
    name: "View All Broker",
    link: all_routes.allbrokers,
    module: all_modules.brokermanagement,
    element: <Brokers />,
  },
  {
    id: "48",
    name: "Purchasr Invoice",
    link: all_routes.purchaseinvoice,
    module: all_modules.purchaseinvoice,
    element: <Purchaseinvoice />,
  },
  {
    id: "490",
    name: "Broker Commission",
    link: all_routes.brokercommission,
    module: all_modules.purchaseinvoice,
    element: <BrokerCommissionDetails />,
  },
  {
    id: "51",
    name: "Add Unit",
    link: all_routes.addunit,
    module: all_modules.addproducts,
    element: <AddUnit />,
  },
  {
    id: "52",
    name: "View Unit",
    link: all_routes.allunits,
    module: all_modules.addproducts,
    element: <ViewUnit />,
  },
  {
    id: "53",
    name: "Add Transporter",
    link: all_routes.addtransporter,
    module: all_modules.addstock,
    element: <AddTransporter />,
  },
  {
    id: "54",
    name: "All Transporters",
    link: all_routes.alltransporters,
    module: all_modules.addstock,
    element: <AllTrasnporters />,
  },
  {
    id: "55",
    name: "Sales Report",
    link: all_routes.salesreport,
    module: all_modules.salesreport,
    element: <SalesReport />,
  },
  {
    id: "56",
    name: "Purchase Report",
    link: all_routes.purchasereport,
    module: all_modules.purchasereport,
    element: <PurchaseReport />,
  },
  {
    id: "57",
    name: "Broker Report",
    link: all_routes.brokerreport,
    module: all_modules.brokerreport,
    element: <BrokerReport />,
  },
  {
    id: "58",
    name: "Franchise Report",
    link: all_routes.franchisereport,
    module: all_modules.franchisereport,
    element: <FranchiseReport />,
  },
];

export const authRoutes = [
  {
    id: "1",
    name: "SignIn",
    link: all_routes.signIn,
    element: <SignIn />,
  },
  {
    id: "2",
    name: "SignUp",
    link: all_routes.signUp,
    element: <SignUp />,
  },
  {
    id: "3",
    name: "Reset Password",
    link: all_routes.resetpassword,
    element: <ResetPassword />,
  },
];

export const adminPanelRoutes = [
  {
    id: "1",
    name: "Dashboard/home",
    link: admin_routes.home,
    module: admin_modules.home,
    element: <AdminHome />,
  },
  {
    id: "2",
    name: "Roles Persmissions",
    link: admin_routes.rolepermissions,
    module: admin_modules.rolepermissions,
    element: <Rolepermissions />,
  },
  // {
  //   id: "3",
  //   name: "All Users",
  //   link: admin_routes.allusers,
  //   module: admin_modules.allusers,
  //   element: <Allusers />,
  // },
  {
    id: "4",
    name: "Create and view Roles",
    link: admin_routes.roles,
    module: admin_modules.roles,
    element: <Roles />,
  },
  {
    id: "5",
    name: "Add Users",
    link: admin_routes.users,
    module: admin_modules.users,
    element: <Users />,
  },
  {
    id: "6",
    name: "All Categories",
    link: admin_routes.allcategories,
    module: admin_modules.allcategories,
    element: <Allcategories />,
  },
  {
    id: "7",
    name: "All Products",
    link: admin_routes.allproducts,
    module: admin_modules.allproducts,
    element: <AdminProducts />,
  },
  {
    id: "8",
    name: "All Users Data",
    link: admin_routes.allusersdata,
    module: admin_modules.allusersdata,
    element: <AllUsersData />,
  },
  {
    id: "9",
    name: "Stock Management",
    link: admin_routes.allstockmanagement,
    module: admin_modules.allstockmanagement,
    element: <AllStockManagement />,
  },
  {
    id: "10",
    name: "Admin Sales Report",
    link: admin_routes.adminsalesreport,
    module: admin_modules.adminsalesreport,
    element: <AdminSalesReport />,
  },
  {
    id: "11",
    name: "Admin Purchase Report",
    link: admin_routes.adminpurchasereport,
    module: admin_modules.adminpurchasereport,
    element: <AdminPurchaseReport />,
  },
  {
    id: "12",
    name: "Admin Broker Report",
    link: admin_routes.adminbrokerreport,
    module: admin_modules.adminbrokerreport,
    element: <AdminBrokerReport />,
  },
  {
    id: "13",
    name: "Admin Franchise Report",
    link: admin_routes.adminfranchisereport,
    module: admin_modules.adminfranchisereport,
    element: <AdminFranchiseReport />,
  },
];

export const posRoutes = [
  {
    id: "1",
    name: "POS",
    link: all_routes.pos,
    module: all_modules.pos,
    element: <Pos />,
  },
  {
    id: "2",
    name: "Shop",
    link: all_routes.shop,
    module: all_modules.shop,
    element: <Shop />,
  },
  {
    id: "3",
    name: "Shop Owner POS",
    link: all_routes.shopownerpos,
    module: all_modules.shop,
    element: <ShopOwnerPOS />,
  },
];
