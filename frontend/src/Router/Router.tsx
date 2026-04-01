import { BrowserRouter as Router, Routes, Route } from "react-router";
import { ScrollToTop } from "../components/common/ScrollToTop";
import AppLayout from "../layout/AppLayout";
import {
  websiteRoutes,
  authRoutes,
  adminPanelRoutes,
  posRoutes,
} from "./router.link";
import NotFound from "../pages/OtherPage/NotFound";
import { ToastContainer } from "react-toastify";
import ProtectedRoute from "./ProtectedRoute";
import Moduleaccess from "./Moduleacces";
import AdminLayout from "../Admin/Layout/AdminLayout";
import PosLayout from "../POS/PosLayout";

const AppRouter = () => {
  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnHover
        theme="light"
        className="!z-[9999] !text-inherit !mt-5 md:!mt-0"
        style={{
          ...(window.innerWidth <= 768 && {
            top: "7px",
            width: "90vw",
            left: "5vw",
            right: "5vw",
            transform: "none",
          }),
        }}
        toastStyle={{
          ...(window.innerWidth <= 768 && {
            marginBottom: "12px",
            fontSize: "14px",
          }),
        }}
      />

      <ScrollToTop />
      <Routes>
        {/* Main Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            {websiteRoutes.map((item) => (
              <Route
                key={item.id}
                path={item.link}
                element={
                  <Moduleaccess module={item.module}>
                    {item.element}
                  </Moduleaccess>
                }
              />
            ))}
          </Route>
        </Route>
        {/* Not Found Route*/}
        <Route path="*" element={<NotFound />} />
        {/* Authetication Routes*/}
        {authRoutes.map((item) => (
          <Route key={item.id} path={item.link} element={item.element} />
        ))}
        {/* Admin Panel */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            {adminPanelRoutes.map((item) => (
              <Route
                key={item.id}
                path={item.link}
                element={
                  <Moduleaccess module={item.module}>
                    {item.element}
                  </Moduleaccess>
                }
              />
            ))}
          </Route>
        </Route>
        {/* POS Panel */}
        <Route element={<ProtectedRoute />}>
          <Route element={<PosLayout />}>
            {posRoutes.map((item) => (
              <Route
                key={item.id}
                path={item.link}
                element={
                  <Moduleaccess module={item.module}>
                    {item.element}
                  </Moduleaccess>
                }
              />
            ))}
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
