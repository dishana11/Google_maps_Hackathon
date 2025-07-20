import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { EmergencyService } from '../services/EmergencyService';
import i18n from '../localization/i18n';

interface EmergencyButtonProps {
  onEmergencyTriggered: (sessionId: string) => void;
  disabled?: boolean;
  colors: any;
}

export function EmergencyButton({ onEmergencyTriggered, disabled = false, colors }: EmergencyButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scaleAnim = new Animated.Value(1);

  const styles = createStyles(colors);

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = async () => {
    if (disabled || isLoading) return;

    setIsLoading(true);
    await EmergencyService.triggerHapticFeedback();

    try {
      const sessionId = await EmergencyService.startEmergencySession('manual');
      if (sessionId) {
        onEmergencyTriggered(sessionId);
      }
    } catch (error) {
      console.error('Error triggering emergency:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonContainer, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          style={[
            styles.button,
            isPressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
          ]}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || isLoading}
          activeOpacity={0.8}
        >
          <View style={styles.innerRing}>
            <AlertTriangle 
              size={48} 
              color={colors.text.inverse} 
              strokeWidth={3}
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={styles.label}>
        {isLoading ? i18n.t('emergency.activating') : i18n.t('emergency.emergencySOS')}
      </Text>
      
      <Text style={styles.instruction}>
        {i18n.t('emergency.instruction')}
      </Text>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  buttonContainer: {
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  
  button: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 6,
    borderColor: colors.dangerLight,
  },
  
  buttonPressed: {
    backgroundColor: colors.dangerDark,
    borderColor: colors.danger,
  },
  
  buttonDisabled: {
    backgroundColor: colors.border.medium,
    borderColor: colors.border.light,
  },
  
  innerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  label: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 24,
    textAlign: 'center',
  },
  
  instruction: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
