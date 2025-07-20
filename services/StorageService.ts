import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmergencyContact, EmergencySession, UserProfile, UserSettings, VaultEntry, SpeedDetectionData, WhatsAppMessage } from '../types';

const STORAGE_KEYS = {
  USER_PROFILE: 'user_profile',
  EMERGENCY_CONTACTS: 'emergency_contacts',
  EMERGENCY_SESSIONS: 'emergency_sessions',
  USER_SETTINGS: 'user_settings',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  PRIVATE_VAULT: 'private_vault_entries',
  SHARED_VAULT: 'shared_vault_entries',
  SPEED_DETECTION_DATA: 'speed_detection_data',
  WHATSAPP_MESSAGES: 'whatsapp_messages',
  THEME: 'app_theme',
  LANGUAGE: 'app_language',
  PRIVATE_ACCESS_CODE: 'private_access_code',
};

export class StorageService {
  // User Profile
  static async getUserProfile(): Promise<UserProfile | null> {
    try {
      const profile = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  static async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // Emergency Contacts
  static async getEmergencyContacts(): Promise<EmergencyContact[]> {
    try {
      const contacts = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_CONTACTS);
      return contacts ? JSON.parse(contacts) : [];
    } catch (error) {
      console.error('Error getting emergency contacts:', error);
      return [];
    }
  }

  static async saveEmergencyContacts(contacts: EmergencyContact[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_CONTACTS, JSON.stringify(contacts));
    } catch (error) {
      console.error('Error saving emergency contacts:', error);
    }
  }

  // Emergency Sessions
  static async getEmergencySessions(): Promise<EmergencySession[]> {
    try {
      const sessions = await AsyncStorage.getItem(STORAGE_KEYS.EMERGENCY_SESSIONS);
      return sessions ? JSON.parse(sessions) : [];
    } catch (error) {
      console.error('Error getting emergency sessions:', error);
      return [];
    }
  }

  static async saveEmergencySession(session: EmergencySession): Promise<void> {
    try {
      const sessions = await this.getEmergencySessions();
      const existingIndex = sessions.findIndex(s => s.id === session.id);
      
      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_SESSIONS, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving emergency session:', error);
    }
  }

