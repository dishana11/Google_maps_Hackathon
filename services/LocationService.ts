import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { LocationData } from '../types';

// Google Maps Geocoding API integration
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export class LocationService {
  private static watchId: Location.LocationSubscription | null = null;

  static async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions first
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        console.warn('Foreground location permission not granted');
        return false;
      }

      // For native platforms, also request background permissions for continuous tracking
      if (Platform.OS !== 'web') {
        try {
          const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
          if (backgroundStatus !== 'granted') {
            console.warn('Background location permission not granted, but foreground is available');
            // Still return true as foreground permission is sufficient for basic functionality
          }
        } catch (backgroundError) {
          console.warn('Background location permission request failed:', backgroundError);
          // Continue with foreground permissions only
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Location permissions not available');
        return null;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        console.warn('Location services are not enabled');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeoutMs: 15000, // 15 second timeout
        maximumAge: 10000, // Accept cached location up to 10 seconds old
      });

      let address: string | undefined;
      try {
        // Try Google Maps Geocoding API first for better accuracy
        if (GOOGLE_MAPS_API_KEY) {
          address = await this.getAddressFromGoogle(location.coords.latitude, location.coords.longitude);
        }
        
        // Fallback to Expo's geocoding if Google fails or no API key
        if (!address) {
          const addressResult = await Location.reverseGeocodeAsync({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          address = addressResult[0] ? `${addressResult[0].street}, ${addressResult[0].city}` : undefined;
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
        // Continue without address
      }

      return {
        id: Date.now().toString(),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
        accuracy: location.coords.accuracy || undefined,
        address,
      };
    } catch (error) {
      // Check if this is a user-denied geolocation error
      if (error instanceof Error && error.message.includes('User denied Geolocation')) {
        console.warn('Location access denied by user.');
      } else {
        console.error('Error getting current location:', error);
      }
      return null;
    }
  }

  static async startLocationTracking(callback: (location: LocationData) => void): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('Location permissions not available for tracking');
        return false;
      }

      // Check if location services are enabled
      const isEnabled = await Location.hasServicesEnabledAsync();
      if (!isEnabled) {
        console.warn('Location services are not enabled for tracking');
        return false;
      }

      this.watchId = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // 10 seconds
          distanceInterval: 10, // 10 meters
        },
        async (location) => {
          let address: string | undefined;
          try {
            // Try Google Maps Geocoding API first
            if (GOOGLE_MAPS_API_KEY) {
              address = await this.getAddressFromGoogle(location.coords.latitude, location.coords.longitude);
            }
            
            // Fallback to Expo's geocoding
            if (!address) {
              const addressResult = await Location.reverseGeocodeAsync({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              });
              address = addressResult[0] ? `${addressResult[0].street}, ${addressResult[0].city}` : undefined;
            }
          } catch (geocodeError) {
            console.warn('Geocoding failed during tracking:', geocodeError);
            // Continue without address
          }

          const locationData: LocationData = {
            id: Date.now().toString(),
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: new Date().toISOString(),
            accuracy: location.coords.accuracy || undefined,
            address,
          };

          callback(locationData);
        }
      );

      return true;
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return false;
    }
  }

  static stopLocationTracking(): void {
    if (this.watchId) {
      this.watchId.remove();
      this.watchId = null;
    }
  }

  static async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      // Try Google Maps Geocoding API first
      if (GOOGLE_MAPS_API_KEY) {
        const googleAddress = await this.getAddressFromGoogle(latitude, longitude);
        if (googleAddress) return googleAddress;
      }
      
      // Fallback to Expo's geocoding
      const address = await Location.reverseGeocodeAsync({ latitude, longitude });
      return address[0] ? `${address[0].street}, ${address[0].city}` : 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  }

  private static async getAddressFromGoogle(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0].formatted_address;
      }
      
      return null;
    } catch (error) {
      console.warn('Google Geocoding API error:', error);
      return null;
    }
  }

  static async checkLocationServicesEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location services:', error);
      return false;
    }
  }
}
