import { useState } from "react";
import { all_routes } from "../../Router/allroutes";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import FileInput from "../../components/form/input/FileInput";
import Label from "../../components/form/Label";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import { toast } from "react-toastify";
import ButtonLoading from "../../components/common/ButtonLoading";
import { addcategoryservice } from "../../services/categoryservices";
import { handleError } from "../../utils/handleError";

const Addcategories = () => {
  const [categoryName, setCategoryName] = useState("");
  const [categoryImage, setCategoryImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCategoryImage(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error("Category name is required");
      return;
    }
    setIsLoading(true);
    const formData = new FormData();
    formData.append("category_name", categoryName);
    if (categoryImage) {
      formData.append("category_image", categoryImage);
    }
    try {
      await addcategoryservice(formData);
      toast.success("Category added successfully!");
      setCategoryName("");
      setCategoryImage(null);
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error: any) {
      console.error("Error adding category:", error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Add Categories"
        description="Add new product categories to your inventory with Inventa. Easily upload category images, organize items, and streamline your inventory management."
      />
      <PageBreadcrumb pageTitle="Add Categories" />
      <ButtonComponentCard
        title="Category Description"
        buttonlink={all_routes.categories}
        buttontitle="View All Categories"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3 ">
            <div>
              <Label>Category Name</Label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="input-field"
                placeholder="Enter category name"
              />
            </div>
            <div>
              <Label>Category Image</Label>
              <FileInput
                onChange={handleFileChange}
                className="custom-class"
                // @ts-ignore
                accept=".png, .jpg, .jpeg"
              />
              <p className="text-xs text-gray-400 my-2">
                upload only .jpeg, .jpg and .png file only
              </p>
            </div>
          </div>
          <ButtonLoading
            loading={isLoading}
            state={"Add Category"}
            loadingstate={"Adding Category.."}
            className="w-fit"
          />
        </form>
      </ButtonComponentCard>
    </>
  );
};

export default Addcategories;
