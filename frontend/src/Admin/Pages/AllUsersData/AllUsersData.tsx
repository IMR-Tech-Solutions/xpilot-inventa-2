import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Drawer,
  Tabs,
  Descriptions,
  Statistic,
  Row,
  Col,
  Card,
  Avatar,
  Space,
  Input,
} from "antd";
import {
  UserOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  ShopOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ButtonComponentCard from "../../Components/ButtonComponentCard";
import { handleError } from "../../../utils/handleError";
import { getAllUsersDataService, getUserDetailService } from "./managementservices";

const { Search } = Input;

const ROLE_COLORS: Record<string, string> = {
  admin: "red",
  manager: "blue",
  franchise: "purple",
  "shop owner": "purple",
  shopowner: "purple",
  cashier: "cyan",
  staff: "geekblue",
};

const getRoleColor = (role: string) =>
  ROLE_COLORS[role?.toLowerCase()] || "default";

const formatINR = (v: number) =>
  `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  mobile_number: string;
  business_name: string | null;
  city: string | null;
  state: string | null;
  is_active: boolean;
  last_login: string | null;
  role_name: string;
  user_image: string | null;
}

interface UserDetail {
  profile: UserRow & { country: string | null; postal_code: string | null };
  pos: {
    total_orders: number;
    total_revenue: number;
    completed: number;
    pending: number;
    cancelled: number;
    recent_orders: {
      id: number;
      order_number: string;
      customer_name: string;
      total_amount: number;
      order_status: string;
      payment_status: string;
      created_at: string;
    }[];
  };
  customers: {
    total_customers: number;
    recent_customers: {
      id: number;
      name: string;
      phone: string;
      city: string | null;
      type_of_customer: string | null;
      created_at: string;
    }[];
  };
  shop_as_owner: {
    total_orders: number;
    total_spent: number;
    completed: number;
    cancelled: number;
    recent_orders: {
      id: number;
      order_number: string;
      status: string;
      total_amount: number;
      payment_status: string;
      created_at: string;
    }[];
  };
  shop_as_manager: {
    total_fulfilled: number;
    completed: number;
  };
}

const ORDER_STATUS_COLOR: Record<string, string> = {
  completed: "green",
  pending: "orange",
  cancelled: "red",
  confirmed: "blue",
  processing: "cyan",
  ready: "purple",
  packing: "cyan",
  delivery_in_progress: "purple",
  partially_fulfilled: "blue",
  order_placed: "orange",
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
  paid: "green",
  partial: "orange",
  pending: "red",
  failed: "red",
};

const AllUsersData = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [activeTab, setActiveTab] = useState("profile");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersDataService();
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (value: string) => {
    const q = value.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          `${u.first_name} ${u.last_name}`.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.mobile_number?.includes(q) ||
          u.role_name?.toLowerCase().includes(q) ||
          u.business_name?.toLowerCase().includes(q) ||
          u.city?.toLowerCase().includes(q)
      )
    );
    setCurrentPage(1);
  };

  const openDrawer = async (userId: number) => {
    setDrawerOpen(true);
    setDetail(null);
    setActiveTab("profile");
    setDetailLoading(true);
    try {
      const data = await getUserDetailService(userId);
      setDetail(data);
    } catch (err) {
      handleError(err);
      toast.error("Failed to load user details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns = [
    {
      title: "Sr.",
      key: "srno",
      width: 55,
      render: (_: any, __: UserRow, index: number) =>
        (currentPage - 1) * pageSize + index + 1,
    },
    {
      title: "User",
      key: "user",
      render: (_: any, record: UserRow) => (
        <Space>
          <Avatar
            src={
              record.user_image
                ? `${import.meta.env.VITE_API_IMG_URL}${record.user_image}`
                : undefined
            }
            icon={<UserOutlined />}
            size={36}
          />
          <div>
            <div className="font-medium text-sm text-gray-800 dark:text-white/90">
              {record.first_name} {record.last_name}
            </div>
            {record.business_name && (
              <div className="text-xs text-gray-400">{record.business_name}</div>
            )}
          </div>
        </Space>
      ),
    },
    {
      title: "Role",
      dataIndex: "role_name",
      key: "role_name",
      filters: [...new Set(users.map((u) => u.role_name))].map((r) => ({
        text: r,
        value: r,
      })),
      onFilter: (value: any, record: UserRow) => record.role_name === value,
      render: (role: string) => (
        <Tag color={getRoleColor(role)} className="capitalize">
          {role || "N/A"}
        </Tag>
      ),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (v: string) => (
        <span className="text-xs text-gray-600 dark:text-white/70">{v || "—"}</span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "mobile_number",
      key: "mobile_number",
      render: (v: string) => <span className="text-sm">{v || "—"}</span>,
    },
    {
      title: "City",
      dataIndex: "city",
      key: "city",
      render: (v: string) => <span className="text-sm">{v || "—"}</span>,
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 90,
      render: (active: boolean) => (
        <Tag color={active ? "green" : "red"}>{active ? "Active" : "Inactive"}</Tag>
      ),
    },
    {
      title: "Last Login",
      dataIndex: "last_login",
      key: "last_login",
      render: (v: string) =>
        v ? dayjs(v).format("DD MMM YYYY, hh:mm A") : <span className="text-gray-400">Never</span>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: UserRow) => (
        <Button
          size="small"
          type="primary"
          icon={<EyeOutlined />}
          onClick={() => openDrawer(record.id)}
        >
          View
        </Button>
      ),
    },
  ];

  // ── Drawer tab content ───────────────────────────────────────────────────────
  const profileTab = detail && (
    <Descriptions column={{ xs: 1, sm: 2 }} size="small" bordered>
      <Descriptions.Item label="Full Name">
        {detail.profile.first_name} {detail.profile.last_name}
      </Descriptions.Item>
      <Descriptions.Item label="Role">
        <Tag color={getRoleColor(detail.profile.role_name)}>
          {detail.profile.role_name}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="Email">{detail.profile.email}</Descriptions.Item>
      <Descriptions.Item label="Phone">{detail.profile.mobile_number}</Descriptions.Item>
      <Descriptions.Item label="Business">{detail.profile.business_name || "—"}</Descriptions.Item>
      <Descriptions.Item label="Status">
        <Tag color={detail.profile.is_active ? "green" : "red"}>
          {detail.profile.is_active ? "Active" : "Inactive"}
        </Tag>
      </Descriptions.Item>
      <Descriptions.Item label="City">{detail.profile.city || "—"}</Descriptions.Item>
      <Descriptions.Item label="State">{detail.profile.state || "—"}</Descriptions.Item>
      <Descriptions.Item label="Country">{detail.profile.country || "—"}</Descriptions.Item>
      <Descriptions.Item label="Postal Code">{detail.profile.postal_code || "—"}</Descriptions.Item>
      <Descriptions.Item label="Last Login" span={2}>
        {detail.profile.last_login
          ? dayjs(detail.profile.last_login).format("DD MMM YYYY, hh:mm A")
          : "Never"}
      </Descriptions.Item>
    </Descriptions>
  );

  const posTab = detail && (
    <div>
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Orders"
              value={detail.pos.total_orders}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Revenue"
              value={detail.pos.total_revenue}
              prefix="₹"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Completed"
              value={detail.pos.completed}
              valueStyle={{ color: "#3f8600" }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Pending" value={detail.pos.pending} valueStyle={{ color: "#d46b08" }} />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic title="Cancelled" value={detail.pos.cancelled} valueStyle={{ color: "#cf1322" }} />
          </Card>
        </Col>
      </Row>
      <p className="text-xs text-gray-400 mb-2">Recent 10 orders</p>
      <Table
        size="small"
        dataSource={detail.pos.recent_orders}
        rowKey="id"
        pagination={false}
        columns={[
          { title: "Order No", dataIndex: "order_number", key: "order_number" },
          { title: "Customer", dataIndex: "customer_name", key: "customer_name" },
          {
            title: "Amount",
            dataIndex: "total_amount",
            key: "total_amount",
            render: (v: number) => formatINR(v),
          },
          {
            title: "Order Status",
            dataIndex: "order_status",
            key: "order_status",
            render: (v: string) => (
              <Tag color={ORDER_STATUS_COLOR[v] || "default"}>
                {v.replace(/_/g, " ").toUpperCase()}
              </Tag>
            ),
          },
          {
            title: "Payment",
            dataIndex: "payment_status",
            key: "payment_status",
            render: (v: string) => (
              <Tag color={PAYMENT_STATUS_COLOR[v] || "default"}>{v.toUpperCase()}</Tag>
            ),
          },
          {
            title: "Date",
            dataIndex: "created_at",
            key: "created_at",
            render: (v: string) => dayjs(v).format("DD MMM YYYY"),
          },
        ]}
        scroll={{ x: 600 }}
        locale={{ emptyText: "No POS orders." }}
      />
    </div>
  );

  const customersTab = detail && (
    <div>
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} sm={8}>
          <Card size="small">
            <Statistic
              title="Total Customers"
              value={detail.customers.total_customers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
      </Row>
      <p className="text-xs text-gray-400 mb-2">Recent 10 customers</p>
      <Table
        size="small"
        dataSource={detail.customers.recent_customers}
        rowKey="id"
        pagination={false}
        columns={[
          { title: "Name", dataIndex: "name", key: "name" },
          { title: "Phone", dataIndex: "phone", key: "phone" },
          { title: "City", dataIndex: "city", key: "city", render: (v: string) => v || "—" },
          {
            title: "Type",
            dataIndex: "type_of_customer",
            key: "type_of_customer",
            render: (v: string) => v ? <Tag>{v.replace(/_/g, " ")}</Tag> : "—",
          },
          {
            title: "Added On",
            dataIndex: "created_at",
            key: "created_at",
            render: (v: string) => dayjs(v).format("DD MMM YYYY"),
          },
        ]}
        locale={{ emptyText: "No customers." }}
      />
    </div>
  );

  const shopTab = detail && (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
        As Franchise Owner
      </p>
      <Row gutter={[12, 12]} className="mb-4">
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Orders" value={detail.shop_as_owner.total_orders} prefix={<ShopOutlined />} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Spent" value={detail.shop_as_owner.total_spent} prefix="₹" precision={2} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Completed" value={detail.shop_as_owner.completed} valueStyle={{ color: "#3f8600" }} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Cancelled" value={detail.shop_as_owner.cancelled} valueStyle={{ color: "#cf1322" }} />
          </Card>
        </Col>
      </Row>
      {detail.shop_as_owner.recent_orders.length > 0 && (
        <>
          <p className="text-xs text-gray-400 mb-2">Recent 10 shop orders</p>
          <Table
            size="small"
            dataSource={detail.shop_as_owner.recent_orders}
            rowKey="id"
            pagination={false}
            columns={[
              { title: "Order No", dataIndex: "order_number", key: "order_number" },
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (v: string) => (
                  <Tag color={ORDER_STATUS_COLOR[v] || "default"}>
                    {v.replace(/_/g, " ").toUpperCase()}
                  </Tag>
                ),
              },
              {
                title: "Amount",
                dataIndex: "total_amount",
                key: "total_amount",
                render: (v: number) => formatINR(v),
              },
              {
                title: "Payment",
                dataIndex: "payment_status",
                key: "payment_status",
                render: (v: string) => (
                  <Tag color={PAYMENT_STATUS_COLOR[v] || "default"}>{v.toUpperCase()}</Tag>
                ),
              },
              {
                title: "Date",
                dataIndex: "created_at",
                key: "created_at",
                render: (v: string) => dayjs(v).format("DD MMM YYYY"),
              },
            ]}
            scroll={{ x: 500 }}
            locale={{ emptyText: "No shop orders." }}
          />
        </>
      )}

      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
          As Manager / Fulfiller
        </p>
        <Row gutter={[12, 12]}>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic
                title="Orders Fulfilled"
                value={detail.shop_as_manager.total_fulfilled}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={12} sm={8}>
            <Card size="small">
              <Statistic
                title="Completed"
                value={detail.shop_as_manager.completed}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );

  const drawerUser = detail?.profile;

  return (
    <div>
      <PageMeta
        title="All Users Data"
        description="Admin view of all users and their activity."
      />
      <PageBreadcrumb pageTitle="All Users Data" />

      <ButtonComponentCard title="All Users" buttontitle="" buttonlink="">
        <div className="mb-4">
          <Search
            placeholder="Search by name, email, role, city..."
            onSearch={handleSearch}
            onChange={(e) => handleSearch(e.target.value)}
            className="custom-search"
            style={{ maxWidth: 400 }}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filtered}
          loading={loading}
          rowKey="id"
          className="custom-orders-table"
          pagination={{ pageSize }}
          onChange={(pagination) => setCurrentPage(pagination.current || 1)}
          scroll={{ x: 1000 }}
          locale={{ emptyText: "No users found." }}
        />
      </ButtonComponentCard>

      {/* ── User Detail Drawer ──────────────────────────────────────────────── */}
      <Drawer
        title={
          drawerUser ? (
            <Space>
              <Avatar
                src={
                  drawerUser.user_image
                    ? `${import.meta.env.VITE_API_IMG_URL}${drawerUser.user_image}`
                    : undefined
                }
                icon={<UserOutlined />}
                size={40}
              />
              <div>
                <div className="font-semibold">
                  {drawerUser.first_name} {drawerUser.last_name}
                </div>
                <Tag
                  color={getRoleColor(drawerUser.role_name)}
                  className="capitalize mt-0.5"
                  style={{ fontSize: 11 }}
                >
                  {drawerUser.role_name}
                </Tag>
              </div>
            </Space>
          ) : (
            "User Details"
          )
        }
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={720}
        loading={detailLoading}
      >
        {detail && (
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: "profile",
                label: "Profile",
                icon: <UserOutlined />,
                children: profileTab,
              },
              {
                key: "pos",
                label: `POS (${detail.pos.total_orders})`,
                icon: <ShoppingCartOutlined />,
                children: posTab,
              },
              {
                key: "customers",
                label: `Customers (${detail.customers.total_customers})`,
                icon: <TeamOutlined />,
                children: customersTab,
              },
              {
                key: "shop",
                label: "Shop Activity",
                icon: <ShopOutlined />,
                children: shopTab,
              },
            ]}
          />
        )}
      </Drawer>
    </div>
  );
};

export default AllUsersData;
