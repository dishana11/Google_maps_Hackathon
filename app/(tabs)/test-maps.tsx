import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Search, Navigation, Zap, CircleCheck as CheckCircle, Circle as XCircle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { LocationService } from '../../services/LocationService';
import { LocationData } from '../../types';

// Test coordinates for different cities
const TEST_LOCATIONS = [
  { name: 'New York City', lat: 40.7128, lng: -74.0060 },
  { name: 'London', lat: 51.5074, lng: -0.1278 },
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
];

interface TestResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function TestMapsScreen() {
  const { colors } = useTheme();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [searchAddress, setSearchAddress] = useState('');
  const [geocodeResult, setGeocodeResult] = useState<string>('');
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    // Load Google Maps script
    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('Google Maps script loaded successfully');
        initializeMap();
      };
      script.onerror = () => {
        console.error('Failed to load Google Maps script');
        addTestResult('Google Maps Script', 'error', 'Failed to load Google Maps JavaScript API');
      };
      document.head.appendChild(script);
    } else if (window.google) {
      initializeMap();
    }
  };

  const initializeMap = () => {
    if (mapRef.current && window.google) {
      try {
        googleMapRef.current = new google.maps.Map(mapRef.current, {
          center: { lat: 40.7128, lng: -74.0060 }, // NYC
          zoom: 10,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        });
        addTestResult('Google Maps Initialization', 'success', 'Map initialized successfully');
      } catch (error) {
        addTestResult('Google Maps Initialization', 'error', `Failed to initialize map: ${error}`);
      }
    }
  };

  const addTestResult = (test: string, status: 'success' | 'error', message: string, duration?: number) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.test === test);
      const newResult = { test, status, message, duration };
      
      if (existing) {
        return prev.map(r => r.test === test ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);

    // Test 1: API Key Validation
    await testApiKeyValidation();
    
    // Test 2: Current Location
    await testCurrentLocation();
    
    // Test 3: Geocoding API
    await testGeocodingAPI();
    
    // Test 4: Reverse Geocoding
    await testReverseGeocoding();
    
    // Test 5: Map Functionality
    await testMapFunctionality();

    setIsRunningTests(false);
  };

  const testApiKeyValidation = async () => {
    const startTime = Date.now();
    addTestResult('API Key Validation', 'pending', 'Testing API key...');

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=New+York&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.status === 'OK') {
        addTestResult('API Key Validation', 'success', 'API key is valid and working', duration);
      } else if (data.status === 'REQUEST_DENIED') {
        addTestResult('API Key Validation', 'error', `API key denied: ${data.error_message || 'Check restrictions'}`);
      } else {
        addTestResult('API Key Validation', 'error', `API error: ${data.status}`);
      }
    } catch (error) {
      addTestResult('API Key Validation', 'error', `Network error: ${error}`);
    }
  };

  const testCurrentLocation = async () => {
    const startTime = Date.now();
    addTestResult('Current Location', 'pending', 'Getting current location...');

    try {
      const location = await LocationService.getCurrentLocation();
      const duration = Date.now() - startTime;

      if (location) {
        setCurrentLocation(location);
        addTestResult('Current Location', 'success', `Location: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`, duration);
        
        // Add marker to map if available
        if (googleMapRef.current) {
          new google.maps.Marker({
            position: { lat: location.latitude, lng: location.longitude },
            map: googleMapRef.current,
            title: 'Current Location',
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="8" fill="#3B82F6" stroke="#ffffff" stroke-width="2"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
            },
          });
          
          googleMapRef.current.setCenter({ lat: location.latitude, lng: location.longitude });
          googleMapRef.current.setZoom(15);
        }
      } else {
        addTestResult('Current Location', 'error', 'Failed to get current location');
      }
    } catch (error) {
      addTestResult('Current Location', 'error', `Location error: ${error}`);
    }
  };

  const testGeocodingAPI = async () => {
    const startTime = Date.now();
    addTestResult('Geocoding API', 'pending', 'Testing address to coordinates...');

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=Times+Square,+New+York&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        addTestResult('Geocoding API', 'success', `Times Square: ${lat.toFixed(4)}, ${lng.toFixed(4)}`, duration);
      } else {
        addTestResult('Geocoding API', 'error', `Geocoding failed: ${data.status}`);
      }
    } catch (error) {
      addTestResult('Geocoding API', 'error', `Geocoding error: ${error}`);
    }
  };

  const testReverseGeocoding = async () => {
    const startTime = Date.now();
    addTestResult('Reverse Geocoding', 'pending', 'Testing coordinates to address...');

    try {
      // Use Statue of Liberty coordinates
      const lat = 40.6892;
      const lng = -74.0445;
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      const duration = Date.now() - startTime;

      if (data.status === 'OK' && data.results.length > 0) {
        const address = data.results[0].formatted_address;
        addTestResult('Reverse Geocoding', 'success', `Address: ${address.substring(0, 50)}...`, duration);
      } else {
        addTestResult('Reverse Geocoding', 'error', `Reverse geocoding failed: ${data.status}`);
      }
    } catch (error) {
      addTestResult('Reverse Geocoding', 'error', `Reverse geocoding error: ${error}`);
    }
  };

  const testMapFunctionality = async () => {
    const startTime = Date.now();
    addTestResult('Map Functionality', 'pending', 'Testing map features...');

    try {
      if (!googleMapRef.current) {
        addTestResult('Map Functionality', 'error', 'Map not initialized');
        return;
      }

      // Add test markers for different cities
      TEST_LOCATIONS.forEach((location, index) => {
        new google.maps.Marker({
          position: { lat: location.lat, lng: location.lng },
          map: googleMapRef.current!,
          title: location.name,
          label: (index + 1).toString(),
        });
      });

      // Test map controls
      googleMapRef.current.setZoom(2);
      googleMapRef.current.setCenter({ lat: 20, lng: 0 });

      const duration = Date.now() - startTime;
      addTestResult('Map Functionality', 'success', `Added ${TEST_LOCATIONS.length} test markers`, duration);
    } catch (error) {
      addTestResult('Map Functionality', 'error', `Map functionality error: ${error}`);
    }
  };

  const testCustomGeocode = async () => {
    if (!searchAddress.trim()) {
      Alert.alert('Error', 'Please enter an address to search');
      return;
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchAddress)}&key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lng } = result.geometry.location;
        const address = result.formatted_address;
        
        setGeocodeResult(`Address: ${address}\nCoordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        
        // Add marker and center map
        if (googleMapRef.current) {
          new google.maps.Marker({
            position: { lat, lng },
            map: googleMapRef.current,
            title: address,
            icon: {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" fill="#EF4444" stroke="#ffffff" stroke-width="2"/>
                  <circle cx="12" cy="10" r="3" fill="#ffffff"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
            },
          });
          
          googleMapRef.current.setCenter({ lat, lng });
          googleMapRef.current.setZoom(15);
        }
      } else {
        setGeocodeResult(`Geocoding failed: ${data.status}\n${data.error_message || ''}`);
      }
    } catch (error) {
      setGeocodeResult(`Error: ${error}`);
    }
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle size={20} color={colors.success} />;
      case 'error':
        return <XCircle size={20} color={colors.danger} />;
      case 'pending':
        return <RefreshCw size={20} color={colors.warning} />;
    }
  };

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[CommonStyles.header, { color: colors.text.primary }]}>
            Google Maps API Test
          </Text>
          <Text style={[CommonStyles.body, { color: colors.text.secondary }]}>
            Test your Google Maps integration and API key restrictions
          </Text>
        </View>

        {/* API Key Info */}
        <View style={[styles.infoCard, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '40' }]}>
          <MapPin size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.primary }]}>API Key Status</Text>
            <Text style={[styles.infoText, { color: colors.primary }]}>
              Testing with key: {process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ? 
                `...${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY.slice(-8)}` : 
                'Not configured'
              }
            </Text>
          </View>
        </View>

        {/* Test Controls */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.testButton, { backgroundColor: colors.primary }]}
            onPress={runAllTests}
            disabled={isRunningTests}
          >
            <Zap size={20} color={colors.text.inverse} />
            <Text style={[styles.testButtonText, { color: colors.text.inverse }]}>
              {isRunningTests ? 'Running Tests...' : 'Run All Tests'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Test Results */}
        {testResults.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Test Results</Text>
            {testResults.map((result, index) => (
              <View key={index} style={[styles.testResult, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
                <View style={styles.testResultHeader}>
                  {getStatusIcon(result.status)}
                  <Text style={[styles.testName, { color: colors.text.primary }]}>{result.test}</Text>
                  {result.duration && (
                    <Text style={[styles.testDuration, { color: colors.text.tertiary }]}>
                      {result.duration}ms
                    </Text>
                  )}
                </View>
                <Text style={[styles.testMessage, { color: colors.text.secondary }]}>
                  {result.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Interactive Map */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Interactive Map</Text>
          <View style={[styles.mapContainer, { borderColor: colors.border.light }]}>
            <div
              ref={mapRef}
              style={{
                width: '100%',
                height: '300px',
                borderRadius: '8px',
                backgroundColor: colors.background.secondary,
              }}
            />
          </View>
        </View>

        {/* Custom Geocoding Test */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Custom Address Search</Text>
          <View style={styles.searchContainer}>
            <TextInput
              style={[CommonStyles.input, styles.searchInput, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
              value={searchAddress}
              onChangeText={setSearchAddress}
              placeholder="Enter address to geocode..."
              placeholderTextColor={colors.text.tertiary}
            />
            <TouchableOpacity
              style={[styles.searchButton, { backgroundColor: colors.secondary }]}
              onPress={testCustomGeocode}
            >
              <Search size={20} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
          
          {geocodeResult && (
            <View style={[styles.resultCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
              <Text style={[styles.resultText, { color: colors.text.primary }]}>{geocodeResult}</Text>
            </View>
          )}
        </View>

        {/* Current Location Display */}
        {currentLocation && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Current Location</Text>
            <View style={[styles.locationCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
              <Navigation size={20} color={colors.success} />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationCoords, { color: colors.text.primary }]}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                {currentLocation.address && (
                  <Text style={[styles.locationAddress, { color: colors.text.secondary }]}>
                    {currentLocation.address}
                  </Text>
                )}
                {currentLocation.accuracy && (
                  <Text style={[styles.locationAccuracy, { color: colors.text.tertiary }]}>
                    Accuracy: {Math.round(currentLocation.accuracy)}m
                  </Text>
                )}
              </View>
            </View>
          </View>
        )}

        {/* Test Locations */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Test Locations</Text>
          {TEST_LOCATIONS.map((location, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.testLocationCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}
              onPress={() => {
                if (googleMapRef.current) {
                  googleMapRef.current.setCenter({ lat: location.lat, lng: location.lng });
                  googleMapRef.current.setZoom(12);
                }
              }}
            >
              <MapPin size={16} color={colors.primary} />
              <Text style={[styles.testLocationName, { color: colors.text.primary }]}>{location.name}</Text>
              <Text style={[styles.testLocationCoords, { color: colors.text.tertiary }]}>
                {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  header: {
    marginBottom: 24,
  },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },

  infoContent: {
    flex: 1,
    marginLeft: 12,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },

  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  testResult: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },

  testResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  testName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },

  testDuration: {
    fontSize: 12,
    fontWeight: '500',
  },

  testMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 32,
  },

  mapContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },

  searchContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  searchInput: {
    flex: 1,
  },

  searchButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  resultCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  resultText: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'monospace',
  },

  locationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  locationCoords: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: 4,
  },

  locationAddress: {
    fontSize: 14,
    marginBottom: 4,
  },

  locationAccuracy: {
    fontSize: 12,
  },

  testLocationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },

  testLocationName: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },

  testLocationCoords: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});
