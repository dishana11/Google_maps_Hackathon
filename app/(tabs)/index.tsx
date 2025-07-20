import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { EmergencyButton } from '../../components/EmergencyButton';
import { SpeedDetectionAlert } from '../../components/SpeedDetectionAlert';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { EmergencyService } from '../../services/EmergencyService';
import { StorageService } from '../../services/StorageService';
import { SpeedDetectionService } from '../../services/SpeedDetectionService';
import { VoiceRecognitionService } from '../../services/VoiceRecognitionService';
import { EmergencySession, SpeedDetectionData, UserSettings } from '../../types';
import { MapPin, Users, Camera, Clock, CircleCheck as CheckCircle, ExternalLink } from 'lucide-react-native';
import i18n from '../../localization/i18n';

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const [activeSession, setActiveSession] = useState<EmergencySession | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [showSpeedAlert, setShowSpeedAlert] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [showEmergencyConfirmation, setShowEmergencyConfirmation] = useState(false);
  const [emergencyDetails, setEmergencyDetails] = useState<{
    sessionId: string;
    contactsNotified: number;
    locationShared: boolean;
    accessCode: string;
  } | null>(null);

  const styles = createStyles(colors);

  useEffect(() => {
    checkOnboardingStatus();
    loadSettings();
    checkActiveSession();
  }, []);

  useEffect(() => {
    if (settings && isOnboardingComplete) {
      initializeServices();
    }

    return () => {
      // Cleanup services
      SpeedDetectionService.stopSpeedMonitoring();
      VoiceRecognitionService.stopListening();
    };
  }, [settings, isOnboardingComplete]);

  const checkOnboardingStatus = async () => {
    const completed = await StorageService.isOnboardingCompleted();
    
    if (!completed) {
      router.replace('/onboarding');
      return;
    }
    
    setIsOnboardingComplete(completed);
  };

  const loadSettings = async () => {
    const userSettings = await StorageService.getUserSettings();
    setSettings(userSettings);
  };

  const checkActiveSession = () => {
    const session = EmergencyService.getActiveSession();
    setActiveSession(session);
  };

  const initializeServices = async () => {
    if (!settings) return;

    // Initialize speed detection
    if (settings.speedDetectionEnabled) {
      SpeedDetectionService.startSpeedMonitoring(handleSpeedDetection);
    }

    // Initialize voice recognition
    if (settings.voiceCommandEnabled) {
      const started = await VoiceRecognitionService.startListening(handleVoiceCommand);
      setIsVoiceListening(started);
    }
  };

  const handleSpeedDetection = (data: SpeedDetectionData) => {
    if (data.isAboveThreshold && !activeSession && !showSpeedAlert) {
      setCurrentSpeed(data.speed);
      setShowSpeedAlert(true);
    }
  };

  const handleVoiceCommand = async (text: string) => {
    console.log('Voice command detected:', text);
    
    if (!activeSession) {
      const sessionId = await EmergencyService.startEmergencySession('voice');
      if (sessionId) {
        handleEmergencyTriggered(sessionId);
      }
    } else {
      // If session is active but only location tracking, enable media recording
      if (!activeSession.mediaRecordingEnabled) {
        await EmergencyService.enableMediaRecording(activeSession.id);
        setActiveSession({ ...activeSession, mediaRecordingEnabled: true });
        Alert.alert(
          'Media Recording Started',
          'Voice command detected. Media recording has been enabled for your emergency session.'
        );
      }
    }
  };

  const handleEmergencyTriggered = async (sessionId: string) => {
    // Get emergency contacts count
    const contacts = await StorageService.getEmergencyContacts();
    const session = EmergencyService.getActiveSession();
    
    setEmergencyDetails({
      sessionId,
      contactsNotified: contacts.length,
      locationShared: true,
      accessCode: session?.emergencyAccessCode || '0000',
    });
    
    setShowEmergencyConfirmation(true);
    
    // Auto-close confirmation after 5 seconds and refresh session
    setTimeout(() => {
      setShowEmergencyConfirmation(false);
      checkActiveSession();
    }, 5000);
  };

  const handleSpeedAlertLocationOnly = async () => {
    setShowSpeedAlert(false);
    const sessionId = await EmergencyService.startEmergencySession('speed');
    if (sessionId) {
      handleEmergencyTriggered(sessionId);
    }
  };

  const handleSpeedAlertFullRecording = async () => {
    setShowSpeedAlert(false);
    const sessionId = await EmergencyService.startEmergencySessionWithMedia('speed');
    if (sessionId) {
      handleEmergencyTriggered(sessionId);
    }
  };

  const handleEndEmergency = () => {
    Alert.alert(
      'End Emergency',
      'Are you sure you want to end the emergency session?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            if (activeSession) {
              await EmergencyService.endEmergencySession(activeSession.id);
              setActiveSession(null);
            }
          },
        },
      ]
    );
  };

  const openEmergencyAccess = () => {
    router.push('/(tabs)/emergency-access');
  };

  const EmergencyConfirmationModal = () => (
    <Modal visible={showEmergencyConfirmation} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.confirmationModal}>
          <View style={styles.confirmationHeader}>
            <CheckCircle size={48} color={colors.success} />
            <Text style={styles.confirmationTitle}>Emergency Activated</Text>
          </View>

          <View style={styles.confirmationContent}>
            <View style={styles.confirmationItem}>
              <Users size={20} color={colors.success} />
              <Text style={styles.confirmationText}>
                {emergencyDetails?.contactsNotified || 0} emergency contacts notified via WhatsApp
              </Text>
            </View>

            <View style={styles.confirmationItem}>
              <MapPin size={20} color={colors.success} />
              <Text style={styles.confirmationText}>
                Location shared and real-time tracking started
              </Text>
            </View>

            <View style={styles.confirmationItem}>
              <Camera size={20} color={colors.success} />
              <Text style={styles.confirmationText}>
                Media recording enabled for evidence capture
              </Text>
            </View>

            {emergencyDetails?.accessCode && (
              <View style={[styles.accessCodeContainer, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '40' }]}>
                <Text style={[styles.accessCodeLabel, { color: colors.primary }]}>
                  Emergency Access Code:
                </Text>
                <Text style={[styles.accessCodeValue, { color: colors.primary }]}>
                  {emergencyDetails.accessCode}
                </Text>
                <Text style={[styles.accessCodeHelp, { color: colors.primary }]}>
                  Share this code with emergency contacts for real-time access
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.confirmationButton, { backgroundColor: colors.primary }]}
            onPress={() => setShowEmergencyConfirmation(false)}
          >
            <Text style={[styles.confirmationButtonText, { color: colors.text.inverse }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!isOnboardingComplete) {
    return null; // Will redirect to onboarding
  }

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <ScrollView style={[styles.container, { backgroundColor: colors.background.primary }]} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[CommonStyles.header, { color: colors.text.primary }]}>
            {i18n.t('emergency.title')}
          </Text>
          <Text style={[CommonStyles.body, { color: colors.text.secondary }]}>
            {i18n.t('emergency.subtitle')}
          </Text>
          
          {isVoiceListening && (
            <View style={[styles.voiceIndicator, { backgroundColor: colors.successLight + '20', borderColor: colors.successLight + '40' }]}>
              <Text style={[styles.voiceIndicatorText, { color: colors.success }]}>
                {i18n.t('emergency.voiceActive')}
              </Text>
            </View>
          )}
        </View>

        {activeSession ? (
          <View style={styles.activeSessionContainer}>
            <View style={[styles.statusCard, { backgroundColor: colors.success }]}>
              <Text style={[styles.statusTitle, { color: colors.text.inverse }]}>
                {i18n.t('emergency.active')}
              </Text>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                Started: {new Date(activeSession.startTime).toLocaleString()}
              </Text>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                Trigger: {activeSession.trigger.toUpperCase()}
              </Text>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                Contacts Notified: {activeSession.contactsNotified.length}
              </Text>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                📍 Real-time location tracking active
              </Text>
              <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                Location Points: {activeSession.locations.length}
              </Text>
              {activeSession.mediaRecordingEnabled && (
                <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                  📸 Media recording active
                </Text>
              )}
              {activeSession.emergencyAccessCode && (
                <View style={styles.accessCodeInfo}>
                  <Text style={[styles.statusText, { color: colors.text.inverse }]}>
                    🔐 Access Code: {activeSession.emergencyAccessCode}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.activeSessionActions}>
              <TouchableOpacity
                style={[styles.accessButton, { backgroundColor: colors.primary }]}
                onPress={openEmergencyAccess}
              >
                <ExternalLink size={20} color={colors.text.inverse} />
                <Text style={[styles.accessButtonText, { color: colors.text.inverse }]}>
                  Emergency Access Portal
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[CommonStyles.dangerButton, styles.endButton]}
                onPress={handleEndEmergency}
              >
                <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>
                  {i18n.t('emergency.endEmergency')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.emergencyContainer}>
            <EmergencyButton onEmergencyTriggered={handleEmergencyTriggered} colors={colors} />
            
            {settings?.locationTrackingMode === 'manual' && (
              <View style={styles.manualOptions}>
                <TouchableOpacity
                  style={[CommonStyles.secondaryButton, styles.optionButton, { borderColor: colors.primary }]}
                  onPress={async () => {
                    const sessionId = await EmergencyService.startEmergencySession('manual');
                    if (sessionId) handleEmergencyTriggered(sessionId);
                  }}
                >
                  <Text style={[CommonStyles.secondaryButtonText, { color: colors.primary }]}>
                    Start Location Tracking
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[CommonStyles.button, styles.optionButton, { backgroundColor: colors.primary }]}
                  onPress={async () => {
                    const sessionId = await EmergencyService.startEmergencySessionWithMedia('manual');
                    if (sessionId) handleEmergencyTriggered(sessionId);
                  }}
                >
                  <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>
                    Start Location + Recording
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        <View style={styles.infoContainer}>
          <Text style={[styles.infoTitle, { color: colors.text.primary }]}>
            {i18n.t('emergency.howItWorks')}
          </Text>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>1</Text>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              {i18n.t('emergency.step1')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>2</Text>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              {i18n.t('emergency.step2')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>3</Text>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              {i18n.t('emergency.step3')}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={[styles.infoNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>4</Text>
            <Text style={[styles.infoText, { color: colors.text.secondary }]}>
              {i18n.t('emergency.step4')}
            </Text>
          </View>
        </View>
      </ScrollView>

      <SpeedDetectionAlert
        visible={showSpeedAlert}
        speed={currentSpeed}
        onStartLocationTracking={handleSpeedAlertLocationOnly}
        onStartFullRecording={handleSpeedAlertFullRecording}
        onDismiss={() => setShowSpeedAlert(false)}
        colors={colors}
      />

      <EmergencyConfirmationModal />
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  
  header: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  
  voiceIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    borderWidth: 1,
  },
  
  voiceIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  emergencyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  manualOptions: {
    width: '100%',
    marginTop: 32,
    gap: 12,
  },
  
  optionButton: {
    paddingVertical: 16,
  },
  
  activeSessionContainer: {
    paddingVertical: 20,
  },
  
  statusCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
  },
  
  statusText: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },

  accessCodeInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  
  activeSessionActions: {
    gap: 12,
    paddingHorizontal: 20,
  },

  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
  },

  accessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  endButton: {
    paddingVertical: 16,
  },
  
  infoContainer: {
    marginTop: 40,
    paddingBottom: 40,
  },
  
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  
  infoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  
  infoNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  
  infoText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  confirmationModal: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },

  confirmationHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },

  confirmationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 12,
  },

  confirmationContent: {
    width: '100%',
    marginBottom: 24,
  },

  confirmationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },

  confirmationText: {
    flex: 1,
    fontSize: 14,
    color: colors.text.primary,
    marginLeft: 12,
    fontWeight: '500',
  },

  accessCodeContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginTop: 8,
  },

  accessCodeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },

  accessCodeValue: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 4,
  },

  accessCodeHelp: {
    fontSize: 12,
    textAlign: 'center',
  },

  confirmationButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
  },

  confirmationButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
