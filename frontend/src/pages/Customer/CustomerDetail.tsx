import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Table, Button, Select, InputNumber, Popconfirm, Tag } from "antd";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getsinglecustomerservice,
  getanimaltypesservice,
  addcustomeranimalservice,
  deletecustomeranimalservice,
} from "../../services/customerservices";
import { CustomerData, CustomerAnimal, AnimalType } from "../../types/types";
import { handleError } from "../../utils/handleError";
import EditCustomer from "./EditCustomer";
import { all_routes } from "../../Router/allroutes";

const { Option } = Select;

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  // const navigate = useNavigate();
  const customerId = Number(id);

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editVisible, setEditVisible] = useState(false);

  // Add animal form state
  const [selectedAnimalTypeId, setSelectedAnimalTypeId] = useState<number | null>(null);
  const [newAnimalName, setNewAnimalName] = useState("");
  const [animalCount, setAnimalCount] = useState<number>(1);
  const [addingAnimal, setAddingAnimal] = useState(false);

  const fetchCustomer = async () => {
    setLoading(true);
    try {
      const data = await getsinglecustomerservice(customerId);
      setCustomer(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnimalTypes = async () => {
    try {
      const data = await getanimaltypesservice();
      setAnimalTypes(data);
    } catch (err) {
      console.error("Failed to load animal types", err);
    }
  };

  useEffect(() => {
    fetchCustomer();
    fetchAnimalTypes();
  }, [customerId]);

  const handleAddAnimal = async () => {
    if (!animalCount || animalCount < 1) {
      toast.error("Count must be at least 1");
      return;
    }
    if (!selectedAnimalTypeId && !newAnimalName.trim()) {
      toast.error("Select an animal type or enter a new animal name");
      return;
    }

    setAddingAnimal(true);
    try {
      const payload: { animal_type_id?: number; animal_name?: string; count: number } = {
        count: animalCount,
      };
      if (selectedAnimalTypeId) {
        payload.animal_type_id = selectedAnimalTypeId;
      } else {
        payload.animal_name = newAnimalName.trim();
      }

      await addcustomeranimalservice(customerId, payload);
      toast.success("Animal entry saved");
      setSelectedAnimalTypeId(null);
      setNewAnimalName("");
      setAnimalCount(1);
      await fetchCustomer();
      await fetchAnimalTypes();
    } catch (err) {
      handleError(err);
    } finally {
      setAddingAnimal(false);
    }
  };

  const handleDeleteAnimal = async (animalEntryId: number) => {
    try {
      await deletecustomeranimalservice(animalEntryId);
      toast.success("Animal entry removed");
      fetchCustomer();
    } catch (err) {
      handleError(err);
    }
  };

  const animalColumns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: CustomerAnimal, index: number) => index + 1,
      width: 70,
    },
    {
      title: "Animal Type",
      key: "animal_type",
      render: (record: CustomerAnimal) => (
        <span className="font-medium capitalize">{record.animal_type.name}</span>
      ),
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: CustomerAnimal) => (
        <Popconfirm
          title="Remove this animal entry?"
          onConfirm={() => handleDeleteAnimal(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button size="small" id="table-delete-btn" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  if (loading || !customer) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Loading customer details...
      </div>
    );
  }

  const fullName = `${customer.first_name} ${customer.last_name}`;

  return (
    <div>
      <PageMeta title={`Customer — ${fullName}`} description="View full customer details" />
      <PageBreadcrumb pageTitle={`Customer: ${fullName}`} />

      <ButtonComponentCard
        title="Customer Details"
        buttonlink={all_routes.customer}
        buttontitle="Back to Customers"
      >
        {/* Action buttons */}
        <div className="flex justify-end mb-4">
          <Button
            id="table-update-btn"
            icon={<EditOutlined />}
            onClick={() => setEditVisible(true)}
          >
            Edit Customer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── Basic Info ───────────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
              Basic Info
            </h3>
            <div className="flex items-center gap-4 mb-4">
              {customer.customer_image ? (
                <img
                  src={`${import.meta.env.VITE_API_IMG_URL}${customer.customer_image}`}
                  alt="Customer"
                  className="w-16 h-16 rounded-full object-cover border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-white/10 flex items-center justify-center text-2xl font-bold text-gray-400">
                  {customer.first_name[0]}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{fullName}</p>
                {customer.type_of_customer && (
                  <Tag color="blue" className="mt-1 capitalize">
                    {customer.type_of_customer.replace("_", "/")}
                  </Tag>
                )}
              </div>
            </div>
            <InfoRow label="Email" value={customer.email} />
            <InfoRow label="Phone" value={customer.phone} />
            <InfoRow label="Gender" value={customer.gender} />
            <InfoRow label="Date of Birth" value={customer.date_of_birth} />
          </div>

          {/* ── Address ──────────────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
              Address
            </h3>
            <InfoRow label="Address" value={customer.address} />
            <InfoRow label="Village" value={customer.village} />
            <InfoRow label="City" value={customer.city} />
            <InfoRow label="State" value={customer.state} />
            <InfoRow label="Zip Code" value={customer.zip_code} />
            <InfoRow label="Country" value={customer.country} />
          </div>

          {/* ── Dairy / Farm Info ────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
              Dairy / Farm Info
            </h3>
            <InfoRow
              label="Milk Collection"
              value={
                customer.milk_collection != null
                  ? `${customer.milk_collection} L`
                  : null
              }
            />
            <InfoRow
              label="Total Animals"
              value={
                customer.animals.length > 0
                  ? `${customer.animals.reduce((s, a) => s + a.count, 0)} (${customer.animals.length} type${customer.animals.length !== 1 ? "s" : ""})`
                  : null
              }
            />
          </div>

          {/* ── Competitor Info ───────────────────────────────────── */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
              Competitor Info
            </h3>
            <InfoRow label="Competitor Name" value={customer.competitor_name} />
            <InfoRow label="Competitor Mobile" value={customer.competitor_mobile_number} />
            <InfoRow label="Competitor Address" value={customer.competitor_address} />
          </div>
        </div>

        {/* ── Animals Section ───────────────────────────────────── */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-white/50 uppercase tracking-wider mb-3">
            Animals
          </h3>

          <Table
            columns={animalColumns}
            dataSource={customer.animals}
            rowKey="id"
            pagination={false}
            size="small"
            className="custom-orders-table mb-4"
            locale={{ emptyText: "No animals added yet." }}
          />

          {/* Add Animal Form */}
          <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10">
            <p className="text-sm font-medium text-gray-700 dark:text-white/70 mb-3">
              Add / Update Animal
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs text-gray-500 mb-1">Animal Type</p>
                <Select
                  showSearch
                  allowClear
                  placeholder="Select existing or type new..."
                  style={{ width: "100%" }}
                  value={selectedAnimalTypeId ?? undefined}
                  onChange={(val) => {
                    setSelectedAnimalTypeId(val ?? null);
                    setNewAnimalName("");
                  }}
                  onSearch={(val) => {
                    // If user types something not in list, treat as new animal name
                    const match = animalTypes.find(
                      (a) => a.name.toLowerCase() === val.toLowerCase()
                    );
                    if (!match) setNewAnimalName(val);
                    else setNewAnimalName("");
                  }}
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    <span className="text-xs text-gray-400">
                      New type — will be created on save
                    </span>
                  }
                >
                  {animalTypes.map((at) => (
                    <Option key={at.id} value={at.id}>
                      {at.name}
                    </Option>
                  ))}
                </Select>
                {!selectedAnimalTypeId && (
                  <input
                    type="text"
                    className="input-field mt-2"
                    placeholder="Or type a new animal name..."
                    value={newAnimalName}
                    onChange={(e) => setNewAnimalName(e.target.value)}
                  />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Count</p>
                <InputNumber
                  min={1}
                  value={animalCount}
                  onChange={(val) => setAnimalCount(val ?? 1)}
                  style={{ width: 100 }}
                />
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={addingAnimal}
                onClick={handleAddAnimal}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </ButtonComponentCard>

      {customer && (
        <EditCustomer
          fetchCustomers={fetchCustomer}
          selectedCustomer={customer}
          visible={editVisible}
          onCancel={() => setEditVisible(false)}
        />
      )}
    </div>
  );
};

// Small helper component for label-value rows
const InfoRow = ({ label, value }: { label: string; value?: string | number | null }) => (
  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-white/10 last:border-0">
    <span className="text-sm text-gray-500 dark:text-white/50">{label}</span>
    <span className="text-sm text-gray-800 dark:text-white/90 text-right max-w-[60%] break-words">
      {value ?? <span className="text-gray-300 dark:text-white/20">—</span>}
    </span>
  </div>
);

export default CustomerDetail;
