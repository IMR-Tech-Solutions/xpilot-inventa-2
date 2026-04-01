import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import {
  navItems as allNavItems,
  management as allManagement,
  stockItems as allStockItems,
  reportItems as allReportItems,
  othersItems as allOthersItems,
} from "../sidebar/sidebarData";
import { NavItem } from "../types/types";

type SidebarSections = {
  navItems: NavItem[];
  management: NavItem[];
  stockItems: NavItem[];
  reportItems: NavItem[];
  othersItems: NavItem[];
};

type SidebarHookReturn = SidebarSections & { loading: boolean };

const useFilteredSidebarSections = (): SidebarHookReturn => {
  const [sections, setSections] = useState<SidebarSections>({
    navItems: [],
    management: [],
    stockItems: [],
    reportItems: [],
    othersItems: [],
  });

  const [loading, setLoading] = useState(true);

  const { permissions } = useSelector((state: any) => state.user);

  useEffect(() => {
    if (permissions === null) return;

    setLoading(true);

    const allSections: SidebarSections = {
      navItems: allNavItems,
      management: allManagement,
      stockItems: allStockItems,
      reportItems: allReportItems,
      othersItems: allOthersItems,
    };

    const filterItems = (items: NavItem[]) =>
      items
        .map((item) => {
          if (item.subItems && item.subItems.length > 0) {
            const filteredSubItems = item.subItems.filter((sub) =>
              permissions.includes(sub.module)
            );
            if (filteredSubItems.length > 0) {
              return { ...item, subItems: filteredSubItems };
            }
            return null;
          } else {
            return permissions.includes(item.module || "") ? item : null;
          }
        })
        .filter(Boolean) as NavItem[];

    if (permissions === "all") {
      setSections(allSections);
    } else if (Array.isArray(permissions)) {
      setSections({
        navItems: filterItems(allNavItems),
        management: filterItems(allManagement),
        stockItems: filterItems(allStockItems),
        reportItems: filterItems(allReportItems),
        othersItems: filterItems(allOthersItems),
      });
    } else {
      setSections({
        navItems: [],
        management: [],
        stockItems: [],
        reportItems: [],
        othersItems: [],
      });
    }

    setLoading(false);
  }, [permissions]);

  return { ...sections, loading };
};

export default useFilteredSidebarSections;
