import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getmycustomersservice,
  deletecustomerservice,
  getsinglecustomerservice,
} from "../../services/customerservices";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import EditCustomer from "./EditCustomer";
import { CustomerData } from "../../types/types";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";

const { Search } = Input;

const Customers = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<CustomerData[]>(
    []
  );
  const [updateCustomerData, setUpdateCustomerData] =
    useState<CustomerData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getmycustomersservice();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (err) {
      console.error("Error fetching customers:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = customers.filter(
      (customer) =>
        `${customer.first_name} ${customer.last_name}`
          .toLowerCase()
          .includes(value.toLowerCase()) ||
        customer.email?.toLowerCase().includes(value.toLowerCase()) ||
        customer.phone?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCustomers(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: CustomerData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Customer Name",
      key: "customer_name",
      render: (record: CustomerData) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {record.first_name} {record.last_name}
        </span>
      ),
      sorter: (a: CustomerData, b: CustomerData) =>
        `${a.first_name} ${a.last_name}`.localeCompare(
          `${b.first_name} ${b.last_name}`
        ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) => (
        <span className="truncate text-gray-700 dark:text-white/80">
          {email || "N/A"}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone: string) => (
        <span className="truncate text-gray-700 dark:text-white/80">
          {phone || "N/A"}
        </span>
      ),
    },
    {
      title: "Customer Image",
      dataIndex: "customer_image",
      key: "customer_image",
      render: (url: string) =>
        url ? (
          <img
            src={`${import.meta.env.VITE_API_IMG_URL}${url}`}
            alt="Customer"
            style={{
              width: "40px",
              height: "40px",
              objectFit: "contain",
              borderRadius: "100%",
            }}
          />
        ) : (
          <span>No Image</span>
        ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: CustomerData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this customer?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              id="table-delete-btn"
              size="small"
              icon={<DeleteOutlined />}
              loading={loading}
            />
          </Popconfirm>
          <Button
            id="table-update-btn"
            size="small"
            icon={<EditOutlined />}
            loading={loading}
            onClick={() => handleEdit(record.id)}
          />
        </Space>
      ),
    },
  ];

  const handleDelete = async (customerID: number) => {
    try {
      await deletecustomerservice(customerID);
      toast.success("Customer deleted successfully.");
      fetchCustomers();
    } catch (error) {
      console.error("Error deleting customer:", error);
      handleError(error);
    }
  };

  const handleEdit = async (customerID: number) => {
    try {
      const customerData = await getsinglecustomerservice(customerID);
      setUpdateCustomerData(customerData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable to update customer:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Customers"
        description="Manage and view all customers in the system."
      />
      <PageBreadcrumb pageTitle="Customers" />
      <ButtonComponentCard
        title="View All Customers"
        buttonlink={all_routes.addcustomer}
        buttontitle="Add Customer"
      >
        <div className="mb-4">
          <Search
            placeholder="Search customers..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredCustomers}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{
            pageSize: 10,
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
          }}
          scroll={{ x: 900 }}
          locale={{ emptyText: "No customers found." }}
        />
      </ButtonComponentCard>
      {updateCustomerData && (
        <EditCustomer
          fetchCustomers={fetchCustomers}
          selectedCustomer={updateCustomerData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default Customers;
