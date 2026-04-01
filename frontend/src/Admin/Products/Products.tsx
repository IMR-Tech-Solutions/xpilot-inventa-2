import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getallproductservice,
  getsingleproductservice,
  deleteproductservice,
} from "../../services/productservices";
import {
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import EditProduct from "./EditProduct";
import { ProductData } from "../../types/types";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";
import { useNavigate } from "react-router";

const { Search } = Input;

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [filteredProducts, setfilteredProducts] = useState<ProductData[]>([]);
  const [updateProductData, setUpdateProductData] =
    useState<ProductData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getallproductservice();
      setProducts(data);
      setfilteredProducts(data);
    } catch (err) {
      console.error("Error fetching products:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (value: string) => {
    const searchTerm = value.toLowerCase();
    const filtered = products.filter(
      (product) =>
        product.product_name?.toLowerCase().includes(searchTerm) ||
        product.category_name?.toLowerCase().includes(searchTerm) ||
        String(product.active_stock?.quantity ?? "")
          .toLowerCase()
          .includes(searchTerm) ||
        String(product.active_stock?.selling_price ?? "")
          .toLowerCase()
          .includes(searchTerm) ||
        (product.is_active ? "active" : "inactive").includes(searchTerm) ||
        product.sku_code?.toLowerCase().includes(searchTerm)
    );
    setfilteredProducts(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: ProductData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "SKU",
      dataIndex: "sku_code",
      key: "sku_code",
      sorter: (a: ProductData, b: ProductData) =>
        (a.sku_code || "").localeCompare(b.sku_code || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Product Name",
      dataIndex: "product_name",
      key: "product_name",
      sorter: (a: ProductData, b: ProductData) =>
        (a.product_name || "").localeCompare(b.product_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Category Name",
      dataIndex: "category_name",
      key: "category_name",
      sorter: (a: ProductData, b: ProductData) =>
        (a.category_name || "").localeCompare(b.category_name || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    // {
    //   title: "Quantity",
    //   dataIndex: "active_stock",
    //   key: "quantity",
    //   render: (stock: ProductData["active_stock"]) => (
    //     <span>{stock?.quantity}</span>
    //   ),
    // },
    // {
    //   title: "Selling Price",
    //   dataIndex: "active_stock",
    //   key: "selling_price",
    //   render: (stock: ProductData["active_stock"]) => (
    //     <span className="text-gray-800 dark:text-white/90">
    //       ₹{Number(stock?.selling_price).toFixed(2)}
    //     </span>
    //   ),
    // },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive: boolean) => (
        <span
          className={
            isActive ? "text-green-600 font-medium" : "text-red-600 font-medium"
          }
        >
          {isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      title: "Product Image",
      dataIndex: "product_image",
      key: "product_image",
      render: (url: string) => (
        <img
          src={`${url}`}
          alt="Product-Image"
          style={{
            width: "40px",
            height: "40px",
            objectFit: "contain",
            borderRadius: "100%",
          }}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: ProductData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this product?"
            onConfirm={() => handledelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              id="table-delete-btn"
              size="small"
              icon={<DeleteOutlined />}
              loading={loading}
            />
          </Popconfirm>
          <Button
            id="table-update-btn"
            size="small"
            icon={<EditOutlined />}
            loading={loading}
            onClick={() => handleEdit(record.id)}
          />
          <Button
            id="table-manage-btn"
            size="small"
            icon={<AppstoreOutlined />}
            loading={loading}
            onClick={() => handleStock(record.id)}
            title="Manage Stock"
          />
        </Space>
      ),
    },
  ];

  const handledelete = async (productID: number) => {
    try {
      await deleteproductservice(productID);
      toast.success("Product deleted successfully.");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      handleError(error);
    }
  };

  const handleEdit = async (productID: number) => {
    try {
      const productData = await getsingleproductservice(productID);
      setUpdateProductData(productData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable Update product:", error);
      handleError(error);
    }
  };

  const handleStock = async (productID: number) => {
    const encodedID = btoa(productID.toString());
    navigate(`/manage-stock/product/${encodedID}`);
  };

  return (
    <div>
      <PageMeta
        title="Products"
        description="Manage and organize products seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Products" />
      <ButtonComponentCard
        title="View All Products"
        buttonlink={all_routes.addproducts}
        buttontitle="Add Products"
      >
        <div className="mb-4">
          <Search
            placeholder="Search products..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredProducts}
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
          locale={{ emptyText: "No products found." }}
        />
      </ButtonComponentCard>
      {updateProductData && (
        <EditProduct
          fetchProducts={fetchProducts}
          selectedProduct={updateProductData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default AdminProducts;
