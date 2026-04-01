import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonLoading from "../../components/common/ButtonLoading";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { addbrokerservice } from "../../services/brokerservices";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { all_routes } from "../../Router/allroutes";

const AddBroker = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [brokerData, setBrokerData] = useState({
    broker_name: "",
    contact_person: "",
    phone_number: "",
    email: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    pan_number: "",
    gst_number: "",
    license_number: "",
    default_commission_amount: "0",
    is_active: true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setBrokerData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setBrokerData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (parseFloat(brokerData.default_commission_amount) < 0) {
      toast.error("Commission percentage cannot be negative.");
      return;
    }

    if (!brokerData.broker_name.trim()) {
      toast.error("Broker name is required.");
      setIsLoading(false);
      return;
    }
    if (!brokerData.phone_number.trim()) {
      toast.error("Phone number is required.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    for (const key in brokerData) {
      const value = (brokerData as any)[key];
      if (typeof value === "boolean") {
        data.append(key, value.toString());
      } else {
        data.append(key, value);
      }
    }

    try {
      await addbrokerservice(data);
      toast.success("Broker added successfully!");
      setBrokerData({
        broker_name: "",
        contact_person: "",
        phone_number: "",
        email: "",
        address: "",
        city: "",
        state: "",
        postal_code: "",
        pan_number: "",
        gst_number: "",
        license_number: "",
        default_commission_amount: "0",
        is_active: true,
      });
    } catch (err) {
      handleError(err);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Add Broker"
        description="Add a new broker to Inventa System"
      />
      <PageBreadcrumb pageTitle="Add New Broker" />
      <ButtonComponentCard
        title="Broker Information"
        buttonlink={all_routes.allbrokers}
        buttontitle="View All Brokers"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
            <div>
              <Label>Broker Name</Label>
              <input
                type="text"
                name="broker_name"
                value={brokerData.broker_name}
                onChange={handleChange}
                className="input-field"
                maxLength={100}
                placeholder="Enter broker name"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <input
                type="text"
                name="contact_person"
                value={brokerData.contact_person}
                onChange={handleChange}
                className="input-field"
                maxLength={100}
                placeholder="Enter contact person"
              />
            </div>
            <div>
              <Label>Phone Number</Label>
              <input
                type="text"
                name="phone_number"
                value={brokerData.phone_number}
                onChange={handleChange}
                className="input-field"
                placeholder="+919876543210"
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                type="email"
                name="email"
                value={brokerData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label>Address</Label>
              <textarea
                name="address"
                value={brokerData.address}
                onChange={handleChange}
                className="input-field min-h-[80px]"
                placeholder="Enter address"
              />
            </div>
            <div>
              <Label>City</Label>
              <input
                type="text"
                name="city"
                value={brokerData.city}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <Label>State</Label>
              <input
                type="text"
                name="state"
                value={brokerData.state}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <Label>Postal Code</Label>
              <input
                type="text"
                name="postal_code"
                value={brokerData.postal_code}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <Label>PAN Number</Label>
              <input
                type="text"
                name="pan_number"
                value={brokerData.pan_number}
                onChange={handleChange}
                className="input-field"
                placeholder="ABCDE1234F"
              />
            </div>
            <div>
              <Label>GST Number</Label>
              <input
                type="text"
                name="gst_number"
                value={brokerData.gst_number}
                onChange={handleChange}
                className="input-field"
                placeholder="27ABCDE1234F1Z5"
              />
            </div>
            <div>
              <Label>License Number</Label>
              <input
                type="text"
                name="license_number"
                value={brokerData.license_number}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            {/* <div>
              <Label>Default Commission ₹</Label>
              <input
                type="number"
                name="default_commission_amount"
                value={brokerData.default_commission_amount}
                onChange={handleChange}
                className="input-field"
                min="0"
                max="100"
                step="0.01"
              />
            </div> */}
          </div>
          <div className="flex items-center ">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={brokerData.is_active}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="is_active" className="mb-0">
              Broker is Active
            </Label>
          </div>

          <ButtonLoading
            loading={isLoading}
            state="Add Broker"
            loadingstate="Adding Broker..."
            className="w-fit mt-8"
          />
        </form>
      </ButtonComponentCard>
    </>
  );
};

export default AddBroker;
