import { useState } from "react";
import { all_routes } from "../../Router/allroutes";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
import ButtonLoading from "../../components/common/ButtonLoading";
import { addcustomerservice } from "../../services/customerservices";
import { handleError } from "../../utils/handleError";

const AddCustomer = () => {
  const [form, setForm] = useState({
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
    num_of_animals: 0,
    type_of_customer: "",
    milk_collection: "",
    competitor_name: "",
    competitor_mobile_number: "",
    competitor_address: "",
  });

  const [customerImage, setCustomerImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCustomerImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast.error("First name and Last name are required");
      return;
    }
    if (!form.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!form.phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value as string);
    });
    if (customerImage) {
      formData.append("customer_image", customerImage);
    }

    try {
      await addcustomerservice(formData);
      toast.success("Customer added successfully!");
      setForm({
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
        num_of_animals: 0,
        type_of_customer: "",
        milk_collection: "",
        competitor_name: "",
        competitor_mobile_number: "",
        competitor_address: "",
      });
      setCustomerImage(null);
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
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
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label>Last Name</Label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter last name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter phone number"
              />
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <Label>Address</Label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label>Village</Label>
              <input
                type="text"
                name="village"
                value={form.village}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter village"
              />
            </div>
            <div>
              <Label>City</Label>
              <input
                type="text"
                name="city"
                value={form.city}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label>State</Label>
              <input
                type="text"
                name="state"
                value={form.state}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter state"
              />
            </div>
            <div>
              <Label>Zip Code</Label>
              <input
                type="text"
                name="zip_code"
                value={form.zip_code}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter zip code"
              />
            </div>
            <div>
              <Label>Country</Label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter country"
              />
            </div>

            {/* Other Fields */}
            <div>
              <Label>Date of Birth</Label>
              <input
                type="date"
                name="date_of_birth"
                value={form.date_of_birth}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" className="text-black">
                  Select Gender
                </option>
                <option value="Male" className="text-black">
                  Male
                </option>
                <option value="Female" className="text-black">
                  Female
                </option>
                <option value="Other" className="text-black">
                  Other
                </option>
              </select>
            </div>
            <div>
              <Label>Number of Animals</Label>
              <input
                type="number"
                name="num_of_animals"
                value={form.num_of_animals}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <Label>Type of Customer</Label>
              <select
                name="type_of_customer"
                value={form.type_of_customer}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" className="text-black">
                  Select Customer Type
                </option>
                <option value="dairy" className="text-black">
                  Dairy
                </option>
                <option value="distributor_dealer" className="text-black">
                  Distributor/Dealer
                </option>
                <option value="farmer" className="text-black">
                  Farmer
                </option>
              </select>
            </div>

            {/* Milk Collection */}
            <div>
              <Label>
                Milk Collection (Liters){" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <input
                type="number"
                name="milk_collection"
                value={form.milk_collection}
                onChange={handleChange}
                className="input-field"
                min="0"
                step="0.1"
                placeholder="e.g. 25.5"
              />
            </div>

            {/* Competitor Info */}
            <div>
              <Label>
                Competitor Name{" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <input
                type="text"
                name="competitor_name"
                value={form.competitor_name}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter competitor name"
              />
            </div>
            <div>
              <Label>
                Competitor Mobile{" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <input
                type="text"
                name="competitor_mobile_number"
                value={form.competitor_mobile_number}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter competitor mobile number"
              />
            </div>
            <div className="md:col-span-2">
              <Label>
                Competitor Address{" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <textarea
                name="competitor_address"
                value={form.competitor_address}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter competitor address"
              />
            </div>

            {/* File Upload */}
            <div className="md:col-span-2">
              <Label>Customer Image</Label>
              <FileInput
                onChange={handleFileChange}
                className="custom-class"
                // @ts-ignore
                accept=".png, .jpg, .jpeg"
              />
              <p className="text-xs text-gray-400 my-2">
                Upload only .jpeg, .jpg, and .png files
              </p>
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
