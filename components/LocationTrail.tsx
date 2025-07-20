import React from 'react';
import { View, Text, StyleSheet, FlatList, Platform } from 'react-native';
import { MapPin, Clock } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { CommonStyles } from '../constants/Styles';
import { LocationData } from '../types';

interface LocationTrailProps {
  locations: LocationData[];
  title?: string;
}

export function LocationTrail({ locations, title = 'Location Trail' }: LocationTrailProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCoordinates = (lat: number, lng: number) => {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const renderLocationItem = ({ item, index }: { item: LocationData; index: number }) => (
    <View style={styles.locationItem}>
      <View style={styles.timeline}>
        <View style={[styles.timelineDot, index === 0 && styles.firstDot]} />
        {index < locations.length - 1 && <View style={styles.timelineLine} />}
      </View>
      
      <View style={styles.locationContent}>
        <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
          <View style={CommonStyles.row}>
            <MapPin size={16} color={Colors.primary} />
            <Text style={styles.locationAddress}>
              {item.address || 'Unknown location'}
            </Text>
          </View>
          
          <View style={CommonStyles.row}>
            <Clock size={14} color={Colors.text.tertiary} />
            <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
        
        <Text style={styles.coordinates}>
          {formatCoordinates(item.latitude, item.longitude)}
        </Text>
        
        {item.accuracy && (
          <Text style={styles.accuracy}>
            Accuracy: {Math.round(item.accuracy)}m
          </Text>
        )}
      </View>
    </View>
  );

  if (locations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <MapPin size={48} color={Colors.text.tertiary} />
        <Text style={styles.emptyText}>No location data available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={CommonStyles.subheader}>{title}</Text>
      <Text style={styles.count}>{locations.length} location points</Text>
      
      <FlatList
        data={locations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  count: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 16,
  },
  
  list: {
    flex: 1,
  },
  
  locationItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  
  timeline: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginBottom: 4,
  },
  
  firstDot: {
    backgroundColor: Colors.success,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border.light,
  },
  
  locationContent: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    padding: 12,
  },
  
  locationAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginLeft: 8,
    flex: 1,
  },
  
  timestamp: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginLeft: 4,
  },
  
  coordinates: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  
  accuracy: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 2,
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  
  emptyText: {
    fontSize: 16,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: 16,
  },
});
