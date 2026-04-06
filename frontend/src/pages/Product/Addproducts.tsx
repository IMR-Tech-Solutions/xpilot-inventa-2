import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ButtonLoading from "../../components/common/ButtonLoading";
import Label from "../../components/form/Label";
import FileInput from "../../components/form/input/FileInput";
import { toast } from "react-toastify";
import { handleError } from "../../utils/handleError";
import { getmycategoryservice } from "../../services/categoryservices";
import { CategoryData } from "../../types/types";
import { UnitData } from "../ProductUnits/ViewUnit";
import {
  addproductservice,
  getUnitsForUserService,
} from "../../services/productservices";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import { all_routes } from "../../Router/allroutes";

const AddProducts = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [productData, setProductData] = useState({
    category: "",
    product_name: "",
    sku_code: "",
    hsn_code: "",
    description: "",
    unit: "",
    low_stock_threshold: "10",
    selling_price: "",
    is_live: false,
    is_active: true,
  });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [unit, setUnit] = useState<UnitData[]>([]);

  const fetchCategories = async () => {
    try {
      const res = await getmycategoryservice();
      setCategories(res);
    } catch (err) {
      handleError(err);
      console.error("Error fetching categories:", err);
    }
  };

  const fetchUnit = async () => {
    try {
      const res = await getUnitsForUserService();
      setUnit(res);
    } catch (err) {
      handleError(err);
      console.error("Error fetching units:", err);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchUnit();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setProductData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setProductData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProductImage(file);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const requiredFields = [
      "category",
      "product_name",
      "low_stock_threshold",
    ];

    for (const field of requiredFields) {
      if (!productData[field as keyof typeof productData]) {
        toast.error(`${field.replace("_", " ")} is required.`);
        return;
      }
    }

    if (parseInt(productData.low_stock_threshold) < 0) {
      toast.error("Low stock threshold must be a positive number.");
      return;
    }

    setIsLoading(true);

    const data = new FormData();
    for (const key in productData) {
      const value = (productData as any)[key];
      if (typeof value === "boolean") {
        data.append(key, value.toString());
      } else {
        data.append(key, value);
      }
    }
    if (productImage) {
      data.append("product_image", productImage);
    }

    try {
      await addproductservice(data);
      toast.success("Product added successfully!");
      setProductData({
        category: "",
        product_name: "",
        sku_code: "",
        hsn_code: "",
        description: "",
        unit: "",
        low_stock_threshold: "10",
        selling_price: "",
        is_live: false,
        is_active: true,
      });
      setProductImage(null);

      // Reset file input
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
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
        title="Add Product"
        description="Add a new product to Inventa System"
      />
      <PageBreadcrumb pageTitle="Add New Product" />
      <ButtonComponentCard
        title="Product Information"
        buttonlink={all_routes.products}
        buttontitle="View All Products"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-3">
            <div>
              <Label>Category</Label>
              <select
                name="category"
                value={productData.category}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" className="text-black">
                  Select Category
                </option>
                {categories.map((category: CategoryData) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="text-black"
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Product Name</Label>
              <input
                type="text"
                name="product_name"
                value={productData.product_name}
                onChange={handleChange}
                className="input-field"
                maxLength={150}
                placeholder="Enter product name"
              />
            </div>
            <div>
              <Label>SKU Code</Label>
              <input
                type="text"
                name="sku_code"
                value={productData.sku_code}
                onChange={handleChange}
                className="input-field"
                maxLength={50}
                placeholder="Enter SKU code (optional, auto-generated if empty)"
              />
            </div>
            <div>
              <Label>HSN Code <span className="text-gray-400 font-normal text-xs">— optional</span></Label>
              <input
                type="text"
                name="hsn_code"
                value={productData.hsn_code}
                onChange={handleChange}
                className="input-field"
                maxLength={20}
                placeholder="e.g. 1001, 0902"
              />
            </div>
            {/* <div>
              <Label>Unit</Label>
              <input
                type="text"
                name="unit"
                value={productData.unit}
                onChange={handleChange}
                className="input-field"
                maxLength={50}
                placeholder="e.g., pieces, kg, liters"
              />
            </div> */}
            <div>
              <Label>Unit (Weight)</Label>
              <select
                name="unit"
                value={productData.unit}
                onChange={handleChange}
                className="input-field"
              >
                <option value="" className="text-black">
                  Select Unit
                </option>
                {unit.map((unit: UnitData) => (
                  <option key={unit.id} value={unit.id} className="text-black">
                    {unit.unitName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Low Stock Threshold</Label>
              <input
                type="number"
                name="low_stock_threshold"
                value={productData.low_stock_threshold}
                onChange={handleChange}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <Label>Selling Price (₹) <span className="text-gray-400 font-normal text-xs">— optional, editable at POS</span></Label>
              <input
                type="number"
                name="selling_price"
                value={productData.selling_price}
                onChange={handleChange}
                className="input-field"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Product Image</Label>
              <FileInput
                onChange={handleFileChange}
                // @ts-ignore
                accept=".png,.jpg,.jpeg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepts only .jpeg, .jpg, .png
              </p>
            </div>
          </div>

          {/* Description - Full width */}
          <div className="mb-5">
            <Label>Description</Label>
            <textarea
              name="description"
              value={productData.description}
              onChange={handleChange}
              className="input-field min-h-[100px] resize-vertical"
              placeholder="Enter product description..."
              rows={4}
            />
          </div>

          {/* Status Checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={productData.is_active}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Label htmlFor="is_active" className="mb-0">
                Product is Active
              </Label>
            </div>
          </div>

          <ButtonLoading
            loading={isLoading}
            state="Add Product"
            loadingstate="Adding Product..."
            className="w-fit mt-8"
          />
        </form>
      </ButtonComponentCard>
    </>
  );
};

export default AddProducts;
