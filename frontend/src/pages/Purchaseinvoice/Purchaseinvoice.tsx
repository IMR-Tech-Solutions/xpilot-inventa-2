import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getVendorInvoicesService,
  viewVendorInvoicePDFService,
  downloadVendorInvoicePDFService,
} from "../../services/vendorservices";
import {
  EyeOutlined,
  DownloadOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { VendorInvoiceData } from "../../types/types";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";
import dayjs from "dayjs";
import { useNavigate } from "react-router";

const { Search } = Input;

const Purchaseinvoice = () => {
  const navigate = useNavigate();
  const [vendorinvoice, setVendorinvoice] = useState<VendorInvoiceData[]>([]);
  const [filteredVendorinvoice, setfilteredVendorinvoice] = useState<
    VendorInvoiceData[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // track per-row button loading
  const [loadingButtons, setLoadingButtons] = useState<{
    [key: number]: "view" | "download" | null;
  }>({});

  const fetchVendorInvoices = async () => {
    setLoading(true);
    try {
      const data = await getVendorInvoicesService();
      setVendorinvoice(data);
      setfilteredVendorinvoice(data);
    } catch (err) {
      console.error("Error fetching vendor invoices:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendorInvoices();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = vendorinvoice.filter(
      (invoice) =>
        invoice.invoice_number
          ?.toString()
          .toLowerCase()
          .includes(value.toLowerCase()) ||
        invoice.vendor_name?.toLowerCase().includes(value.toLowerCase())
    );
    setfilteredVendorinvoice(filtered);
    setCurrentPage(1);
  };

  // --- ACTION HANDLERS ---
  const handleView = async (invoiceId: number) => {
    setLoadingButtons((prev) => ({ ...prev, [invoiceId]: "view" }));
    const toastId = toast.loading("Opening invoice...");
    try {
      await viewVendorInvoicePDFService(invoiceId);
      toast.update(toastId, {
        render: "Invoice opened successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error viewing invoice:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to open invoice",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [invoiceId]: null }));
    }
  };

  const handleDownload = async (invoiceId: number) => {
    setLoadingButtons((prev) => ({ ...prev, [invoiceId]: "download" }));
    const toastId = toast.loading("Downloading invoice...");
    try {
      await downloadVendorInvoicePDFService(invoiceId);
      toast.update(toastId, {
        render: "Invoice downloaded successfully!",
        type: "success",
        isLoading: false,
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error downloading invoice:", error);
      handleError(error);
      toast.update(toastId, {
        render: "Failed to download invoice",
        type: "error",
        isLoading: false,
        autoClose: 2000,
      });
    } finally {
      setLoadingButtons((prev) => ({ ...prev, [invoiceId]: null }));
    }
  };

  const handleBrokerCommission = (invoiceId: number) => {
    const encodedID = btoa(invoiceId.toString());
    navigate(`/broker-commission/${encodedID}`);
  };

  // --- TABLE COLUMNS ---
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: VendorInvoiceData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Invoice Date",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: VendorInvoiceData, b: VendorInvoiceData) =>
        dayjs(a.created_at).unix() - dayjs(b.created_at).unix(),
      render: (date: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {date ? dayjs(date).format("DD MMM YYYY") : "N/A"}
        </span>
      ),
    },
    {
      title: "Invoice Number",
      dataIndex: "invoice_number",
      key: "invoice_number",
      sorter: (a: VendorInvoiceData, b: VendorInvoiceData) =>
        (a.invoice_number || "").localeCompare(b.invoice_number || ""),
      render: (num: number) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {num ?? "N/A"}
        </span>
      ),
    },
    {
      title: "Vendor Name",
      dataIndex: "vendor_name",
      key: "vendor_name",
      sorter: (a: VendorInvoiceData, b: VendorInvoiceData) =>
        (a.vendor_name || "").localeCompare(b.vendor_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: VendorInvoiceData) => (
        <Space size="small">
          <Button
            id="table-view-btn"
            size="small"
            icon={<EyeOutlined />}
            loading={loadingButtons[record.id] === "view"}
            onClick={() => handleView(record.id)}
          />
          <Button
            id="table-download-btn"
            size="small"
            icon={<DownloadOutlined />}
            loading={loadingButtons[record.id] === "download"}
            onClick={() => handleDownload(record.id)}
          />
          <Button
            id="table-manage-btn"
            size="small"
            icon={<DollarOutlined />}
            onClick={() => handleBrokerCommission(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageMeta
        title="Purchase Invoices"
        description="Manage and organize Purchase Invoices seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Purchase Invoices" />
      <ButtonComponentCard
        title="View All Purchase Invoices"
        buttonlink={all_routes.vendors}
        buttontitle="All Vendors"
      >
        <div className="mb-4">
          <Search
            placeholder="Search invoices..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredVendorinvoice}
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
          locale={{ emptyText: "No purchase invoices found." }}
        />
      </ButtonComponentCard>
    </div>
  );
};

export default Purchaseinvoice;
