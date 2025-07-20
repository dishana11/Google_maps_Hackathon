export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
  whatsappNumber?: string;
  createdAt: string;
}

export interface LocationData {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  address?: string;
}

export interface EmergencySession {
  id: string;
  startTime: string;
  endTime?: string;
  locations: LocationData[];
  photos: string[];
  videos: string[];
  voiceNotes: string[];
  isActive: boolean;
  trigger: 'manual' | 'voice' | 'auto' | 'speed';
  contactsNotified: string[];
  mediaRecordingEnabled: boolean;
  whatsappMessagesSent: string[];
  emergencyAccessCode?: string;
}

export interface VaultEntry {
  id: string;
  type: 'text' | 'photo' | 'voice';
  title: string;
  content: string;
  description?: string;
  flagged: boolean;
  isPrivate: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface UserSettings {
  voiceCommandEnabled: boolean;
  voiceCommand: string;
  autoPhotoCapture: boolean;
  autoVideoRecording: boolean;
  locationSharingEnabled: boolean;
  dataRetentionDays: number;
  emergencyMode: boolean;
  locationTrackingMode?: 'always' | 'manual' | 'voice';
  speedDetectionEnabled?: boolean;
  speedThreshold?: number; // km/h
  whatsappIntegrationEnabled?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  emergencyContacts: EmergencyContact[];
  settings: UserSettings;
  createdAt: string;
}

export interface SpeedDetectionData {
  speed: number; // km/h
  timestamp: string;
  location: LocationData;
  isAboveThreshold: boolean;
}

export interface WhatsAppMessage {
  id: string;
  contactId: string;
  message: string;
  mediaUrls: string[];
  sentAt: string;
  status: 'pending' | 'sent' | 'failed';
}
