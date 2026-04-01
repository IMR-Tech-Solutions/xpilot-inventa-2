import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { firebaseService } from "../../firebase/firebaseService";
import { toast } from "react-toastify";
import PageMeta from "../../components/common/PageMeta";

interface Notification {
  id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  time_ago: string;
  data: any;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await firebaseService.fetchNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    const success = await firebaseService.markAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      toast.success("Marked as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;

    const confirmed = window.confirm(
      `Mark all ${unreadCount} notifications as read?`
    );
    if (!confirmed) return;

    setMarkingAllRead(true);
    try {
      const success = await firebaseService.markAllAsRead();
      if (success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
        toast.success("All notifications marked as read");
      } else {
        toast.error("Failed to mark all as read");
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
      toast.error("Failed to mark all as read");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (notification.data?.type === "manager_request") {
      navigate("/shop/orders/request");
    } else if (notification.data?.type === "request_accepted") {
      navigate("/shop/orders");
    } else if (notification.data?.action_url) {
      const url = notification.data.action_url;
      if (url.startsWith("/")) {
        navigate(url);
      } else {
        window.open(url, "_blank");
      }
    }
  };

  return (
    <div>
      <PageMeta
        title="Notifications | Your App"
        description="View and manage your notifications"
      />

      <div className="rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="flex items-center space-x-4">
            <h3 className="font-semibold text-gray-800 text-theme-xl dark:text-white/90 sm:text-2xl">
              All Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                {unreadCount} unread
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllRead}
              className={`mt-4 sm:mt-0 px-4 py-2 text-sm rounded-lg border transition-colors ${
                markingAllRead
                  ? "text-gray-400 border-gray-300 cursor-not-allowed"
                  : "text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
              }`}
            >
              {markingAllRead ? "Marking all..." : "Mark All as Read"}
            </button>
          )}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center dark:bg-gray-800 mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
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
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No notifications
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              You're all caught up! No new notifications at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  !notification.is_read
                    ? "border-l-4 border-l-blue-500 bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4
                        className={`text-sm font-medium text-gray-900 dark:text-gray-100 ${
                          !notification.is_read ? "font-semibold" : ""
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {notification.time_ago}
                    </p>
                  </div>

                  {!notification.is_read && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(notification.id);
                      }}
                      className="ml-4 flex-shrink-0 px-3 py-1 text-xs text-green-600 border border-green-600 rounded hover:bg-green-50 transition-colors dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                    >
                      ✓ Mark Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
