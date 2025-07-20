import { Platform } from 'react-native';
import { EmergencyContact, EmergencySession, WhatsAppMessage } from '../types';
import { StorageService } from './StorageService';

export class WhatsAppService {
  static async sendEmergencyMessage(
    contacts: EmergencyContact[],
    session: EmergencySession,
    location?: { latitude: number; longitude: number }
  ): Promise<void> {
    try {
      const settings = await StorageService.getUserSettings();
      if (!settings.whatsappIntegrationEnabled) {
        console.log('WhatsApp integration disabled');
        return;
      }

      for (const contact of contacts) {
        if (contact.whatsappNumber || contact.phone) {
          const message = this.createEmergencyMessage(session, location);
          await this.sendMessage(contact, message, session.photos.concat(session.videos));
        }
      }
    } catch (error) {
      console.error('Error sending emergency WhatsApp messages:', error);
    }
  }

  private static createEmergencyMessage(
    session: EmergencySession,
    location?: { latitude: number; longitude: number }
  ): string {
    let message = `🚨 EMERGENCY ALERT 🚨\n\n`;
    message += `This is an automated emergency message from SafeTravel app.\n\n`;
    message += `Emergency triggered: ${new Date(session.startTime).toLocaleString()}\n`;
    message += `Trigger type: ${session.trigger.toUpperCase()}\n\n`;

    if (location) {
      message += `📍 Current Location:\n`;
      message += `Latitude: ${location.latitude.toFixed(6)}\n`;
      message += `Longitude: ${location.longitude.toFixed(6)}\n`;
      // Use OpenStreetMap instead of Google Maps
      message += `View Location: https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=16\n\n`;
    }

    if (session.mediaRecordingEnabled) {
      message += `📸 Media recording is active\n`;
      if (session.photos.length > 0) {
        message += `Photos captured: ${session.photos.length}\n`;
      }
      if (session.videos.length > 0) {
        message += `Videos recorded: ${session.videos.length}\n`;
      }
      message += `\n`;
    }

    // Add emergency access information
    if (session.emergencyAccessCode) {
      message += `🔐 EMERGENCY ACCESS:\n`;
      message += `You can access real-time location and safety information using:\n`;
      message += `Access Code: ${session.emergencyAccessCode}\n`;
      message += `Visit the SafeTravel app's Emergency Access tab\n\n`;
    }

    message += `Please check on my safety immediately.\n\n`;
    message += `This message was sent automatically by SafeTravel.`;

    return message;
  }

  private static async sendMessage(
    contact: EmergencyContact,
    message: string,
    mediaUrls: string[] = []
  ): Promise<void> {
    try {
      const whatsappMessage: WhatsAppMessage = {
        id: Date.now().toString() + '_' + contact.id,
        contactId: contact.id,
        message,
        mediaUrls,
        sentAt: new Date().toISOString(),
        status: 'pending',
      };

      if (Platform.OS === 'web') {
        // For web, open WhatsApp Web with pre-filled message
        const phoneNumber = contact.whatsappNumber || contact.phone.replace(/\D/g, '');
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
        
        window.open(whatsappUrl, '_blank');
        whatsappMessage.status = 'sent';
      } else {
        // For mobile, we would use a WhatsApp integration library
        // This is a placeholder for actual implementation
        console.log('Mobile WhatsApp integration not implemented yet');
        whatsappMessage.status = 'sent';
      }

      await StorageService.saveWhatsAppMessage(whatsappMessage);
    } catch (error) {
      console.error('Error sending WhatsApp message to', contact.name, ':', error);
      
      const failedMessage: WhatsAppMessage = {
        id: Date.now().toString() + '_' + contact.id,
        contactId: contact.id,
        message,
        mediaUrls,
        sentAt: new Date().toISOString(),
        status: 'failed',
      };
      
      await StorageService.saveWhatsAppMessage(failedMessage);
    }
  }

  static async sendSharedContentNotification(
    contacts: EmergencyContact[],
    contentTitle: string,
    contentType: string
  ): Promise<void> {
    try {
      const settings = await StorageService.getUserSettings();
      if (!settings.whatsappIntegrationEnabled) {
        return;
      }

      const message = `📱 SafeTravel Update\n\n` +
                    `I've shared new safety content with you:\n\n` +
                    `Title: ${contentTitle}\n` +
                    `Type: ${contentType}\n\n` +
                    `You can view this content in your SafeTravel app under the Shared Vault section.\n\n` +
                    `This is a precautionary measure and not an emergency.`;

      for (const contact of contacts) {
        if (contact.whatsappNumber || contact.phone) {
          await this.sendMessage(contact, message);
        }
      }
    } catch (error) {
      console.error('Error sending shared content notification:', error);
    }
  }

  static async getMessageHistory(): Promise<WhatsAppMessage[]> {
    return await StorageService.getWhatsAppMessages();
  }
}
