import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getmybrokerservice,
  getsinglebrokerservice,
  deletebrokerservice,
} from "../../services/brokerservices";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import EditBroker from "./EditBroker";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";

const { Search } = Input;

export interface BrokerData {
  id: number;
  broker_name: string;
  contact_person: string;
  phone_number: string;
  email: string;
  is_active: boolean;
  created_at?: string;
}

const Brokers = () => {
  const [brokers, setBrokers] = useState<BrokerData[]>([]);
  const [filteredBrokers, setFilteredBrokers] = useState<BrokerData[]>([]);
  const [updateBrokerData, setUpdateBrokerData] = useState<BrokerData | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchBrokers = async () => {
    setLoading(true);
    try {
      const data = await getmybrokerservice();
      setBrokers(data);
      setFilteredBrokers(data);
    } catch (err) {
      console.error("Error fetching brokers:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokers();
  }, []);

  const handleSearch = (value: string) => {
    const searchTerm = value.toLowerCase();
    const filtered = brokers.filter(
      (broker) =>
        broker.broker_name?.toLowerCase().includes(searchTerm) ||
        broker.contact_person?.toLowerCase().includes(searchTerm) ||
        broker.phone_number?.toLowerCase().includes(searchTerm) ||
        broker.email?.toLowerCase().includes(searchTerm) ||
        (broker.is_active ? "active" : "inactive").includes(searchTerm)
    );
    setFilteredBrokers(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: BrokerData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Broker Name",
      dataIndex: "broker_name",
      key: "broker_name",
      sorter: (a: BrokerData, b: BrokerData) =>
        (a.broker_name || "").localeCompare(b.broker_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "phone_number",
      key: "phone_number",
      render: (value: string) => <span>{value || "N/A"}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (value: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {value || "N/A"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <span
          className={
            isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: BrokerData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this broker?"
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

  const handleDelete = async (brokerID: number) => {
    try {
      await deletebrokerservice(brokerID);
      toast.success("Broker deleted successfully.");
      fetchBrokers();
    } catch (error) {
      console.error("Error deleting broker:", error);
      handleError(error);
    }
  };

  const handleEdit = async (brokerID: number) => {
    try {
      const brokerData = await getsinglebrokerservice(brokerID);
      setUpdateBrokerData(brokerData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable to update broker:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Brokers"
        description="Manage and organize brokers seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Brokers" />
      <ButtonComponentCard
        title="View All Brokers"
        buttonlink={all_routes.addbroker}
        buttontitle="Add Broker"
      >
        <div className="mb-4">
          <Search
            placeholder="Search brokers..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredBrokers}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{
            pageSize: 10,
          }}
          onChange={(pagination) => {
            setCurrentPage(pagination.current || 1);
          }}
          scroll={{ x: 800 }}
          locale={{ emptyText: "No brokers found." }}
        />
      </ButtonComponentCard>
      {updateBrokerData && (
        <EditBroker
          fetchBrokers={fetchBrokers}
          selectedBroker={updateBrokerData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default Brokers;
