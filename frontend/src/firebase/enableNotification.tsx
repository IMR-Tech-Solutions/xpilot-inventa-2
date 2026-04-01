import { useState, useEffect } from "react";
import { firebaseService } from "./firebaseService";
import { toast } from "react-toastify";

export default function EnableNotificationsButton() {
  const [loading, setLoading] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const checkPermission = () => {
      setPermissionGranted(Notification.permission === "granted");
    };

    checkPermission();
    const interval = setInterval(checkPermission, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEnableNotifications = async () => {
    setLoading(true);
    try {
      const token = await firebaseService.requestPermission();
      if (token) {
        setPermissionGranted(true);
        toast.success("Notifications enabled successfully!");
      } else {
        toast.error("Failed to enable notifications. Please try again.");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setLoading(false);
    }
  };


  if (permissionGranted) {
    return null;
  }

  return (
    <button
      onClick={handleEnableNotifications}
      disabled={loading}
      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-5 5-5-5h5V3h0z"
        />
      </svg>
      <span>{loading ? "Enabling..." : "Enable Notifications"}</span>
    </button>
  );
}
