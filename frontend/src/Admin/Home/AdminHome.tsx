import AllmetricData from "../Components/AllmetricData";
import PageMeta from "../../components/common/PageMeta";
import Allusers from "../Users/Allusers";

const AdminHome = () => {
  return (
    <>
      <PageMeta
        title="Inventa | Admin Panel"
        description="Manage all inventa users, customers, orders"
      />
      <AllmetricData />
      <Allusers />
    </>
  );
};

export default AdminHome;
