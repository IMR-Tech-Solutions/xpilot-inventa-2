import { useState } from "react";
import { all_routes } from "../../Router/allroutes";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import Label from "../../components/form/Label";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
import ButtonLoading from "../../components/common/ButtonLoading";
import { addUnitService } from "../../services/productservices";
import { handleError } from "../../utils/handleError";

const AddUnit = () => {
  const [UnitName, setUnitName] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!UnitName.trim()) {
      toast.error("Unit name is required");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("unitName", UnitName);
    if (weightKg) formData.append("weight_kg", weightKg);

    try {
      await addUnitService(formData);
      toast.success("Unit added successfully!");
      setUnitName("");
      setWeightKg("");
    } catch (error: any) {
      console.error("Error adding Unit:", error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Add Unit"
        description="Add new unit to your inventory with Inventa."
      />
      <PageBreadcrumb pageTitle="Add Unit" />
      <ButtonComponentCard
        title="Unit Name"
        buttonlink={all_routes.allunits}
        buttontitle="View All Units"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
            <div>
              <Label>Unit Name</Label>
              <input
                type="text"
                value={UnitName}
                onChange={(e) => setUnitName(e.target.value)}
                className="input-field"
                placeholder="e.g. 50 Kg Bag"
              />
            </div>
            <div>
              <Label>
                Weight per Bag (kg){" "}
                <span className="text-gray-400 font-normal text-xs">— optional</span>
              </Label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="input-field"
                placeholder="e.g. 50"
                min="0"
                step="0.001"
              />
              <p className="text-xs text-gray-400 mt-1">
                Used to auto-calculate tonnes from bags
              </p>
            </div>
          </div>
          <ButtonLoading
            loading={isLoading}
            state={"Add Unit"}
            loadingstate={"Adding Unit.."}
            className="w-fit"
          />
        </form>
      </ButtonComponentCard>
    </>
  );
};

export default AddUnit;
