import { useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonLoading from "../../components/common/ButtonLoading";
import Label from "../../components/form/Label";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { addTransporterService } from "../../services/transporterservices";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { all_routes } from "../../Router/allroutes";

const AddTransporter = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [transporterData, setTransporterData] = useState({
    transporter_name: "",
    contact_person: "",
    contact_number: "",
    email: "",
    gst_number: "",
    pan_number: "",
    registration_number: "",
    license_number: "",
    rc_number: "",
    vehicle_number: "",
    vehicle_type: "",
    address: "",
    state: "",
    city: "",
    postal_code: "",
    is_active: true,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setTransporterData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setTransporterData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!transporterData.transporter_name.trim()) {
      toast.error("Transporter name is required.");
      setIsLoading(false);
      return;
    }
    if (!transporterData.contact_number.trim()) {
      toast.error("Contact number is required.");
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    for (const key in transporterData) {
      const value = (transporterData as any)[key];
      formData.append(
        key,
        typeof value === "boolean" ? value.toString() : value
      );
    }

    try {
      await addTransporterService(formData);
      toast.success("Transporter added successfully!");

      // Reset form
      setTransporterData({
        transporter_name: "",
        contact_person: "",
        contact_number: "",
        email: "",
        gst_number: "",
        pan_number: "",
        registration_number: "",
        license_number: "",
        rc_number: "",
        vehicle_number: "",
        vehicle_type: "",
        address: "",
        state: "",
        city: "",
        postal_code: "",
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
        title="Add Transporter"
        description="Add a new transporter to Inventa System"
      />
      <PageBreadcrumb pageTitle="Add New Transporter" />
      <ButtonComponentCard
        title="Transporter Information"
        buttonlink={all_routes.alltransporters}
        buttontitle="View All Transporters"
      >
        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
            <div>
              <Label>Transporter Name</Label>
              <input
                type="text"
                name="transporter_name"
                value={transporterData.transporter_name}
                onChange={handleChange}
                className="input-field"
                maxLength={150}
                placeholder="Enter transporter name"
              />
            </div>
            <div>
              <Label>Contact Person</Label>
              <input
                type="text"
                name="contact_person"
                value={transporterData.contact_person}
                onChange={handleChange}
                className="input-field"
                maxLength={150}
                placeholder="Enter contact person name"
              />
            </div>
            <div>
              <Label>Contact Number</Label>
              <input
                type="text"
                name="contact_number"
                value={transporterData.contact_number}
                onChange={handleChange}
                className="input-field"
                maxLength={15}
                placeholder="Enter contact number"
              />
            </div>
            <div>
              <Label>Email</Label>
              <input
                type="email"
                name="email"
                value={transporterData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
            <div>
              <Label>GST Number</Label>
              <input
                type="text"
                name="gst_number"
                value={transporterData.gst_number}
                onChange={handleChange}
                className="input-field"
                maxLength={15}
                placeholder="Enter GST number"
              />
            </div>
            <div>
              <Label>PAN Number</Label>
              <input
                type="text"
                name="pan_number"
                value={transporterData.pan_number}
                onChange={handleChange}
                className="input-field"
                maxLength={10}
                placeholder="Enter PAN number"
                style={{ textTransform: "uppercase" }}
              />
            </div>
            <div>
              <Label>Registration Number</Label>
              <input
                type="text"
                name="registration_number"
                value={transporterData.registration_number}
                onChange={handleChange}
                className="input-field"
                maxLength={50}
                placeholder="Enter registration number"
              />
            </div>
            <div>
              <Label>License Number</Label>
              <input
                type="text"
                name="license_number"
                value={transporterData.license_number}
                onChange={handleChange}
                className="input-field"
                maxLength={50}
                placeholder="Enter license number"
              />
            </div>
            <div>
              <Label>RC Number</Label>
              <input
                type="text"
                name="rc_number"
                value={transporterData.rc_number}
                onChange={handleChange}
                className="input-field"
                maxLength={50}
                placeholder="Enter RC number"
              />
            </div>
            <div>
              <Label>Vehicle Number</Label>
              <input
                type="text"
                name="vehicle_number"
                value={transporterData.vehicle_number}
                onChange={handleChange}
                className="input-field"
                maxLength={50}
                placeholder="e.g. MH12AB1234"
              />
            </div>
            <div>
              <Label>Vehicle Type</Label>
              <input
                type="text"
                name="vehicle_type"
                value={transporterData.vehicle_type}
                onChange={handleChange}
                className="input-field"
                maxLength={100}
                placeholder="e.g. Truck, Mini Truck, Tempo"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="mb-5">
            <Label>Address</Label>
            <textarea
              name="address"
              value={transporterData.address}
              onChange={handleChange}
              className="input-field min-h-[80px] resize-vertical"
              placeholder="Enter complete address"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-3">
            <div>
              <Label>State</Label>
              <input
                type="text"
                name="state"
                value={transporterData.state}
                onChange={handleChange}
                className="input-field"
                maxLength={100}
                placeholder="Enter state"
              />
            </div>
            <div>
              <Label>City</Label>
              <input
                type="text"
                name="city"
                value={transporterData.city}
                onChange={handleChange}
                className="input-field"
                maxLength={100}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label>Postal Code</Label>
              <input
                type="text"
                name="postal_code"
                value={transporterData.postal_code}
                onChange={handleChange}
                className="input-field"
                maxLength={10}
                placeholder="Enter postal code"
              />
            </div>
          </div>

          {/* Status Checkbox */}
          <div className="flex items-center mb-5">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={transporterData.is_active}
              onChange={handleChange}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="is_active" className="mb-0">
              Transporter is Active
            </Label>
          </div>

          <ButtonLoading
            loading={isLoading}
            state="Add Transporter"
            loadingstate="Adding Transporter..."
            className="w-fit mt-8"
          />
        </form>
      </ButtonComponentCard>
    </>
  );
};

export default AddTransporter;
