import { Platform } from 'react-native';
import { LocationData, SpeedDetectionData, UserSettings } from '../types';
import { LocationService } from './LocationService';
import { StorageService } from './StorageService';

export class SpeedDetectionService {
  private static isMonitoring = false;
  private static lastLocation: LocationData | null = null;
  private static speedCallback: ((data: SpeedDetectionData) => void) | null = null;

  static async startSpeedMonitoring(callback: (data: SpeedDetectionData) => void): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('Speed detection not available on web platform');
      return false;
    }

    try {
      const settings = await StorageService.getUserSettings();
      if (!settings.speedDetectionEnabled) {
        return false;
      }

      this.isMonitoring = true;
      this.speedCallback = callback;

      // Start location tracking for speed calculation
      await LocationService.startLocationTracking(this.handleLocationUpdate);
      
      return true;
    } catch (error) {
      console.error('Error starting speed monitoring:', error);
      return false;
    }
  }

  static stopSpeedMonitoring(): void {
    this.isMonitoring = false;
    this.speedCallback = null;
    this.lastLocation = null;
    LocationService.stopLocationTracking();
  }

  private static handleLocationUpdate = async (location: LocationData): Promise<void> => {
    if (!this.isMonitoring || !this.speedCallback) return;

    try {
      const settings = await StorageService.getUserSettings();
      
      if (this.lastLocation) {
        const speed = this.calculateSpeed(this.lastLocation, location);
        const isAboveThreshold = speed > settings.speedThreshold;

        const speedData: SpeedDetectionData = {
          speed,
          timestamp: location.timestamp,
          location,
          isAboveThreshold,
        };

        // Save speed data
        const existingData = await StorageService.getSpeedDetectionData();
        existingData.push(speedData);
        await StorageService.saveSpeedDetectionData(existingData);

        // Trigger callback
        this.speedCallback(speedData);
      }

      this.lastLocation = location;
    } catch (error) {
      console.error('Error handling location update for speed detection:', error);
    }
  };

  private static calculateSpeed(location1: LocationData, location2: LocationData): number {
    const time1 = new Date(location1.timestamp).getTime();
    const time2 = new Date(location2.timestamp).getTime();
    const timeDiff = (time2 - time1) / 1000; // seconds

    if (timeDiff <= 0) return 0;

    const distance = this.calculateDistance(
      location1.latitude,
      location1.longitude,
      location2.latitude,
      location2.longitude
    );

    // Convert m/s to km/h
    const speedMps = distance / timeDiff;
    return speedMps * 3.6;
  }

  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static async getRecentSpeedData(hours: number = 24): Promise<SpeedDetectionData[]> {
    try {
      const allData = await StorageService.getSpeedDetectionData();
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - hours);

      return allData.filter(data => new Date(data.timestamp) > cutoffTime);
    } catch (error) {
      console.error('Error getting recent speed data:', error);
      return [];
    }
  }
}
