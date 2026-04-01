import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";

// Assume these icons are imported from an icon library
import {
  // BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  // ListIcon,
  UserIcon,
  GroupIcon,
  // TaskIcon,
  ChatIcon,
  // DocsIcon,
  // PlusIcon,
  // PlugInIcon,
  PieChartIcon,
} from "../../icons";
import { useSidebar } from "../../context/SidebarContext";
import { admin_modules } from "../../modules/adminmodules";
import { admin_routes } from "../../Router/adminRoutes";
import { NavItem } from "../../types/types";

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: admin_routes.home,
    module: admin_modules.home,
  },
  {
    icon: <GroupIcon />,
    name: "All Categories",
    path: admin_routes.allcategories,
    module: admin_modules.allcategories,
  },
  {
    icon: <GroupIcon />,
    name: "All Products",
    path: admin_routes.allproducts,
    module: admin_modules.allproducts,
  },
];

const management: NavItem[] = [
  {
    icon: <UserIcon />,
    name: "Add Users",
    subItems: [
      {
        name: "Create Roles",
        path: admin_routes.roles,
        module: admin_modules.roles,
      },
      {
        name: "Create Users",
        path: admin_routes.users,
        module: admin_modules.users,
      },
      //   {
      //     name: "All Users",
      //     path: admin_routes.allusers,
      //     module: admin_modules.allusers,
      //   },
    ],
  },
];

const othersItems: NavItem[] = [
  {
    icon: <ChatIcon />,
    name: "Chat",
    path: "/chat",
  },
];

// const stockItems: NavItem[] = [];

const reportItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Reports",
    subItems: [
      {
        name: "Sales Report",
        path: admin_routes.adminsalesreport,
        module: admin_modules.adminreports,
      },
      {
        name: "Purchase Report",
        path: admin_routes.adminpurchasereport,
        module: admin_modules.adminreports,
      },
      {
        name: "Shop Purchase Report",
        path: admin_routes.adminshoppurchasereport,
        module: admin_modules.adminreports,
      },
      {
        name: "Inventory Report",
        path: admin_routes.admininventoryreport,
        module: admin_modules.adminreports,
      },
      {
        name: "Tax Report",
        path: admin_routes.admintaxreport,
        module: admin_modules.adminreports,
      },
      {
        name: "Broker Report",
        path: admin_routes.adminbrokerreport,
        module: admin_modules.adminreports,
      },
    ],
  },
];

const AdminSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others" | "management" | "stockItems" | "reportItems";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others", "management", "stockItems", "reportItems"].forEach(
      (menuType) => {
        let items: NavItem[];
        if (menuType === "main") items = navItems;
        else if (menuType === "others") items = othersItems;
        else if (menuType === "management") items = management;
        // else if (menuType === "stockItems") items = stockItems;
        else if (menuType === "reportItems") items = reportItems;
        else items = [];
        items.forEach((nav, index) => {
          if (nav.subItems) {
            nav.subItems.forEach((subItem) => {
              if (isActive(subItem.path)) {
                setOpenSubmenu({
                  type: menuType as
                    | "main"
                    | "others"
                    | "management"
                    | "reportItems"
                    | "stockItems",
                  index,
                });
                submenuMatched = true;
              }
            });
          }
        });
      }
    );

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (
    index: number,
    menuType: "main" | "others" | "management" | "reportItems" | "stockItems"
  ) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (
    items: NavItem[],
    menuType: "main" | "others" | "management" | "reportItems" | "stockItems"
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
              } cursor-pointer ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }`}
            >
              <span
                className={`menu-item-icon-size  ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${
                  isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                }`}
              >
                <span
                  className={`menu-item-icon-size ${
                    isActive(nav.path)
                      ? "menu-item-icon-active"
                      : "menu-item-icon-inactive"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${
                        isActive(subItem.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                      }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${
                              isActive(subItem.path)
                                ? "menu-dropdown-badge-active"
                                : "menu-dropdown-badge-inactive"
                            } menu-dropdown-badge`}
                          >
                            pro
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 bg-white dark:bg-gray-900 dark:border-gray-800 text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
        ${
          isExpanded || isMobileOpen
            ? "w-[290px]"
            : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <img
                className="dark:hidden w-20 h-2 md:w-[120px] md:h-[40px]"
                src="/xpilot_logo_dark.png"
                alt="Logo"
              />
              <img
                className="hidden dark:block w-20 h-2 md:w-[120px] md:h-[40px]"
                src="/xpilot_logo_white.png"
                alt="Logo"
              />
            </>
          ) : (
            <img
              src="/xpilot_logo_dark.png"
              alt="Logo"
              width={32}
              height={32}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="size-6" />
                )}
              </h2>
              {renderMenuItems(navItems, "main")}
            </div>
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Management"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(management, "management")}
            </div>
            {/* <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Stock Management"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(stockItems, "stockItems")}
            </div> */}
            <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Reports"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(reportItems, "reportItems")}
            </div>
            {/* <div className="">
              <h2
                className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                  !isExpanded && !isHovered
                    ? "lg:justify-center"
                    : "justify-start"
                }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Support"
                ) : (
                  <HorizontaLDots />
                )}
              </h2>
              {renderMenuItems(othersItems, "others")}
            </div> */}
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AdminSidebar;
