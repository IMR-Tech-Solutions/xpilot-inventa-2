import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getMyTransporterService,
  getSingleTransporterService,
  deleteTransporterService,
} from "../../services/transporterservices";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import EditTrasnporter from "./EditTrasnporter";
import { TransporterData } from "../../types/types";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";

const { Search } = Input;

const AllTransporters = () => {
  const [transporters, setTransporters] = useState<TransporterData[]>([]);
  const [filteredTransporters, setFilteredTransporters] = useState<
    TransporterData[]
  >([]);
  const [updateTransporterData, setUpdateTransporterData] =
    useState<TransporterData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const data = await getMyTransporterService();
      setTransporters(data);
      setFilteredTransporters(data);
    } catch (err) {
      console.error("Error fetching transporters:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransporters();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = transporters.filter(
      (transporter) =>
        transporter.transporter_name
          ?.toLowerCase()
          .includes(value.toLowerCase()) ||
        transporter.contact_person
          ?.toLowerCase()
          .includes(value.toLowerCase()) ||
        transporter.contact_number?.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredTransporters(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: TransporterData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Transporter Name",
      dataIndex: "transporter_name",
      key: "transporter_name",
      sorter: (a: TransporterData, b: TransporterData) =>
        (a.transporter_name || "").localeCompare(b.transporter_name || ""),
      render: (name: string) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Contact Person",
      dataIndex: "contact_person",
      key: "contact_person",
      render: (contact: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {contact || "N/A"}
        </span>
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "contact_number",
      key: "contact_number",
      render: (phone: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {phone || "N/A"}
        </span>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {email || "N/A"}
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
      render: (_: any, record: TransporterData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this transporter?"
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

  const handleDelete = async (transporterId: number) => {
    try {
      await deleteTransporterService(transporterId);
      toast.success("Transporter deleted successfully.");
      fetchTransporters();
    } catch (error) {
      console.error("Error deleting transporter:", error);
      handleError(error);
    }
  };

  const handleEdit = async (transporterId: number) => {
    try {
      const transporterData = await getSingleTransporterService(transporterId);
      setUpdateTransporterData(transporterData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable to update transporter:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Transporters"
        description="Manage and organize transporters seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Transporters" />
      <ButtonComponentCard
        title="View All Transporters"
        buttonlink={all_routes.addtransporter} // You'll need to define this route
        buttontitle="Add Transporter"
      >
        <div className="mb-4">
          <Search
            placeholder="Search transporters by name, contact person, or phone..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredTransporters}
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
          locale={{ emptyText: "No transporters found." }}
        />
      </ButtonComponentCard>
      {updateTransporterData && (
        <EditTrasnporter
          fetchTransporters={fetchTransporters}
          transporterData={updateTransporterData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default AllTransporters;
