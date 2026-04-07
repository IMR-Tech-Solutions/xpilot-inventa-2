import { useEffect, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { Table, Input, Button, Space, Popconfirm } from "antd";
import ButtonComponentCard from "../../Admin/Components/ButtonComponentCard";
import {
  getUnitsForUserService,
  deleteUnitService,
  getUnitDetailsService,
} from "../../services/productservices";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";
import EditUnit from "./EditUnit";
import { handleError } from "../../utils/handleError";
import { all_routes } from "../../Router/allroutes";

const { Search } = Input;

export interface UnitData {
  id: number;
  user: number;
  user_name: string;
  unitName: string;
  weight_kg: number | null;
}

const ViewUnit = () => {
  const [units, setUnits] = useState<UnitData[]>([]);
  const [filteredUnits, setfilteredUnits] = useState<UnitData[]>([]);
  const [updateUnitData, setUpdateUnitData] = useState<UnitData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fetchAllUnits = async () => {
    setLoading(true);
    try {
      const data = await getUnitsForUserService();
      setUnits(data);
      setfilteredUnits(data);
    } catch (err) {
      console.error("Error fetching units:", err);
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUnits();
  }, []);

  const handleSearch = (value: string) => {
    const filtered = units.filter((unit) =>
      unit.unitName?.toLowerCase().includes(value.toLowerCase())
    );
    setfilteredUnits(filtered);
    setCurrentPage(1);
  };

  const columns = [
    {
      title: "Sr. No",
      key: "srno",
      render: (_: any, __: UnitData, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "Unit Name",
      dataIndex: "unitName",
      key: "unitName",
      sorter: (a: UnitData, b: UnitData) =>
        (a.unitName || "").localeCompare(b.unitName || ""),
      render: (name: string) => (
        <span className="truncate text-gray-800 dark:text-white/90">
          {name || "N/A"}
        </span>
      ),
    },
    {
      title: "Weight per Bag (kg)",
      dataIndex: "weight_kg",
      key: "weight_kg",
      render: (w: number | null) => (
        <span className="text-gray-700 dark:text-white/80">
          {w != null ? `${w} kg` : "—"}
        </span>
      ),
    },

    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: UnitData) => (
        <Space size="small">
          <Popconfirm
            title="Are you sure to delete this unit?"
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

  const handledelete = async (unitID: number) => {
    try {
      await deleteUnitService(unitID);
      toast.success("Unit deleted successfully.");
      fetchAllUnits();
    } catch (error) {
      console.error("Error deleting unit:", error);
      handleError(error);
    }
  };

  const handleEdit = async (unitID: number) => {
    try {
      const unitData = await getUnitDetailsService(unitID);
      setUpdateUnitData(unitData);
      setModalVisible(true);
    } catch (error) {
      console.error("Unable Update unit:", error);
      handleError(error);
    }
  };

  return (
    <div>
      <PageMeta
        title="Units"
        description="Manage and organize product units seamlessly with Inventa."
      />
      <PageBreadcrumb pageTitle="Units" />
      <ButtonComponentCard
        title="View All Units"
        buttonlink={all_routes.addunit}
        buttontitle="Add Units"
      >
        <div className="mb-4">
          <Search
            placeholder="Search units..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredUnits}
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
          locale={{ emptyText: "No units found." }}
        />
      </ButtonComponentCard>
      {updateUnitData && (
        <EditUnit
          fetchAllUnits={fetchAllUnits}
          unitData={updateUnitData}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
        />
      )}
    </div>
  );
};

export default ViewUnit;
