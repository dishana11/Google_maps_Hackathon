import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Shield, Users, MapPin, Camera, ArrowRight, Check, Mic, Zap, MessageCircle } from 'lucide-react-native';
import { Colors } from '../constants/Colors';
import { CommonStyles } from '../constants/Styles';
import { StorageService } from '../services/StorageService';
import { UserSettings } from '../types';

const onboardingSteps = [
  {
    title: 'Welcome to SafeTravel',
    subtitle: 'Your personal safety companion',
    description: 'SafeTravel helps keep you safe during your travels by providing emergency features, location sharing, and quick access to help when you need it most.',
    icon: <Shield size={64} color={Colors.primary} />,
  },
  {
    title: 'Location Tracking',
    subtitle: 'Choose how you want to track your location',
    description: 'Select your preferred method for location tracking. You can change this later in settings.',
    icon: <MapPin size={64} color={Colors.success} />,
    isLocationChoice: true,
  },
  {
    title: 'Speed Detection',
    subtitle: 'Automatic safety monitoring',
    description: 'Enable speed detection to automatically prompt location tracking when you\'re moving faster than walking speed.',
    icon: <Zap size={64} color={Colors.warning} />,
    isSpeedDetection: true,
  },
  {
    title: 'Voice Commands',
    subtitle: 'Hands-free emergency activation',
    description: 'Set up a custom voice command to trigger emergency mode when you need help.',
    icon: <Mic size={64} color={Colors.secondary} />,
    isVoiceSetup: true,
  },
  {
    title: 'Emergency Contacts',
    subtitle: 'Connect with trusted people',
    description: 'Add 1-5 emergency contacts who will be notified during emergencies. Include WhatsApp numbers for instant messaging.',
    icon: <Users size={64} color={Colors.secondary} />,
    isContactSetup: true,
  },
  {
    title: 'Media Capture',
    subtitle: 'Document your surroundings',
    description: 'Automatically capture photos and videos during emergencies. This evidence can be crucial for your safety.',
    icon: <Camera size={64} color={Colors.warning} />,
  },
];

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [settings, setSettings] = useState<Partial<UserSettings>>({
    locationTrackingMode: 'manual',
    speedDetectionEnabled: true,
    speedThreshold: 50,
    voiceCommandEnabled: true,
    voiceCommand: 'emergency help',
    whatsappIntegrationEnabled: true,
    autoPhotoCapture: true,
    autoVideoRecording: false,
  });
  const [contacts, setContacts] = useState<Array<{
    name: string;
    phone: string;
    whatsappNumber: string;
    relationship: string;
  }>>([]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      // Save settings
      const defaultSettings: UserSettings = {
        voiceCommandEnabled: settings.voiceCommandEnabled || false,
        voiceCommand: settings.voiceCommand || 'emergency help',
        autoPhotoCapture: settings.autoPhotoCapture || true,
        autoVideoRecording: settings.autoVideoRecording || false,
        locationSharingEnabled: true,
        dataRetentionDays: 7,
        emergencyMode: false,
        locationTrackingMode: settings.locationTrackingMode || 'manual',
        speedDetectionEnabled: settings.speedDetectionEnabled || false,
        speedThreshold: settings.speedThreshold || 50,
        whatsappIntegrationEnabled: settings.whatsappIntegrationEnabled || false,
      };

      await StorageService.saveUserSettings(defaultSettings);

      // Save contacts if any
      if (contacts.length > 0) {
        const emergencyContacts = contacts.map((contact, index) => ({
          id: (Date.now() + index).toString(),
          name: contact.name,
          phone: contact.phone,
          whatsappNumber: contact.whatsappNumber,
          relationship: contact.relationship,
          isPrimary: index === 0,
          createdAt: new Date().toISOString(),
        }));

        await StorageService.saveEmergencyContacts(emergencyContacts);
      }

      await StorageService.setOnboardingCompleted();
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  const addContact = () => {
    if (contacts.length < 5) {
      setContacts([...contacts, { name: '', phone: '', whatsappNumber: '', relationship: '' }]);
    }
  };

  const updateContact = (index: number, field: string, value: string) => {
    const updatedContacts = [...contacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setContacts(updatedContacts);
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const currentStepData = onboardingSteps[currentStep];
  const isLastStep = currentStep === onboardingSteps.length - 1;

  const renderLocationChoice = () => (
    <View style={styles.choiceContainer}>
      <TouchableOpacity
        style={[
          styles.choiceButton,
          settings.locationTrackingMode === 'always' && styles.choiceButtonActive
        ]}
        onPress={() => setSettings({ ...settings, locationTrackingMode: 'always' })}
      >
        <Text style={[
          styles.choiceButtonText,
          settings.locationTrackingMode === 'always' && styles.choiceButtonTextActive
        ]}>
          Always track my location
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.choiceButton,
          settings.locationTrackingMode === 'manual' && styles.choiceButtonActive
        ]}
        onPress={() => setSettings({ ...settings, locationTrackingMode: 'manual' })}
      >
        <Text style={[
          styles.choiceButtonText,
          settings.locationTrackingMode === 'manual' && styles.choiceButtonTextActive
        ]}>
          Track when I click a button
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.choiceButton,
          settings.locationTrackingMode === 'voice' && styles.choiceButtonActive
        ]}
        onPress={() => setSettings({ ...settings, locationTrackingMode: 'voice' })}
      >
        <Text style={[
          styles.choiceButtonText,
          settings.locationTrackingMode === 'voice' && styles.choiceButtonTextActive
        ]}>
          Track when I say a trigger phrase
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpeedDetection = () => (
    <View style={styles.settingContainer}>
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => setSettings({ ...settings, speedDetectionEnabled: !settings.speedDetectionEnabled })}
      >
        <View style={[styles.checkbox, settings.speedDetectionEnabled && styles.checkboxChecked]}>
          {settings.speedDetectionEnabled && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.toggleText}>Enable speed detection</Text>
      </TouchableOpacity>

      {settings.speedDetectionEnabled && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Speed threshold (km/h)</Text>
          <TextInput
            style={CommonStyles.input}
            value={settings.speedThreshold?.toString()}
            onChangeText={(text) => setSettings({ ...settings, speedThreshold: parseInt(text) || 50 })}
            keyboardType="numeric"
            placeholder="50"
          />
        </View>
      )}
    </View>
  );

  const renderVoiceSetup = () => (
    <View style={styles.settingContainer}>
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => setSettings({ ...settings, voiceCommandEnabled: !settings.voiceCommandEnabled })}
      >
        <View style={[styles.checkbox, settings.voiceCommandEnabled && styles.checkboxChecked]}>
          {settings.voiceCommandEnabled && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.toggleText}>Enable voice commands</Text>
      </TouchableOpacity>

      {settings.voiceCommandEnabled && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Emergency trigger phrase</Text>
          <TextInput
            style={CommonStyles.input}
            value={settings.voiceCommand}
            onChangeText={(text) => setSettings({ ...settings, voiceCommand: text })}
            placeholder="emergency help"
          />
          <Text style={styles.inputHelp}>
            Say this phrase to activate emergency mode
          </Text>
        </View>
      )}
    </View>
  );

  const renderContactSetup = () => (
    <View style={styles.contactContainer}>
      <View style={styles.contactHeader}>
        <Text style={styles.contactHeaderText}>Emergency Contacts (1-5)</Text>
        {contacts.length < 5 && (
          <TouchableOpacity style={styles.addContactButton} onPress={addContact}>
            <Text style={styles.addContactButtonText}>+ Add Contact</Text>
          </TouchableOpacity>
        )}
      </View>

      {contacts.length === 0 && (
        <View style={styles.noContactsContainer}>
          <Text style={styles.noContactsText}>
            No contacts added yet. Add at least one emergency contact to continue.
          </Text>
          <TouchableOpacity style={CommonStyles.button} onPress={addContact}>
            <Text style={CommonStyles.buttonText}>Add First Contact</Text>
          </TouchableOpacity>
        </View>
      )}

      {contacts.map((contact, index) => (
        <View key={index} style={styles.contactForm}>
          <View style={styles.contactFormHeader}>
            <Text style={styles.contactFormTitle}>Contact {index + 1}</Text>
            <TouchableOpacity onPress={() => removeContact(index)}>
              <Text style={styles.removeContactText}>Remove</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={CommonStyles.input}
            value={contact.name}
            onChangeText={(text) => updateContact(index, 'name', text)}
            placeholder="Full name"
          />

          <TextInput
            style={CommonStyles.input}
            value={contact.phone}
            onChangeText={(text) => updateContact(index, 'phone', text)}
            placeholder="Phone number"
            keyboardType="phone-pad"
          />

          <TextInput
            style={CommonStyles.input}
            value={contact.whatsappNumber}
            onChangeText={(text) => updateContact(index, 'whatsappNumber', text)}
            placeholder="WhatsApp number (optional)"
            keyboardType="phone-pad"
          />

          <TextInput
            style={CommonStyles.input}
            value={contact.relationship}
            onChangeText={(text) => updateContact(index, 'relationship', text)}
            placeholder="Relationship (e.g., Mother, Partner)"
          />
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={CommonStyles.safeArea}>
      <View style={styles.container}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {onboardingSteps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep ? styles.progressDotActive : styles.progressDotInactive,
              ]}
            />
          ))}
        </View>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconContainer}>
            {currentStepData.icon}
          </View>

          <Text style={styles.title}>{currentStepData.title}</Text>
          <Text style={styles.subtitle}>{currentStepData.subtitle}</Text>
          <Text style={styles.description}>{currentStepData.description}</Text>

          {/* Step-specific content */}
          {currentStepData.isLocationChoice && renderLocationChoice()}
          {currentStepData.isSpeedDetection && renderSpeedDetection()}
          {currentStepData.isVoiceSetup && renderVoiceSetup()}
          {currentStepData.isContactSetup && renderContactSetup()}

          {/* Safety Tips for first step */}
          {currentStep === 0 && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Safety Tips:</Text>
              <View style={styles.tipItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.tipText}>Keep your phone charged</Text>
              </View>
              <View style={styles.tipItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.tipText}>Share your plans with trusted contacts</Text>
              </View>
              <View style={styles.tipItem}>
                <Check size={16} color={Colors.success} />
                <Text style={styles.tipText}>Trust your instincts</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[
              CommonStyles.button,
              styles.nextButton,
              isLastStep && styles.completeButton,
              (currentStepData.isContactSetup && contacts.length === 0) && styles.buttonDisabled,
            ]}
            onPress={handleNext}
            disabled={currentStepData.isContactSetup && contacts.length === 0}
          >
            <Text style={[CommonStyles.buttonText, styles.nextButtonText]}>
              {isLastStep ? 'Get Started' : 'Next'}
            </Text>
            <ArrowRight size={20} color={Colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },

  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  progressDotActive: {
    backgroundColor: Colors.primary,
  },

  progressDotInactive: {
    backgroundColor: Colors.border.light,
  },

  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1,
    padding: 8,
  },

  skipText: {
    fontSize: 16,
    color: Colors.text.secondary,
    fontWeight: '600',
  },

  content: {
    flex: 1,
    paddingHorizontal: 20,
  },

  contentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },

  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  choiceContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },

  choiceButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border.light,
    backgroundColor: Colors.background.secondary,
  },

  choiceButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight + '20',
  },

  choiceButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.secondary,
    textAlign: 'center',
  },

  choiceButtonTextActive: {
    color: Colors.primary,
  },

  settingContainer: {
    width: '100%',
    marginBottom: 32,
  },

  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: Colors.border.medium,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  checkmark: {
    color: Colors.text.inverse,
    fontSize: 12,
    fontWeight: '700',
  },

  toggleText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontWeight: '600',
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
  },

  inputHelp: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 4,
  },

  contactContainer: {
    width: '100%',
    marginBottom: 32,
  },

  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  contactHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  addContactButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.primary,
    borderRadius: 6,
  },

  addContactButtonText: {
    fontSize: 14,
    color: Colors.text.inverse,
    fontWeight: '600',
  },

  noContactsContainer: {
    alignItems: 'center',
    padding: 20,
  },

  noContactsText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },

  contactForm: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },

  contactFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  contactFormTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },

  removeContactText: {
    fontSize: 14,
    color: Colors.danger,
    fontWeight: '600',
  },

  tipsContainer: {
    width: '100%',
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },

  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 16,
  },

  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  tipText: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginLeft: 12,
  },

  navigation: {
    padding: 20,
  },

  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },

  completeButton: {
    backgroundColor: Colors.success,
  },

  buttonDisabled: {
    backgroundColor: Colors.border.medium,
  },

  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
