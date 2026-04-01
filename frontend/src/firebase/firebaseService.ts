import { getToken, onMessage, MessagePayload } from "firebase/messaging";
import { messaging, VAPID_KEY } from "./config";
import { toast } from "react-toastify";
import api from "../services/baseapi";

class FirebaseService {
  async requestPermission(): Promise<string | null> {
    try {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
        });

        if (token) {
          await this.saveFCMTokenToBackend(token);
          return token;
        } else {
          console.log("No registration token available.");
          return null;
        }
      } else {
        console.log("Unable to get permission to notify.");
        return null;
      }
    } catch (error) {
      console.error("An error occurred while retrieving token:", error);
      return null;
    }
  }

  async saveFCMTokenToBackend(token: string): Promise<void> {
    try {
      await api.post("fcm-token/", {
        token: token,
        device_type: "web",
      });
      console.log("FCM token saved successfully");
    } catch (error) {
      console.error("Error saving FCM token:", error);
    }
  }

  onForegroundMessage(callback: (payload: MessagePayload) => void): void {
    onMessage(messaging, (payload: MessagePayload) => {
      let title =
        payload.notification?.title || payload.data?.title || "Notification";
      let body =
        payload.notification?.body ||
        payload.data?.body ||
        "You have a new message";
      window.dispatchEvent(new CustomEvent("newNotification"));
      toast.success(`${title}: ${body}`);
      if (callback) {
        callback(payload);
      }
    });
  }

  async fetchNotifications(): Promise<any> {
    try {
      const response = await api.get("list/");
      return response.data;
    } catch (error) {
      console.error("Error fetching notifications:", error);
      return { notifications: [], unread_count: 0 };
    }
  }

  async markAsRead(notificationId: number): Promise<boolean> {
    try {
      const response = await api.post(`${notificationId}/read/`);
      return response.status === 200;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      return false;
    }
  }

  async markAllAsRead(): Promise<boolean> {
    try {
      const response = await api.post("mark-all-read/");
      return response.status === 200;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      return false;
    }
  }
}

export const firebaseService = new FirebaseService();
