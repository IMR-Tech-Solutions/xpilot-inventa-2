import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ComponentCard from "../../components/common/ComponentCard";
import {
  getallcategoriesservice,
  deletecategoryservice,
  getsinglecategoryservice,
} from "../../services/categoryservices";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import Editcategory from "./Editcategories";
import { CategoryData } from "../../types/types";
import { handleError } from "../../utils/handleError";

const { Search } = Input;

const Allcategories = () => {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [filteredCategories, setfilteredCategories] = useState<CategoryData[]>(
    []
  );
  const [updateCategoryData, setUpdateCategoryData] =
    useState<CategoryData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getallcategoriesservice();
      setCategories(data);
      setfilteredCategories(data);
    } catch (err) {
      console.error("Error fetching categories:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = categories.filter(
      (category) =>
        category.category_name?.toLowerCase().includes(value.toLowerCase()) ||
        category.user_name?.toLowerCase().includes(value.toLowerCase())
    );
    setfilteredCategories(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: CategoryData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Category Owner",
      dataIndex: "user_name",
      key: "user_name",
      sorter: (a: CategoryData, b: CategoryData) =>
        (a.user_name || "").localeCompare(b.user_name || ""),
      render: (name: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Category Name",
      dataIndex: "category_name",
      key: "category_name",
      sorter: (a: CategoryData, b: CategoryData) =>
        (a.category_name || "").localeCompare(b.category_name || ""),
      render: (name: string) => (
        <span className="text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Category Image",
      dataIndex: "category_image",
      key: "category_image",
      render: (url: string) => (
        <img
          src={`${import.meta.env.VITE_API_IMG_URL}${url}`}
          alt="Category"
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
      render: (_: any, record: CategoryData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this category?"
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
        </Space>
      ),
    },
  ];

  const handledelete = async (categoryID: number) => {
    try {
      await deletecategoryservice(categoryID);
      toast.success("Category deleted successfully.");
      fetchCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      handleError(error);
    }
  };

  const handleEdit = async (categoryID: number) => {
    try {
      const categoryData = await getsinglecategoryservice(categoryID);
      setUpdateCategoryData(categoryData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable Update category:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Categories"
        description="Manage and organize product categories seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Categories" />
      <ComponentCard title="View All Categories">
        <div className="mb-4">
          <Search
            placeholder="Search categories..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredCategories}
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
          locale={{ emptyText: "No categories found." }}
        />
      </ComponentCard>
      {updateCategoryData && (
        <Editcategory
          fetchCategories={fetchCategories}
          categoryData={updateCategoryData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default Allcategories;
