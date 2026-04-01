import { Outlet } from "react-router";
import { SidebarProvider } from "../context/SidebarContext";
import PosHeader from "./PosHeader";

const PosLayout = () => {
  return (
    <>
      <SidebarProvider>
        <PosHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          <Outlet />
        </div>
      </SidebarProvider>
    </>
  );
};

export default PosLayout;
