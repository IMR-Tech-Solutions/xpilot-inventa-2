import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { Table } from "antd";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { getbrokercomissionforinvoice } from "../../services/vendorservices";
import { handleError } from "../../utils/handleError";
import { toast } from "react-toastify";

// UPDATED INTERFACES
interface BrokerCommissionBatch {
  batch_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  original_quantity: number;
  purchase_price: number;
  selling_price: number;
  broker_commission_amount: number;
  total_broker_commission: number;
  weight_unit: string;
  reference_number: string;
  manufacture_date: string;
  expiry_date: string;
  batch_status: string;
  tax_amount: number;
  purchase_invoice_number: string;
}

interface BrokerCommissionData {
  broker_id: number;
  broker_name: string;
  commission_amount: number;
  batches_count: number;
  batches: BrokerCommissionBatch[];
}

interface ApiResponse {
  invoice_id: number;
  invoice_number: string;
  vendor_name: string;
  transporter_id: number | null;
  transporter_name: string | null;
  transporter_cost: number;
  varne_cost: number;
  labour_cost: number;
  total_broker_commission: number;
  total_batches_with_commission: number;
  broker_commissions: BrokerCommissionData[];
}

const BrokerCommissionDetails = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [commissionData, setCommissionData] = useState<ApiResponse | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  let actualInvoiceID: number | null = null;
  if (invoiceId) {
    try {
      actualInvoiceID = parseInt(atob(invoiceId), 10);
    } catch (e) {
      console.error("Invalid invoice ID in URL", e);
      toast.error("Invalid invoice ID");
      navigate(-1);
    }
  }

  const fetchBrokerCommission = async () => {
    if (!actualInvoiceID) return;

    try {
      setLoading(true);
      const response = await getbrokercomissionforinvoice(actualInvoiceID);
      setCommissionData(response);
    } catch (e) {
      handleError(e);
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrokerCommission();
  }, [actualInvoiceID]);

  // Main table columns for brokers
  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: BrokerCommissionData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Broker Name",
      dataIndex: "broker_name",
      key: "broker_name",
      render: (name: string) => (
        <span className="font-medium text-gray-800 dark:text-white/90">
          {name}
        </span>
      ),
    },
    {
      title: "Total Commission (₹)",
      dataIndex: "commission_amount",
      key: "commission_amount",
      sorter: (a: BrokerCommissionData, b: BrokerCommissionData) =>
        a.commission_amount - b.commission_amount,
      render: (amount: number) => (
        <span className="font-semibold text-green-600">
          ₹{amount.toFixed(2)}
        </span>
      ),
    },
    {
      title: "Total Batches",
      key: "total_batches",
      render: (_: any, record: BrokerCommissionData) => (
        <span className="text-blue-600">{record.batches_count}</span>
      ),
    },
  ];

  // UPDATED Expandable row render for batch details
  const expandedRowRender = (record: BrokerCommissionData) => {
    const batchColumns = [
      {
        title: "Product Name",
        dataIndex: "product_name",
        key: "product_name",
        render: (product: string) => (
          <span className="font-medium text-gray-800 dark:text-white/90">
            {product}
          </span>
        ),
      },
      {
        title: "Quantity",
        dataIndex: "original_quantity",
        key: "original_quantity",
        render: (quantity: number, record: BrokerCommissionBatch) => (
          <span className="text-blue-600">
            {quantity} {record.weight_unit}
          </span>
        ),
      },
      {
        title: "Commission per Unit (₹)",
        dataIndex: "broker_commission_amount",
        key: "broker_commission_amount",
        render: (amount: number) => (
          <span className="text-blue-600">₹{amount.toFixed(2)}</span>
        ),
      },
      {
        title: "Total Commission (₹)",
        dataIndex: "total_broker_commission",
        key: "total_broker_commission",
        render: (amount: number) => (
          <span className="font-semibold text-green-600">
            ₹{amount.toFixed(2)}
          </span>
        ),
      },
    ];

    return (
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">
          Commission Details for {record.broker_name}
        </h4>
        <Table
          columns={batchColumns}
          dataSource={record.batches}
          pagination={false}
          size="small"
          rowKey="batch_id"
        />
      </div>
    );
  };

  return (
    <div>
      <PageMeta
        title="Broker Commission Details"
        description="View broker commission breakdown for this invoice."
      />
      <PageBreadcrumb pageTitle="Broker Commission Details" />

      <ButtonComponentCard
        title={`Invoice: ${commissionData?.invoice_number || ""}`}
        buttonlink=""
        buttontitle=""
      >
        {/* Stats Grid - Same as ProductStock */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold dark:text-white">
              {commissionData?.transporter_name || "N/A"}
            </div>
            <div className="text-sm theme-text">Transporter</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ₹{commissionData?.transporter_cost.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm theme-text">Transporter Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              ₹{commissionData?.varne_cost.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm theme-text">Varne Cost</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">
              ₹{commissionData?.labour_cost.toFixed(2) || "0.00"}
            </div>
            <div className="text-sm theme-text">Labour Cost</div>
          </div>
        </div>
      </ButtonComponentCard>

      {/* Broker Commission Section */}
      <div className="mt-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-green-700">
            Broker Commission Details
          </h2>
          <p className="text-sm theme-text">
            Commission breakdown by broker for this invoice
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03] p-5">
          <Table
            columns={columns}
            dataSource={commissionData?.broker_commissions || []}
            loading={loading}
            rowKey="broker_id"
            className="custom-orders-table"
            expandable={{
              expandedRowRender,
              expandRowByClick: true,
            }}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: false,
            }}
            onChange={(pagination) => {
              setCurrentPage(pagination.current || 1);
            }}
            scroll={{ x: 800 }}
            locale={{
              emptyText: "No broker commissions found for this invoice.",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default BrokerCommissionDetails;
