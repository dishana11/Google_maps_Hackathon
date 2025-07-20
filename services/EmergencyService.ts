import { Platform } from 'react-native';
import { EmergencySession, LocationData, UserSettings } from '../types';
import { LocationService } from './LocationService';
import { StorageService } from './StorageService';
import { WhatsAppService } from './WhatsAppService';

export class EmergencyService {
  private static activeSession: EmergencySession | null = null;
  private static locationCallback: ((location: LocationData) => void) | null = null;

  static async startEmergencySession(trigger: 'manual' | 'voice' | 'auto' | 'speed'): Promise<string | null> {
    try {
      const sessionId = Date.now().toString();
      const currentLocation = await LocationService.getCurrentLocation();
      
      const session: EmergencySession = {
        id: sessionId,
        startTime: new Date().toISOString(),
        locations: currentLocation ? [currentLocation] : [],
        photos: [],
        videos: [],
        voiceNotes: [],
        isActive: true,
        trigger,
        contactsNotified: [],
        mediaRecordingEnabled: false,
        whatsappMessagesSent: [],
        emergencyAccessCode: this.generateAccessCode(),
      };

      this.activeSession = session;
      await StorageService.saveEmergencySession(session);

      // Start location tracking
      this.locationCallback = (location: LocationData) => {
        this.addLocationToSession(sessionId, location);
      };

      await LocationService.startLocationTracking(this.locationCallback);

      // Trigger emergency notifications
      await this.notifyEmergencyContacts(sessionId);

      return sessionId;
    } catch (error) {
      console.error('Error starting emergency session:', error);
      return null;
    }
  }

  static async startEmergencySessionWithMedia(trigger: 'manual' | 'voice' | 'auto' | 'speed'): Promise<string | null> {
    const sessionId = await this.startEmergencySession(trigger);
    if (sessionId) {
      await this.enableMediaRecording(sessionId);
    }
    return sessionId;
  }

  static async enableMediaRecording(sessionId: string): Promise<void> {
    try {
      if (this.activeSession?.id === sessionId) {
        this.activeSession.mediaRecordingEnabled = true;
        await StorageService.saveEmergencySession(this.activeSession);
        
        // Start media capture based on settings
        const settings = await StorageService.getUserSettings();
        if (settings.autoPhotoCapture) {
          this.startPhotoCapture(sessionId);
        }
        if (settings.autoVideoRecording) {
          this.startVideoRecording(sessionId);
        }
      }
    } catch (error) {
      console.error('Error enabling media recording:', error);
    }
  }

  private static async startPhotoCapture(sessionId: string): Promise<void> {
    // Implementation would depend on camera integration
    console.log('Starting photo capture for session:', sessionId);
  }

  private static async startVideoRecording(sessionId: string): Promise<void> {
    // Implementation would depend on camera integration
    console.log('Starting video recording for session:', sessionId);
  }

  static async endEmergencySession(sessionId: string): Promise<void> {
    try {
      if (this.activeSession?.id === sessionId) {
        this.activeSession.isActive = false;
        this.activeSession.endTime = new Date().toISOString();
        
        await StorageService.saveEmergencySession(this.activeSession);
        
        LocationService.stopLocationTracking();
        this.activeSession = null;
        this.locationCallback = null;
      }
    } catch (error) {
      console.error('Error ending emergency session:', error);
    }
  }

  static async addLocationToSession(sessionId: string, location: LocationData): Promise<void> {
    try {
      if (this.activeSession?.id === sessionId) {
        this.activeSession.locations.push(location);
        await StorageService.saveEmergencySession(this.activeSession);
      }
    } catch (error) {
      console.error('Error adding location to session:', error);
    }
  }

  static async addPhotoToSession(sessionId: string, photoUri: string): Promise<void> {
    try {
      if (this.activeSession?.id === sessionId) {
        this.activeSession.photos.push(photoUri);
        await StorageService.saveEmergencySession(this.activeSession);
      }
    } catch (error) {
      console.error('Error adding photo to session:', error);
    }
  }

  static async addVideoToSession(sessionId: string, videoUri: string): Promise<void> {
    try {
      if (this.activeSession?.id === sessionId) {
        this.activeSession.videos.push(videoUri);
        await StorageService.saveEmergencySession(this.activeSession);
      }
    } catch (error) {
      console.error('Error adding video to session:', error);
    }
  }

  static getActiveSession(): EmergencySession | null {
    return this.activeSession;
  }

  private static generateAccessCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private static async notifyEmergencyContacts(sessionId: string): Promise<void> {
    try {
      const contacts = await StorageService.getEmergencyContacts();
      const session = this.activeSession;
      
      if (!session || contacts.length === 0) {
        return;
      }

      // Get current location for WhatsApp message
      const currentLocation = session.locations[session.locations.length - 1];
      const location = currentLocation ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      } : undefined;

      // Send WhatsApp messages with access code
      await WhatsAppService.sendEmergencyMessage(contacts, session, location);
      
      session.contactsNotified = contacts.map(c => c.id);
      await StorageService.saveEmergencySession(session);
    } catch (error) {
      console.error('Error notifying emergency contacts:', error);
    }
  }

  static async checkForEmergencyKeyword(text: string): Promise<boolean> {
    try {
      const settings = await StorageService.getUserSettings();
      const keyword = settings.voiceCommand.toLowerCase();
      const textLower = text.toLowerCase();
      
      return textLower.includes(keyword);
    } catch (error) {
      console.error('Error checking emergency keyword:', error);
      return false;
    }
  }

  static async triggerHapticFeedback(): Promise<void> {
    if (Platform.OS !== 'web') {
      try {
        const { Haptics } = await import('expo-haptics');
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (error) {
        console.error('Error triggering haptic feedback:', error);
      }
    }
  }
}
