import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getmyvendorservice,
  getsinglevendorservice,
  deletevendorservice,
} from "../../services/vendorservices";
import { EditOutlined, DeleteOutlined, FilePdfOutlined, FileTextOutlined } from "@ant-design/icons";
import { downloadCSV, downloadPDF } from "../../utils/downloadUtils";
import { toast } from "react-toastify";
import EditVendor from "./Editvendor";
import { handleError } from "../../utils/handleError";
import { VendorData } from "../../types/types";
import { all_routes } from "../../Router/allroutes";

const { Search } = Input;

const Vendor = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<VendorData[]>([]);
  const [updateVendorData, setUpdateVendorData] = useState<VendorData | null>(
    null
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const data = await getmyvendorservice();
      setVendors(data);
      setFilteredVendors(data);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleSearch = (value: string) => {
    const searchTerm = value.toLowerCase();
    const filtered = vendors.filter(
      (vendor) =>
        vendor.vendor_name?.toLowerCase().includes(searchTerm) ||
        vendor.contact_number?.toLowerCase().includes(searchTerm) ||
        vendor.email?.toLowerCase().includes(searchTerm) ||
        (vendor.is_active ? "active" : "inactive").includes(searchTerm)
    );
    setFilteredVendors(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: VendorData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Vendor Name",
      dataIndex: "vendor_name",
      key: "vendor_name",
      sorter: (a: VendorData, b: VendorData) =>
        (a.vendor_name || "").localeCompare(b.vendor_name || ""),
    },
    {
      title: "Contact Number",
      dataIndex: "contact_number",
      key: "contact_number",
      render: (contact_number: string) => contact_number || "N/A",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email: string) => email || "N/A",
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
      render: (_: any, record: VendorData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this vendor?"
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

  const handleDelete = async (vendorID: number) => {
    try {
      await deletevendorservice(vendorID);
      toast.success("Vendor deleted successfully.");
      fetchVendors();
    } catch (error) {
      console.error("Error deleting vendor:", error);
      handleError(error);
    }
  };

  const handleEdit = async (vendorID: number) => {
    try {
      const vendorData = await getsinglevendorservice(vendorID);
      setUpdateVendorData(vendorData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable to update vendor:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Vendors"
        description="Manage and organize vendors seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Vendors" />
      <ButtonComponentCard
        title="View All Vendors"
        buttonlink={all_routes.addvendors}
        buttontitle="Add Vendor"
      >
        <div className="mb-4 flex items-center gap-2">
          <Search
            placeholder="Search vendors..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
          <Button
            icon={<FileTextOutlined />}
            onClick={() =>
              downloadCSV(
                filteredVendors.map((v) => ({ ...v, status_text: v.is_active ? "Active" : "Inactive" })),
                [
                  { label: "Sr. No", key: "__srno" },
                  { label: "Vendor Name", key: "vendor_name" },
                  { label: "Contact Number", key: "contact_number" },
                  { label: "Email", key: "email" },
                  { label: "Status", key: "status_text" },
                ],
                "vendors"
              )
            }
          >
            CSV
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() =>
              downloadPDF(
                filteredVendors.map((v) => ({ ...v, status_text: v.is_active ? "Active" : "Inactive" })),
                [
                  { label: "Sr. No", key: "__srno" },
                  { label: "Vendor Name", key: "vendor_name" },
                  { label: "Contact Number", key: "contact_number" },
                  { label: "Email", key: "email" },
                  { label: "Status", key: "status_text" },
                ],
                "vendors"
              )
            }
          >
            PDF
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredVendors}
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
          locale={{ emptyText: "No vendors found." }}
        />
      </ButtonComponentCard>
      {updateVendorData && (
        <EditVendor
          fetchVendors={fetchVendors}
          selectedVendor={updateVendorData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default Vendor;
