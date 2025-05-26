import { storage } from '../storage';
import type { InsertNotification } from '@shared/schema';

interface CreateNotificationData {
  officeId: number;
  userId: number;
  message: string;
  link?: string;
}

class NotificationService {
  async createNotification(data: CreateNotificationData): Promise<void> {
    try {
      const notificationData: InsertNotification = {
        officeId: data.officeId,
        userId: data.userId,
        message: data.message,
        link: data.link,
        // isRead defaults to false in the schema, so no need to set it here
        // createdAt defaults to now() in the schema
      };
      // Type assertion needed if InsertNotification expects more fields than provided by CreateNotificationData
      // However, with .omit in Zod schema, this should align.
      await storage.createDbNotification(notificationData as any); 
      console.log(`Notification created for user ${data.userId}: ${data.message}`);
    } catch (error) {
      console.error('Error creating notification:', error);
      // Depending on requirements, might re-throw or handle more gracefully
    }
  }

  // Example: Method to notify all users in an office (except one, if needed)
  async notifyAllInOffice(data: {
    officeId: number;
    message: string;
    link?: string;
    excludeUserId?: number;
  }): Promise<void> {
    try {
      const usersInOffice = await storage.getUsersByOffice(data.officeId);
      for (const user of usersInOffice) {
        if (user.id === data.excludeUserId) {
          continue; // Skip the user who triggered the event, if applicable
        }
        await this.createNotification({
          officeId: data.officeId,
          userId: user.id,
          message: data.message,
          link: data.link,
        });
      }
    } catch (error) {
      console.error(`Error notifying all users in office ${data.officeId}:`, error);
    }
  }
}

export const notificationService = new NotificationService();
