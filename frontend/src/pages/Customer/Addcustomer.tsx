import { useState, useEffect } from "react";
import { Select, InputNumber } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { all_routes } from "../../Router/allroutes";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
import ButtonLoading from "../../components/common/ButtonLoading";
import {
  addcustomerservice,
  getanimaltypesservice,
  addcustomeranimalservice,
} from "../../services/customerservices";
import { handleError } from "../../utils/handleError";
import { AnimalType } from "../../types/types";

const { Option } = Select;

interface AnimalRow {
  animal_type_id: number | null;
  animal_name: string;
  count: number;
}

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  address: "",
  village: "",
  city: "",
  state: "",
  zip_code: "",
  country: "",
  date_of_birth: "",
  gender: "",
  type_of_customer: "",
  milk_collection: "",
  competitor_name: "",
  competitor_mobile_number: "",
  competitor_address: "",
};

const AddCustomer = () => {
  const [form, setForm] = useState({ ...emptyForm });
  const [customerImage, setCustomerImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Animals
  const [animalTypes, setAnimalTypes] = useState<AnimalType[]>([]);
  const [animalRows, setAnimalRows] = useState<AnimalRow[]>([]);
  const [pendingRow, setPendingRow] = useState<AnimalRow>({
    animal_type_id: null,
    animal_name: "",
    count: 1,
  });

  useEffect(() => {
    getanimaltypesservice()
      .then(setAnimalTypes)
      .catch(() => {});
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setCustomerImage(file);
  };

  // Add the pending row to the local list
  const handleAddAnimalRow = () => {
    if (!pendingRow.animal_type_id && !pendingRow.animal_name.trim()) {
      toast.error("Select or enter an animal type");
      return;
    }
    if (pendingRow.count < 1) {
      toast.error("Count must be at least 1");
      return;
    }

    // Prevent duplicate animal type in the list
    const isDuplicate = animalRows.some((r) => {
      if (pendingRow.animal_type_id) return r.animal_type_id === pendingRow.animal_type_id;
      return r.animal_name.toLowerCase() === pendingRow.animal_name.trim().toLowerCase();
    });
    if (isDuplicate) {
      toast.error("This animal type is already in the list");
      return;
    }

    setAnimalRows((prev) => [...prev, { ...pendingRow }]);
    setPendingRow({ animal_type_id: null, animal_name: "", count: 1 });
  };

  const handleRemoveAnimalRow = (index: number) => {
    setAnimalRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First name and Last name are required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value !== "") formData.append(key, value as string);
    });
    if (customerImage) formData.append("customer_image", customerImage);

    try {
      // Step 1: Create customer and get back the new ID
      const newCustomer = await addcustomerservice(formData);
      const newId: number = newCustomer.id;

      // Step 2: Save each animal row
      if (animalRows.length > 0) {
        await Promise.all(
          animalRows.map((row) =>
            addcustomeranimalservice(newId, {
              ...(row.animal_type_id
                ? { animal_type_id: row.animal_type_id }
                : { animal_name: row.animal_name.trim() }),
              count: row.count,
            })
          )
        );
      }

      toast.success("Customer added successfully!");
      setForm({ ...emptyForm });
      setAnimalRows([]);
      setCustomerImage(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh animal types in case new ones were created
      getanimaltypesservice().then(setAnimalTypes).catch(() => {});
    } catch (error: any) {
      console.error("Error adding customer:", error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Add Customer"
        description="Add new customers to your ERP. Store contact details, personal info, and customer-specific data."
      />
      <PageBreadcrumb pageTitle="Add Customer" />
      <ButtonComponentCard
        title="Customer Information"
        buttonlink={all_routes.customer}
        buttontitle="View All Customers"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
            {/* Personal Info */}
            <div>
              <Label>First Name</Label>
              <input type="text" name="first_name" value={form.first_name}
                onChange={handleChange} className="input-field" placeholder="Enter first name" />
            </div>
            <div>
              <Label>Last Name</Label>
              <input type="text" name="last_name" value={form.last_name}
                onChange={handleChange} className="input-field" placeholder="Enter last name" />
            </div>
            <div>
              <Label>
                Email{" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} className="input-field" placeholder="Enter email" />
            </div>
            <div>
              <Label>Phone</Label>
              <input type="text" name="phone" value={form.phone}
                onChange={handleChange} className="input-field" placeholder="Enter phone number" />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label>Address <span className="text-gray-400 font-normal text-xs">— optional</span></Label>
              <textarea name="address" value={form.address}
                onChange={handleChange} className="input-field" placeholder="Enter address" />
            </div>
            <div>
              <Label>Village</Label>
              <input type="text" name="village" value={form.village}
                onChange={handleChange} className="input-field" placeholder="Enter village" />
            </div>
            <div>
              <Label>City</Label>
              <input type="text" name="city" value={form.city}
                onChange={handleChange} className="input-field" placeholder="Enter city" />
            </div>
            <div>
              <Label>State</Label>
              <input type="text" name="state" value={form.state}
                onChange={handleChange} className="input-field" placeholder="Enter state" />
            </div>
            <div>
              <Label>Zip Code</Label>
              <input type="text" name="zip_code" value={form.zip_code}
                onChange={handleChange} className="input-field" placeholder="Enter zip code" />
            </div>
            <div>
              <Label>Country</Label>
              <input type="text" name="country" value={form.country}
                onChange={handleChange} className="input-field" placeholder="Enter country" />
            </div>

            {/* Other */}
            <div>
              <Label>Date of Birth</Label>
              <input type="date" name="date_of_birth" value={form.date_of_birth}
                onChange={handleChange} className="input-field" />
            </div>
            <div>
              <Label>Gender</Label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                <option value="" className="text-black">Select Gender</option>
                <option value="Male" className="text-black">Male</option>
                <option value="Female" className="text-black">Female</option>
                <option value="Other" className="text-black">Other</option>
              </select>
            </div>
            <div>
              <Label>Type of Customer</Label>
              <select name="type_of_customer" value={form.type_of_customer}
                onChange={handleChange} className="input-field">
                <option value="" className="text-black">Select Customer Type</option>
                <option value="dairy" className="text-black">Dairy</option>
                <option value="distributor_dealer" className="text-black">Distributor/Dealer</option>
                <option value="farmer" className="text-black">Farmer</option>
              </select>
            </div>
            <div>
              <Label>
                Milk Collection (Liters){" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <input type="number" name="milk_collection" value={form.milk_collection}
                onChange={handleChange} className="input-field" min="0" step="0.1" placeholder="e.g. 25.5" />
            </div>

            {/* Competitor Info */}
            <div>
              <Label>Competitor Name <span className="text-gray-400 font-normal text-xs">— optional</span></Label>
              <input type="text" name="competitor_name" value={form.competitor_name}
                onChange={handleChange} className="input-field" placeholder="Enter competitor name" />
            </div>
            <div>
              <Label>Competitor Mobile <span className="text-gray-400 font-normal text-xs">— optional</span></Label>
              <input type="text" name="competitor_mobile_number" value={form.competitor_mobile_number}
                onChange={handleChange} className="input-field" placeholder="Enter competitor mobile" />
            </div>
            <div className="md:col-span-2">
              <Label>Competitor Address <span className="text-gray-400 font-normal text-xs">— optional</span></Label>
              <textarea name="competitor_address" value={form.competitor_address}
                onChange={handleChange} className="input-field" placeholder="Enter competitor address" />
            </div>

            {/* File Upload */}
            <div className="md:col-span-2">
              <Label>Customer Image</Label>
              <FileInput onChange={handleFileChange} className="custom-class"
                // @ts-ignore
                accept=".png, .jpg, .jpeg" />
              <p className="text-xs text-gray-400 my-2">Upload only .jpeg, .jpg, and .png files</p>
            </div>
          </div>

          {/* ── Animals Section ─────────────────────────────────── */}
          <div className="mt-4 mb-5">
            <Label>Animals <span className="text-gray-400 font-normal text-xs">— optional</span></Label>

            {/* Existing rows */}
            {animalRows.length > 0 && (
              <div className="mb-3 rounded-lg border border-gray-100 dark:border-white/10 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-white/50">
                    <tr>
                      <th className="text-left px-4 py-2">Animal</th>
                      <th className="text-left px-4 py-2">Count</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {animalRows.map((row, i) => {
                      const label = row.animal_type_id
                        ? animalTypes.find((a) => a.id === row.animal_type_id)?.name ?? "—"
                        : row.animal_name;
                      return (
                        <tr key={i} className="border-t border-gray-100 dark:border-white/10">
                          <td className="px-4 py-2 capitalize">{label}</td>
                          <td className="px-4 py-2">{row.count}</td>
                          <td className="px-4 py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveAnimalRow(i)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <DeleteOutlined />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add row inputs */}
            <div className="flex flex-wrap gap-3 items-end bg-gray-50 dark:bg-white/5 rounded-lg p-3 border border-gray-100 dark:border-white/10">
              <div className="flex-1 min-w-[180px]">
                <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Animal Type</p>
                <Select
                  showSearch
                  allowClear
                  placeholder="Select or type new animal..."
                  style={{ width: "100%" }}
                  value={pendingRow.animal_type_id ?? undefined}
                  onChange={(val) =>
                    setPendingRow((p) => ({
                      ...p,
                      animal_type_id: val ?? null,
                      animal_name: "",
                    }))
                  }
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  notFoundContent={
                    <span className="text-xs text-gray-400">No match — use the field below to add new</span>
                  }
                >
                  {animalTypes.map((at) => (
                    <Option key={at.id} value={at.id}>
                      {at.name}
                    </Option>
                  ))}
                </Select>
                {!pendingRow.animal_type_id && (
                  <input
                    type="text"
                    className="input-field mt-2"
                    placeholder="Or enter a new animal name..."
                    value={pendingRow.animal_name}
                    onChange={(e) =>
                      setPendingRow((p) => ({ ...p, animal_name: e.target.value }))
                    }
                  />
                )}
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-white/50 mb-1">Count</p>
                <InputNumber
                  min={1}
                  value={pendingRow.count}
                  onChange={(val) => setPendingRow((p) => ({ ...p, count: val ?? 1 }))}
                  style={{ width: 100 }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddAnimalRow}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-brand-500 text-white text-sm hover:bg-brand-600"
              >
                <PlusOutlined /> Add Row
              </button>
            </div>
          </div>

          <ButtonLoading
            loading={isLoading}
            state={"Add Customer"}
            loadingstate={"Adding Customer.."}
            className="w-fit"
          />
        </form>
      </ButtonComponentCard>
    </>
  );
};

export default AddCustomer;
