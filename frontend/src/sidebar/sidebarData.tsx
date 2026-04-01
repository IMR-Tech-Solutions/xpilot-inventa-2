import {
  BoxCubeIcon,
  GridIcon,
  ListIcon,
  GroupIcon,
  TaskIcon,
  // ChatIcon,
  DocsIcon,
  PlusIcon,
  // PlugInIcon,
  PieChartIcon,
} from "../icons";
import { NavItem } from "../types/types";
import { all_modules } from "../modules/modules";
import { all_routes } from "../Router/allroutes";

export const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
    module: all_modules.home,
  },
  {
    icon: <BoxCubeIcon />,
    name: "Franchise",
    subItems: [
      {
        name: "Franchise Orders",
        path: all_routes.shopownerorders,
        module: all_modules.shop,
      },
      {
        name: "Franchise Products",
        path: all_routes.shopownerproducts,
        module: all_modules.shop,
      },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "Orders",
    subItems: [
      {
        name: "Franchise Order Request",
        path: all_routes.shoprequests,
        module: all_modules.shoprequests,
      },
      { name: "POS Orders", path: "/orders", module: all_modules.orders },
      {
        name: "All Franchise Orders",
        path: all_routes.shoporders,
        module: all_modules.shoprequests,
      },
    ],
  },
  {
    icon: <GroupIcon />,
    name: "CRM",
    subItems: [
      { name: "Products", path: "/products", module: all_modules.products },
      {
        name: "Categories",
        path: "/categories",
        module: all_modules.categories,
      },
      { name: "Customers", path: "/customers", module: all_modules.customers },
    ],
  },
];

export const management: NavItem[] = [
  {
    icon: <TaskIcon />,
    name: "Add Units",
    path: all_routes.addunit,
    module: all_modules.addproducts,
  },
  {
    icon: <TaskIcon />,
    name: "Add Products",
    path: "/add-products",
    module: all_modules.addproducts,
  },
  {
    icon: <TaskIcon />,
    name: "Add Categories",
    path: "/add-categories",
    module: all_modules.addcategories,
  },
  {
    icon: <TaskIcon />,
    name: "Add Vendors",
    path: "/add-vendors",
    module: all_modules.addvendors,
  },
  {
    icon: <TaskIcon />,
    name: "Add Broker",
    path: all_routes.addbroker,
    module: all_modules.brokermanagement,
  },
  {
    icon: <TaskIcon />,
    name: "Add Transporter",
    path: all_routes.addtransporter,
    module: all_modules.addstock,
  },
];

export const othersItems: NavItem[] = [
  // {
  //   icon: <ChatIcon />,
  //   name: "Chat",
  //   path: "/chat",
  //   module: all_modules.chat,
  // },
];

export const stockItems: NavItem[] = [
  {
    icon: <PlusIcon />,
    name: "Add Stock",
    path: "/add-stock",
    module: all_modules.addstock,
  },
  {
    icon: <ListIcon />,
    name: "Manage Stock",
    path: "/manage-stock",
    module: all_modules.managestock,
  },
  // {
  //   icon: <PlugInIcon />,
  //   name: "Stock Alerts",
  //   path: "/stock-alerts",
  //   module: all_modules.stockalert,
  // },
  {
    icon: <DocsIcon />,
    name: "Purchase Invoice",
    path: "/purchase-inovice",
    module: all_modules.purchaseinvoice,
  },
];

export const reportItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Reports",
    subItems: [
      {
        name: "Sales Register",
        path: all_routes.salesregister,
        module: all_modules.report,
      },
      {
        name: "Product Wise Sales Register",
        path: all_routes.productwisesalesregister,
        module: all_modules.report,
      },
      {
        name: "Purchase Register",
        path: all_routes.purchaseregister,
        module: all_modules.report,
      },
      {
        name: "Product Wise Purchase Register",
        path: all_routes.productwisepurchaseregister,
        module: all_modules.report,
      },
      {
        name: "Inventory Report",
        path: all_routes.inventoryreport,
        module: all_modules.report,
      },
      {
        name: "Receivable Report",
        path: all_routes.receivablereport,
        module: all_modules.report,
      },
      {
        name: "Age Wise Receivable Report",
        path: all_routes.agewisereceivablereport,
        module: all_modules.report,
      },
      {
        name: "Shop Sales Register Report",
        path: all_routes.shopsalesregister,
        module: all_modules.report,
      },
      {
        name: "Product Wise Shop Sales Report",
        path: all_routes.productwiseshopsalesregister,
        module: all_modules.report,
      },
      {
        name: "Shop Recevible Report",
        path: all_routes.shopreceivablereport,
        module: all_modules.report,
      },
      {
        name: "Age wise recevible Report",
        path: all_routes.agewiseshopreceivablereport,
        module: all_modules.report,
      },
    ],
  },
];

export const allSidebarSections = {
  navItems,
  management,
  stockItems,
  reportItems,
  othersItems,
};
