import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Navigation, Clock, RefreshCw, Map } from 'lucide-react-native';
import { MapViewComponent } from '../../components/MapView';
import { Colors } from '../../constants/Colors';
import { CommonStyles } from '../../constants/Styles';
import { LocationService } from '../../services/LocationService';
import { StorageService } from '../../services/StorageService';
import { LocationData, EmergencySession } from '../../types';

export default function LocationScreen() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [emergencySessions, setEmergencySessions] = useState<EmergencySession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<EmergencySession | null>(null);
  const [showMap, setShowMap] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [location, sessions] = await Promise.all([
        LocationService.getCurrentLocation(),
        StorageService.getEmergencySessions(),
      ]);
      
      setCurrentLocation(location);
      setEmergencySessions(sessions.filter(s => s.locations.length > 0));
    } catch (error) {
      console.error('Error loading location data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshLocation = async () => {
    setIsLoading(true);
    try {
      const location = await LocationService.getCurrentLocation();
      setCurrentLocation(location);
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location. Please check your permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const SessionCard = ({ session }: { session: EmergencySession }) => {
    const duration = session.endTime 
      ? new Date(session.endTime).getTime() - new Date(session.startTime).getTime()
      : Date.now() - new Date(session.startTime).getTime();
    
    const durationText = Math.round(duration / (1000 * 60)) + ' minutes';

    return (
      <TouchableOpacity
        style={[styles.sessionCard, selectedSession?.id === session.id && styles.selectedSession]}
        onPress={() => setSelectedSession(selectedSession?.id === session.id ? null : session)}
      >
        <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
          <View>
            <Text style={styles.sessionTitle}>
              {session.isActive ? 'Active Emergency' : 'Emergency Session'}
            </Text>
            <Text style={styles.sessionDate}>
              {formatDateTime(session.startTime)}
            </Text>
            <Text style={styles.sessionStats}>
              {session.locations.length} locations • {durationText}
            </Text>
          </View>
          
          <View style={styles.sessionBadge}>
            <Text style={styles.sessionBadgeText}>
              {session.trigger.toUpperCase()}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={CommonStyles.header}>Location Tracking</Text>
          <Text style={CommonStyles.body}>
            View your current location and emergency trails
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Location */}
          <View style={styles.section}>
            <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
              <Text style={styles.sectionTitle}>Current Location</Text>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={handleRefreshLocation}
                disabled={isLoading}
              >
                <RefreshCw 
                  size={20} 
                  color={Colors.primary} 
                  style={isLoading ? { opacity: 0.5 } : {}}
                />
              </TouchableOpacity>
            </View>

            {currentLocation ? (
              <View style={styles.locationCard}>
                <View style={CommonStyles.row}>
                  <MapPin size={20} color={Colors.success} />
                  <Text style={styles.locationAddress}>
                    {currentLocation.address || 'Location found'}
                  </Text>
                </View>
                
                <Text style={styles.coordinates}>
                  {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Text>
                
                <View style={[CommonStyles.row, { marginTop: 8 }]}>
                  <Clock size={14} color={Colors.text.tertiary} />
                  <Text style={styles.timestamp}>
                    Updated: {formatDateTime(currentLocation.timestamp)}
                  </Text>
                </View>
                
                {currentLocation.accuracy && (
                  <Text style={styles.accuracy}>
                    Accuracy: {Math.round(currentLocation.accuracy)}m
                  </Text>
                )}
              </View>
            ) : (
              <View style={styles.locationCard}>
                <Text style={styles.noLocation}>
                  {isLoading ? 'Getting location...' : 'Location not available'}
                </Text>
                <Text style={styles.noLocationSubtext}>
                  Make sure location services are enabled
                </Text>
              </View>
            )}
          </View>

          {/* Emergency Sessions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Sessions</Text>
            <TouchableOpacity
              style={styles.viewToggle}
              onPress={() => setShowMap(!showMap)}
            >
              <Map size={20} color={Colors.primary} />
              <Text style={styles.viewToggleText}>{showMap ? 'List' : 'Map'}</Text>
            </TouchableOpacity>
            
            {emergencySessions.length === 0 ? (
              <View style={styles.noSessions}>
                <Navigation size={48} color={Colors.text.tertiary} />
                <Text style={styles.noSessionsText}>No emergency sessions yet</Text>
                <Text style={styles.noSessionsSubtext}>
                  Location trails will appear here when you activate emergency mode
                </Text>
              </View>
            ) : (
              <View>
                {emergencySessions.map(session => (
                  <SessionCard key={session.id} session={session} />
                ))}
              </View>
            )}
          </View>

          {/* Location Trail */}
          {selectedSession && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Trail for {formatDateTime(selectedSession.startTime)}
              </Text>
              
              {showMap ? (
                <View style={styles.mapContainer}>
                  <MapViewComponent
                    locations={selectedSession.locations}
                    currentLocation={currentLocation}
                    showTrail={true}
                    style={styles.map}
                  />
                </View>
              ) : (
                <ScrollView style={styles.locationsList} showsVerticalScrollIndicator={false}>
                  {selectedSession.locations.map((location, index) => (
                    <View key={location.id} style={styles.locationItem}>
                      <View style={styles.locationHeader}>
                        <MapPin size={16} color={Colors.primary} />
                        <Text style={styles.locationTitle}>Location {index + 1}</Text>
                        <Text style={styles.locationTime}>
                          {new Date(location.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                      <Text style={styles.locationAddress}>
                        {location.address || 'Unknown location'}
                      </Text>
                      <Text style={styles.locationCoords}>
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  section: {
    marginBottom: 32,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },
  
  refreshButton: {
    padding: 4,
  },
  
  locationCard: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  
  coordinates: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  timestamp: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  
  accuracy: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },
  
  noLocation: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  
  noLocationSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  sessionCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: Colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  selectedSession: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '10',
  },
  
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  
  sessionDate: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  
  sessionStats: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  
  sessionBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  sessionBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.text.inverse,
  },
  
  noSessions: {
    alignItems: 'center',
    padding: 40,
  },
  
  noSessionsText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 16,
    textAlign: 'center',
  },
  
  noSessionsSubtext: {
    fontSize: 14,
    color: Colors.text.tertiary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  viewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
  },

  viewToggleText: {
    fontSize: 14,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '600',
  },

  mapContainer: {
    height: 300,
    marginBottom: 16,
  },

  map: {
    height: 300,
  },

  locationsList: {
    maxHeight: 300,
  },

  locationItem: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },

  locationTime: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },

  locationAddress: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 4,
  },

  locationCoords: {
    fontSize: 12,
    color: Colors.text.tertiary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
