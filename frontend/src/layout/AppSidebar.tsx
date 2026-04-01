import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDownIcon, HorizontaLDots } from "../icons";
import { useSidebar } from "../context/SidebarContext";
import { NavItem } from "../types/types";
import useFilteredSidebarSections from "../sidebar/useFilteredSidebarSections";

const AppSidebar: React.FC = () => {
  const {
    navItems,
    management,
    stockItems,
    reportItems,
    othersItems,
    loading,
  } = useFilteredSidebarSections();

  const { isExpanded, isMobileOpen, isHovered, setIsHovered, closeSidebar } =
    useSidebar();

  const location = useLocation();

  const allSidebarSections: Record<
    "main" | "others" | "management" | "stockItems" | "reportItems",
    NavItem[]
  > = {
    main: navItems,
    management,
    stockItems,
    reportItems,
    others: othersItems,
  };

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others" | "management" | "stockItems" | "reportItems";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  // Auto-open submenu if current path matches
  useEffect(() => {
    let submenuMatched = false;
    (
      Object.keys(allSidebarSections) as Array<keyof typeof allSidebarSections>
    ).forEach((menuType) => {
      const items = allSidebarSections[menuType] || [];
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({ type: menuType, index });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  // Store submenu height for animation
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
                onClick={() => isMobileOpen && closeSidebar()}
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
                      onClick={() => isMobileOpen && closeSidebar()}
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
      className={`fixed top-0 left-0 flex flex-col bg-white dark:bg-gray-900 dark:border-gray-800 
      text-gray-900 h-screen transition-all duration-300 ease-in-out z-50 border-r border-gray-200 
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
      {/* Logo Section */}
      <div
        className={`shrink-0 py-8 px-5 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" onClick={() => isMobileOpen && closeSidebar()}>
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

      {/* Scrollable Menu Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-6">
        <nav className="mb-6">
          {loading ? (
            <div className="px-4 space-y-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {Object.entries(allSidebarSections).map(
                ([sectionKey, sectionItems]) => {
                  if (sectionItems.length === 0) return null;
                  return (
                    <div key={sectionKey}>
                      <h2
                        className={`mb-4 text-xs uppercase flex leading-[20px] text-gray-400 ${
                          !isExpanded && !isHovered
                            ? "lg:justify-center"
                            : "justify-start"
                        }`}
                      >
                        {isExpanded || isHovered || isMobileOpen ? (
                          sectionKey
                        ) : (
                          <HorizontaLDots />
                        )}
                      </h2>
                      {renderMenuItems(
                        sectionItems,
                        sectionKey as
                          | "main"
                          | "others"
                          | "management"
                          | "reportItems"
                          | "stockItems"
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
