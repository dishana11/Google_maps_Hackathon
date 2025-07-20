import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Zap, MapPin, X, Play } from 'lucide-react-native';
import { CommonStyles } from '../constants/Styles';

interface SpeedDetectionAlertProps {
  visible: boolean;
  speed: number;
  onStartLocationTracking: () => void;
  onStartFullRecording: () => void;
  onDismiss: () => void;
  colors: any;
}

export function SpeedDetectionAlert({
  visible,
  speed,
  onStartLocationTracking,
  onStartFullRecording,
  onDismiss,
  colors,
}: SpeedDetectionAlertProps) {
  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
            <X size={24} color={colors.text.secondary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Zap size={48} color={colors.warning} />
          </View>

          <Text style={styles.title}>High Speed Detected</Text>
          <Text style={styles.subtitle}>
            You're moving at {Math.round(speed)} km/h
          </Text>
          <Text style={styles.description}>
            Would you like to start location tracking for your safety?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.optionButton, styles.locationButton]}
              onPress={onStartLocationTracking}
            >
              <MapPin size={20} color={colors.text.inverse} />
              <Text style={styles.optionButtonText}>Track Location Only</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, styles.fullButton]}
              onPress={onStartFullRecording}
            >
              <Play size={20} color={colors.text.inverse} />
              <Text style={styles.optionButtonText}>Location + Recording</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissButtonText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  alertContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 8,
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warningLight + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
    textAlign: 'center',
    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },

  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },

  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },

  locationButton: {
    backgroundColor: colors.primary,
  },

  fullButton: {
    backgroundColor: colors.danger,
  },

  optionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.inverse,
  },

  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },

  dismissButtonText: {
    fontSize: 14,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
});
