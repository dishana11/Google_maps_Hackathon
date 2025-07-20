import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationData } from '../types';
import { useTheme } from '../contexts/ThemeContext';

interface MapViewComponentProps {
  locations: LocationData[];
  currentLocation?: LocationData;
  showTrail?: boolean;
  style?: any;
  onMapPress?: (coordinate: { latitude: number; longitude: number }) => void;
}

export function MapViewComponent({
  locations,
  currentLocation,
  showTrail = true,
  style,
  onMapPress,
}: MapViewComponentProps) {
  const { colors, colorScheme } = useTheme();
  const mapRef = useRef<MapView>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    if (locations.length > 0 && mapRef.current) {
      // Fit map to show all locations
      const coordinates = locations.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
      }));

      if (currentLocation) {
        coordinates.push({
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      }

      if (coordinates.length > 1) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else if (coordinates.length === 1) {
        mapRef.current.animateToRegion({
          ...coordinates[0],
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  }, [locations, currentLocation]);

  const mapStyle = colorScheme === 'dark' ? darkMapStyle : [];

  const initialRegion = currentLocation || locations[0] ? {
    latitude: currentLocation?.latitude || locations[0]?.latitude || 37.78825,
    longitude: currentLocation?.longitude || locations[0]?.longitude || -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        customMapStyle={mapStyle}
        onPress={onMapPress ? (event) => onMapPress(event.nativeEvent.coordinate) : undefined}
        showsUserLocation={true}
        showsMyLocationButton={true}
        showsCompass={true}
        showsScale={true}
        toolbarEnabled={false}
      >
        {/* Current Location Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Current Location"
            description={currentLocation.address || 'Your current position'}
            pinColor={colors.primary}
          />
        )}

        {/* Location Trail Markers */}
        {locations.map((location, index) => (
          <Marker
            key={location.id}
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={`Location ${index + 1}`}
            description={location.address || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
            pinColor={index === 0 ? colors.success : colors.secondary}
          />
        ))}

        {/* Trail Polyline */}
        {showTrail && locations.length > 1 && (
          <Polyline
            coordinates={locations.map(loc => ({
              latitude: loc.latitude,
              longitude: loc.longitude,
            }))}
            strokeColor={colors.primary}
            strokeWidth={3}
            strokePattern={[1]}
          />
        )}
      </MapView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  map: {
    flex: 1,
  },
});

// Dark mode map style
const darkMapStyle = [
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
];