  // User Settings
  static async getUserSettings(): Promise<UserSettings> {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      return settings ? JSON.parse(settings) : {
        voiceCommandEnabled: true,
        voiceCommand: 'emergency help',
        autoPhotoCapture: true,
        autoVideoRecording: false,
        locationSharingEnabled: true,
        dataRetentionDays: 7,
        emergencyMode: false,
        locationTrackingMode: 'manual',
        speedDetectionEnabled: true,
        speedThreshold: 50, // km/h
        whatsappIntegrationEnabled: true,
      };
    } catch (error) {
      console.error('Error getting user settings:', error);
      return {
        voiceCommandEnabled: true,
        voiceCommand: 'emergency help',
        autoPhotoCapture: true,
        autoVideoRecording: false,
        locationSharingEnabled: true,
        dataRetentionDays: 7,
        emergencyMode: false,
        locationTrackingMode: 'manual',
        speedDetectionEnabled: true,
        speedThreshold: 50,
        whatsappIntegrationEnabled: true,
      };
    }
  }

  static async saveUserSettings(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving user settings:', error);
    }
  }

  // Private Vault
  static async getPrivateVaultEntries(): Promise<VaultEntry[]> {
    try {
      const entries = await AsyncStorage.getItem(STORAGE_KEYS.PRIVATE_VAULT);
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.error('Error getting private vault entries:', error);
      return [];
    }
  }

  static async savePrivateVaultEntries(entries: VaultEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVATE_VAULT, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving private vault entries:', error);
    }
  }

  // Shared Vault
  static async getSharedVaultEntries(): Promise<VaultEntry[]> {
    try {
      const entries = await AsyncStorage.getItem(STORAGE_KEYS.SHARED_VAULT);
      return entries ? JSON.parse(entries) : [];
    } catch (error) {
      console.error('Error getting shared vault entries:', error);
      return [];
    }
  }

  static async saveSharedVaultEntries(entries: VaultEntry[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SHARED_VAULT, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving shared vault entries:', error);
    }
  }

  // Private Access Code
  static async getPrivateAccessCode(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PRIVATE_ACCESS_CODE);
    } catch (error) {
      console.error('Error getting private access code:', error);
      return null;
    }
  }

  static async savePrivateAccessCode(code: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVATE_ACCESS_CODE, code);
    } catch (error) {
      console.error('Error saving private access code:', error);
    }
  }

  // Speed Detection Data
  static async getSpeedDetectionData(): Promise<SpeedDetectionData[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SPEED_DETECTION_DATA);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting speed detection data:', error);
      return [];
    }
  }

  static async saveSpeedDetectionData(data: SpeedDetectionData[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SPEED_DETECTION_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving speed detection data:', error);
    }
  }

  // WhatsApp Messages
  static async getWhatsAppMessages(): Promise<WhatsAppMessage[]> {
    try {
      const messages = await AsyncStorage.getItem(STORAGE_KEYS.WHATSAPP_MESSAGES);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Error getting WhatsApp messages:', error);
      return [];
    }
  }

  static async saveWhatsAppMessage(message: WhatsAppMessage): Promise<void> {
    try {
      const messages = await this.getWhatsAppMessages();
      messages.push(message);
      await AsyncStorage.setItem(STORAGE_KEYS.WHATSAPP_MESSAGES, JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving WhatsApp message:', error);
    }
  }

  // Theme
  static async getTheme(): Promise<'light' | 'dark' | 'system'> {
    try {
      const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      return theme as 'light' | 'dark' | 'system' || 'system';
    } catch (error) {
      console.error('Error getting theme:', error);
      return 'system';
    }
  }

  static async saveTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  }

  // Language
  static async getLanguage(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.LANGUAGE);
    } catch (error) {
      console.error('Error getting language:', error);
      return null;
    }
  }

  static async saveLanguage(language: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }

  // Onboarding
  static async isOnboardingCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      return false;
    }
  }

  static async setOnboardingCompleted(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
    }
  }

  // Data Cleanup
  static async cleanupOldData(): Promise<void> {
    try {
      const settings = await this.getUserSettings();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - settings.dataRetentionDays);

      // Clean up emergency sessions
      const sessions = await this.getEmergencySessions();
      const filteredSessions = sessions.filter(session => {
        const sessionDate = new Date(session.startTime);
        return sessionDate > cutoffDate;
      });

      if (filteredSessions.length !== sessions.length) {
        await AsyncStorage.setItem(STORAGE_KEYS.EMERGENCY_SESSIONS, JSON.stringify(filteredSessions));
      }

      // Clean up private vault entries (non-flagged)
      const privateEntries = await this.getPrivateVaultEntries();
      const filteredPrivateEntries = privateEntries.filter(entry => {
        if (entry.flagged) return true;
        if (!entry.expiresAt) return true;
        return new Date(entry.expiresAt) > new Date();
      });

      if (filteredPrivateEntries.length !== privateEntries.length) {
        await this.savePrivateVaultEntries(filteredPrivateEntries);
      }

      // Clean up shared vault entries (30 days)
      const sharedEntries = await this.getSharedVaultEntries();
      const filteredSharedEntries = sharedEntries.filter(entry => {
        if (!entry.expiresAt) return true;
        return new Date(entry.expiresAt) > new Date();
      });

      if (filteredSharedEntries.length !== sharedEntries.length) {
        await this.saveSharedVaultEntries(filteredSharedEntries);
      }

      // Clean up speed detection data
      const speedData = await this.getSpeedDetectionData();
      const filteredSpeedData = speedData.filter(data => {
        const dataDate = new Date(data.timestamp);
        return dataDate > cutoffDate;
      });

      if (filteredSpeedData.length !== speedData.length) {
        await this.saveSpeedDetectionData(filteredSpeedData);
      }

    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }
}
