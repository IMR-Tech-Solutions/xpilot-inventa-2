import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useEffect, useState } from "react";
import {
  getrolepermissionsservice,
  updaterolepermissionsservice,
} from "../../services/rolesservices";
import { getavailableservices } from "../../services/allavailableservices";
import { handleError } from "../../utils/handleError";
import ComponentCard from "../../components/common/ComponentCard";
import {
  Spin,
  Tag,
  Empty,
  Button,
  Checkbox,
  Collapse,
  Input,
  Badge,
  Space,
  Divider,
} from "antd";
import { CheckOutlined } from "@ant-design/icons";
import { toast } from "react-toastify";

const { Panel } = Collapse;
const { Search } = Input;

interface AvailablePermission {
  name: string;
  method: string;
}

interface GroupedPermissions {
  [key: string]: AvailablePermission[];
}

const Rolepermissions = () => {
  const { roleID } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [rolename, setRoleName] = useState<string>("");
  const [originalPermissions, setOriginalPermissions] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [availablepermissions, setAvailablepermissions] = useState<
    AvailablePermission[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 🆕 Theme colors based on your CSS variables
  const BRAND_COLOR = "#465fff"; // --color-brand-500
  const BLUE_LIGHT_COLOR = "#fdb022"; // --color-blue-light-500

  // Group permissions by module
  const groupPermissionsByModule = (
    permissions: AvailablePermission[]
  ): GroupedPermissions => {
    const groups: GroupedPermissions = {
      Categories: [],
      Products: [],
      Vendors: [],
      "Stock Management": [],
      Customers: [],
      "POS & Orders": [],
      Shop: [],
      Other: [],
    };

    permissions.forEach((permission) => {
      const method = permission.method.toLowerCase();

      if (method.includes("category") || method.includes("categories")) {
        groups["Categories"].push(permission);
      } else if (method.includes("product")) {
        groups["Products"].push(permission);
      } else if (method.includes("vendor")) {
        groups["Vendors"].push(permission);
      } else if (method.includes("stock") || method.includes("batch")) {
        groups["Stock Management"].push(permission);
      } else if (method.includes("customer")) {
        groups["Customers"].push(permission);
      } else if (method.includes("pos") || method.includes("order")) {
        groups["POS & Orders"].push(permission);
      } else if (method.includes("shop")) {
        groups["Shop"].push(permission);
      } else {
        groups["Other"].push(permission);
      }
    });

    // Remove empty groups
    Object.keys(groups).forEach((key) => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  };

  // Rest of your functions remain the same...
  const filterPermissions = (
    permissions: AvailablePermission[],
    search: string
  ) => {
    if (!search.trim()) return permissions;
    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(search.toLowerCase()) ||
        permission.method.toLowerCase().includes(search.toLowerCase())
    );
  };

  const getRolePermissions = async () => {
    setIsLoading(true);
    try {
      const response = await getrolepermissionsservice(Number(roleID));
      setRoleName(response.role);
      setOriginalPermissions(response.permissions);
      setSelectedPermissions(response.permissions);
    } catch (error) {
      console.error(error);
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailablePermission = async () => {
    setIsLoading(true);
    try {
      const response = await getavailableservices();
      setAvailablepermissions(response);
    } catch (error) {
      handleError(error);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePermission = (permToRemove: string) => {
    setSelectedPermissions((prev) => prev.filter((p) => p !== permToRemove));
  };

  const handleCheckboxChange = (checkedValues: string[]) => {
    setSelectedPermissions(checkedValues as string[]);
  };

  const handleModuleSelectAll = (modulePermissions: AvailablePermission[]) => {
    const moduleMethods = modulePermissions.map((p) => p.method);
    setSelectedPermissions((prev) => {
      const newPermissions = [...prev];
      moduleMethods.forEach((method) => {
        if (!newPermissions.includes(method)) {
          newPermissions.push(method);
        }
      });
      return newPermissions;
    });
  };

  const handleModuleSelectNone = (modulePermissions: AvailablePermission[]) => {
    const moduleMethods = modulePermissions.map((p) => p.method);
    setSelectedPermissions((prev) =>
      prev.filter((p) => !moduleMethods.includes(p))
    );
  };

  const isModuleFullySelected = (modulePermissions: AvailablePermission[]) => {
    return modulePermissions.every((p) =>
      selectedPermissions.includes(p.method)
    );
  };

  const isModulePartiallySelected = (
    modulePermissions: AvailablePermission[]
  ) => {
    return (
      modulePermissions.some((p) => selectedPermissions.includes(p.method)) &&
      !isModuleFullySelected(modulePermissions)
    );
  };

  const handleCancel = () => {
    setSelectedPermissions(originalPermissions);
    navigate(-1);
  };

  const handleSave = async () => {
    try {
      if (!roleID) return;
      const payload = {
        module_permissions: selectedPermissions,
      };
      await updaterolepermissionsservice(Number(roleID), payload);
      toast.success("Permissions updated successfully");
      setOriginalPermissions(selectedPermissions);
      navigate(-1);
    } catch (err) {
      handleError(err);
      console.error(err);
    }
  };

  useEffect(() => {
    if (roleID) {
      getRolePermissions();
      getAvailablePermission();
    }
  }, [roleID]);

  const groupedPermissions = groupPermissionsByModule(availablepermissions);
  const filteredGroupedPermissions = Object.keys(groupedPermissions).reduce(
    (acc, key) => {
      const filtered = filterPermissions(groupedPermissions[key], searchTerm);
      if (filtered.length > 0) {
        acc[key] = filtered;
      }
      return acc;
    },
    {} as GroupedPermissions
  );

  return (
    <div className="p-2 sm:p-4">
      <PageMeta
        title="Role Permissions"
        description={`Manage and assign permissions for ${rolename}`}
      />
      <PageBreadcrumb pageTitle="Role Permissions" />

      <ComponentCard
        title={rolename ? `Permissions for "${rolename}" Role` : "Permissions"}
      >
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold theme-text-2">
                  Current Permissions
                </h3>
                <Badge
                  count={selectedPermissions.length}
                  showZero
                  color={BRAND_COLOR} // 🆕 Using your brand color
                >
                  <Button size="small">Total Selected</Button>
                </Badge>
              </div>

              {selectedPermissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPermissions.map((permission) => (
                    <Tag
                      key={permission}
                      icon={<CheckOutlined />}
                      color="processing"
                      closable
                      onClose={() => handleRemovePermission(permission)}
                      className="px-3 py-1 text-sm font-medium capitalize"
                    >
                      {permission.replace(/-/g, " ")}
                    </Tag>
                  ))}
                </div>
              ) : (
                <Empty
                  description="No permissions assigned to this role."
                  className="my-8"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={handleCancel}>Cancel</Button>
              <Button type="primary" onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          </>
        )}
      </ComponentCard>

      <div className="my-6" />

      <ComponentCard title="Available Permissions">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Spin size="large" />
          </div>
        ) : (
          <>
            {/* Search Bar */}
            <div className="mb-6">
              <Search
                placeholder="Search premissions..."
                onChange={(e) => setSearchTerm(e.target.value)}
                className="custom-search"
              />
            </div>

            {/* Grouped Permissions */}
            {Object.keys(filteredGroupedPermissions).length > 0 ? (
              <Checkbox.Group
                value={selectedPermissions}
                onChange={handleCheckboxChange}
                className="w-full"
              >
                <Collapse
                  defaultActiveKey={Object.keys(filteredGroupedPermissions)}
                  ghost
                  className="bg-white dark:bg-gray-800"
                >
                  {Object.entries(filteredGroupedPermissions).map(
                    ([moduleName, modulePermissions]) => (
                      <Panel
                        header={
                          <div className="flex items-center justify-between w-full pr-4">
                            <Space>
                              <span className="font-semibold text-base theme-text-2">
                                {moduleName}
                              </span>
                              <Badge
                                count={modulePermissions.length}
                                showZero
                                color={BRAND_COLOR}
                              />
                              {isModuleFullySelected(modulePermissions) && (
                                <Tag color={BRAND_COLOR} className="text-xs">
                                  All Selected
                                </Tag>
                              )}
                              {isModulePartiallySelected(modulePermissions) && (
                                <Tag
                                  color={BLUE_LIGHT_COLOR}
                                  className="text-xs"
                                >
                                  Partial
                                </Tag>
                              )}
                            </Space>
                          </div>
                        }
                        key={moduleName}
                        className="mb-4"
                      >
                        <div className="pl-6">
                          <div className="mb-4 flex gap-2">
                            <Button
                              size="small"
                              type="dashed"
                              className="text-gray-500"
                              onClick={() =>
                                handleModuleSelectAll(modulePermissions)
                              }
                              disabled={isModuleFullySelected(
                                modulePermissions
                              )}
                            >
                              Select All
                            </Button>
                            <Button
                              size="small"
                              type="dashed"
                              className="!text-gray-500"
                              onClick={() =>
                                handleModuleSelectNone(modulePermissions)
                              }
                              disabled={
                                !modulePermissions.some((p) =>
                                  selectedPermissions.includes(p.method)
                                )
                              }
                            >
                              Select None
                            </Button>
                          </div>

                          <Divider className="my-4" />

                          {/* Permission Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {modulePermissions.map((item) => (
                              <div
                                key={item.method}
                                className={`
                                border rounded-lg px-3 py-1 transition-all duration-200 hover:shadow-md
                                ${
                                  selectedPermissions.includes(item.method)
                                    ? "border-blue-300 bg-blue-50 dark:bg-blue-900/20"
                                    : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
                                }
                              `}
                              >
                                <Checkbox
                                  value={item.method}
                                  className="w-full"
                                >
                                  <div className="ml-2">
                                    <div className="font-medium theme-text-2">
                                      {item.name}
                                    </div>
                                  </div>
                                </Checkbox>
                              </div>
                            ))}
                          </div>
                        </div>
                      </Panel>
                    )
                  )}
                </Collapse>
              </Checkbox.Group>
            ) : (
              <Empty
                description={
                  searchTerm
                    ? "No permissions match your search."
                    : "No available permissions."
                }
                className="my-8"
              />
            )}
          </>
        )}
      </ComponentCard>
    </div>
  );
};

export default Rolepermissions;
