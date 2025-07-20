import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, Phone, Clock, Camera, FileText, Mic, Shield, Eye, EyeOff, LogIn, ExternalLink, Lock, Key, Users } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { StorageService } from '../../services/StorageService';
import { EmergencyService } from '../../services/EmergencyService';
import { VaultEntry, LocationData, EmergencyContact, EmergencySession } from '../../types';

export default function EmergencyAccessScreen() {
  const { colors } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [privateAccessCode, setPrivateAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [showPrivateCode, setShowPrivateCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessLevel, setAccessLevel] = useState<'shared' | 'full'>('shared');
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);
  const [emergencyData, setEmergencyData] = useState<{
    sessions: EmergencySession[];
    sharedContent: VaultEntry[];
    privateContent: VaultEntry[];
    lastKnownLocation: LocationData | null;
    contactInfo: EmergencyContact | null;
  } | null>(null);

  const styles = createStyles(colors);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      // Check if user is an emergency contact (phone number verification)
      const contacts = await StorageService.getEmergencyContacts();
      const contact = contacts.find(c => 
        c.phone.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '') ||
        c.whatsappNumber?.replace(/\D/g, '') === phoneNumber.replace(/\D/g, '')
      );

      if (!contact) {
        Alert.alert('Access Denied', 'Phone number not found in emergency contacts');
        setIsLoading(false);
        return;
      }

      setIsEmergencyContact(true);

      // If access code is provided, verify it for emergency sessions
      let verifiedForEmergencyData = false;
      if (accessCode.trim()) {
        // For demo purposes, accept any 4-digit code
        // In production, this would be a secure code sent via SMS/WhatsApp
        if (accessCode.length !== 4) {
          Alert.alert('Invalid Code', 'Access code must be 4 digits');
          setIsLoading(false);
          return;
        }
        verifiedForEmergencyData = true;
      }

      // Load shared content (always available to emergency contacts)
      const sharedContent = await StorageService.getSharedVaultEntries();

      // Load emergency data only if access code is provided
      let sessions: EmergencySession[] = [];
      let lastKnownLocation: LocationData | null = null;

      if (verifiedForEmergencyData) {
        const allSessions = await StorageService.getEmergencySessions();
        const activeSessions = allSessions.filter(s => s.isActive);
        sessions = activeSessions.length > 0 ? activeSessions : [allSessions.sort((a, b) => 
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        )[0]].filter(Boolean);

        // Get last known location from most recent session
        const lastSession = sessions[0];
        lastKnownLocation = lastSession?.locations[lastSession.locations.length - 1] || null;
      }

      setEmergencyData({
        sessions,
        sharedContent,
        privateContent: [], // Initially empty, requires private access code
        lastKnownLocation,
        contactInfo: contact,
      });

      setAccessLevel('shared');
      setIsAuthenticated(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to access emergency data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrivateAccess = async () => {
    if (!privateAccessCode.trim()) {
      Alert.alert('Error', 'Please enter the private access code');
      return;
    }

    try {
      const storedPrivateCode = await StorageService.getPrivateAccessCode();
      
      if (privateAccessCode !== storedPrivateCode) {
        Alert.alert('Access Denied', 'Invalid private access code');
        return;
      }

      // Load private vault content
      const privateContent = await StorageService.getPrivateVaultEntries();
      
      if (emergencyData) {
        setEmergencyData({
          ...emergencyData,
          privateContent,
        });
      }

      setAccessLevel('full');
      setShowPrivateModal(false);
      Alert.alert('Access Granted', 'You now have access to private vault content');
    } catch (error) {
      Alert.alert('Error', 'Failed to verify private access code');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPhoneNumber('');
    setAccessCode('');
    setPrivateAccessCode('');
    setEmergencyData(null);
    setAccessLevel('shared');
    setIsEmergencyContact(false);
  };

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const openLocationInMaps = (location: LocationData) => {
    // Use OpenStreetMap instead of Google Maps
    const url = `https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=16`;
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
  };

  // Check if emergency data access button should be enabled
  const isEmergencyAccessEnabled = phoneNumber.trim() && accessCode.trim();

  const PrivateAccessModal = () => (
    <Modal visible={showPrivateModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.privateModal, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Private Vault Access
            </Text>
            <TouchableOpacity onPress={() => setShowPrivateModal(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.privateAccessInfo, { backgroundColor: colors.warningLight + '20', borderColor: colors.warningLight + '40' }]}>
            <Lock size={24} color={colors.warning} />
            <Text style={[styles.privateAccessInfoText, { color: colors.warning }]}>
              Enter the private access code shared by the user to view their private vault content. This includes personal notes, photos, and voice recordings.
            </Text>
          </View>

          <View style={styles.privateCodeSection}>
            <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Private Access Code</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[CommonStyles.input, styles.passwordInput, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                value={privateAccessCode}
                onChangeText={setPrivateAccessCode}
                placeholder="Enter 6-digit private code"
                keyboardType="numeric"
                secureTextEntry={!showPrivateCode}
                maxLength={6}
                placeholderTextColor={colors.text.tertiary}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPrivateCode(!showPrivateCode)}
              >
                {showPrivateCode ? (
                  <EyeOff size={20} color={colors.text.tertiary} />
                ) : (
                  <Eye size={20} color={colors.text.tertiary} />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputHelp, { color: colors.text.tertiary }]}>
              This code was generated by the user in their Private Vault settings
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.accessButton, { backgroundColor: colors.warning }]}
            onPress={handlePrivateAccess}
          >
            <Key size={20} color={colors.text.inverse} />
            <Text style={[styles.accessButtonText, { color: colors.text.inverse }]}>
              Access Private Content
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const LoginForm = () => (
    <View style={styles.loginContainer}>
      <View style={styles.loginHeader}>
        <Shield size={64} color={colors.primary} />
        <Text style={[styles.loginTitle, { color: colors.text.primary }]}>Emergency Contact Access</Text>
        <Text style={[styles.loginSubtitle, { color: colors.text.secondary }]}>
          Access emergency information for your loved one
        </Text>
      </View>

      <View style={styles.loginForm}>
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Your Phone Number</Text>
          <TextInput
            style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="Enter your registered phone number"
            keyboardType="phone-pad"
            placeholderTextColor={colors.text.tertiary}
          />
          <Text style={[styles.inputHelp, { color: colors.text.tertiary }]}>
            Must match the number in their emergency contacts
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Access Code (Optional for Shared Content)</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[CommonStyles.input, styles.passwordInput, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
              value={accessCode}
              onChangeText={setAccessCode}
              placeholder="Enter 4-digit access code"
              keyboardType="numeric"
              secureTextEntry={!showAccessCode}
              maxLength={4}
              placeholderTextColor={colors.text.tertiary}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowAccessCode(!showAccessCode)}
            >
              {showAccessCode ? (
                <EyeOff size={20} color={colors.text.tertiary} />
              ) : (
                <Eye size={20} color={colors.text.tertiary} />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.inputHelp, { color: colors.text.tertiary }]}>
            Required for emergency location data. Leave empty to access shared content only.
          </Text>
        </View>

        {/* Shared Content Access Button */}
        <TouchableOpacity
          style={[
            CommonStyles.button,
            styles.loginButton,
            { backgroundColor: colors.success },
            !phoneNumber.trim() && { backgroundColor: colors.border.medium }
          ]}
          onPress={handleLogin}
          disabled={isLoading || !phoneNumber.trim()}
        >
          <Users size={20} color={colors.text.inverse} />
          <Text style={[CommonStyles.buttonText, { color: colors.text.inverse, marginLeft: 8 }]}>
            {isLoading ? 'Verifying...' : 'Access Shared Content'}
          </Text>
        </TouchableOpacity>

        {/* Emergency Data Access Button */}
        <TouchableOpacity
          style={[
            CommonStyles.button,
            styles.emergencyButton,
            { backgroundColor: isEmergencyAccessEnabled ? colors.danger : colors.border.medium }
          ]}
          onPress={handleLogin}
          disabled={isLoading || !isEmergencyAccessEnabled}
        >
          <Shield size={20} color={colors.text.inverse} />
          <Text style={[CommonStyles.buttonText, { color: colors.text.inverse, marginLeft: 8 }]}>
            {isLoading ? 'Verifying...' : 'Access Emergency Data'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.loginFooter, { backgroundColor: colors.background.secondary }]}>
        <Text style={[styles.footerText, { color: colors.text.secondary }]}>
          <Text style={{ fontWeight: '600' }}>Shared Content:</Text> Available to all emergency contacts without access code.{'\n\n'}
          <Text style={{ fontWeight: '600' }}>Emergency Data:</Text> Requires access code sent during emergency activation.
        </Text>
      </View>
    </View>
  );

  const EmergencyDashboard = () => (
    <View style={styles.dashboardContainer}>
      <View style={[styles.dashboardHeader, { borderBottomColor: colors.border.light }]}>
        <View>
          <Text style={[styles.dashboardTitle, { color: colors.text.primary }]}>Emergency Information</Text>
          <Text style={[styles.dashboardSubtitle, { color: colors.text.secondary }]}>
            Logged in as: {emergencyData?.contactInfo?.name}
          </Text>
          <View style={[styles.accessLevelBadge, { backgroundColor: accessLevel === 'full' ? colors.warning + '20' : colors.success + '20' }]}>
            <Text style={[styles.accessLevelText, { color: accessLevel === 'full' ? colors.warning : colors.success }]}>
              {accessLevel === 'full' ? 'Full Access (Private + Shared)' : 'Shared Access Only'}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {accessLevel === 'shared' && (
            <TouchableOpacity 
              style={[styles.privateAccessButton, { backgroundColor: colors.warning }]} 
              onPress={() => setShowPrivateModal(true)}
            >
              <Lock size={16} color={colors.text.inverse} />
              <Text style={[styles.privateAccessButtonText, { color: colors.text.inverse }]}>Private</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.background.secondary }]} 
            onPress={handleLogout}
          >
            <Text style={[styles.logoutButtonText, { color: colors.text.secondary }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.dashboardContent} showsVerticalScrollIndicator={false}>
        {/* Last Known Location - Only show if emergency data is available */}
        {emergencyData?.lastKnownLocation && (
          <View style={[styles.locationCard, { backgroundColor: colors.dangerLight + '10', borderColor: colors.dangerLight + '30' }]}>
            <View style={styles.cardHeader}>
              <MapPin size={24} color={colors.danger} />
              <Text style={[styles.cardTitle, { color: colors.danger }]}>Last Known Location</Text>
            </View>
            
            <View style={styles.locationInfo}>
              <Text style={[styles.locationAddress, { color: colors.text.primary }]}>
                {emergencyData.lastKnownLocation.address || 'Location coordinates available'}
              </Text>
              <Text style={[styles.locationCoords, { color: colors.text.secondary }]}>
                {emergencyData.lastKnownLocation.latitude.toFixed(6)}, {emergencyData.lastKnownLocation.longitude.toFixed(6)}
              </Text>
              <Text style={[styles.locationTime, { color: colors.text.tertiary }]}>
                Last updated: {formatDateTime(emergencyData.lastKnownLocation.timestamp)}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.mapButton, { backgroundColor: colors.danger }]}
              onPress={() => openLocationInMaps(emergencyData.lastKnownLocation!)}
            >
              <ExternalLink size={16} color={colors.text.inverse} />
              <Text style={[styles.mapButtonText, { color: colors.text.inverse }]}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Emergency Sessions - Only show if emergency data is available */}
        {emergencyData?.sessions && emergencyData.sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Emergency Sessions</Text>
            {emergencyData.sessions.map(session => (
              <View key={session.id} style={[styles.sessionCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
                <View style={styles.sessionHeader}>
                  <Text style={[styles.sessionTitle, { color: colors.text.primary }]}>
                    {session.isActive ? 'ACTIVE EMERGENCY' : 'Recent Emergency'}
                  </Text>
                  <View style={[
                    styles.sessionStatus, 
                    { backgroundColor: colors.border.light },
                    session.isActive && { backgroundColor: colors.danger }
                  ]}>
                    <Text style={[
                      styles.sessionStatusText,
                      { color: colors.text.secondary },
                      session.isActive && { color: colors.text.inverse }
                    ]}>
                      {session.isActive ? 'ACTIVE' : 'ENDED'}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.sessionTime, { color: colors.text.secondary }]}>
                  Started: {formatDateTime(session.startTime)}
                </Text>
                <Text style={[styles.sessionTrigger, { color: colors.text.secondary }]}>
                  Trigger: {session.trigger.toUpperCase()}
                </Text>

                <View style={styles.sessionStats}>
                  <View style={styles.statItem}>
                    <MapPin size={16} color={colors.text.secondary} />
                    <Text style={[styles.statText, { color: colors.text.secondary }]}>{session.locations.length} locations</Text>
                  </View>
                  {session.photos.length > 0 && (
                    <View style={styles.statItem}>
                      <Camera size={16} color={colors.text.secondary} />
                      <Text style={[styles.statText, { color: colors.text.secondary }]}>{session.photos.length} photos</Text>
                    </View>
                  )}
                  {session.videos.length > 0 && (
                    <View style={styles.statItem}>
                      <Camera size={16} color={colors.text.secondary} />
                      <Text style={[styles.statText, { color: colors.text.secondary }]}>{session.videos.length} videos</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Shared Safety Content - Always available to emergency contacts */}
        {emergencyData?.sharedContent && emergencyData.sharedContent.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Shared Safety Content</Text>
            {emergencyData.sharedContent.map(entry => (
              <View key={entry.id} style={[styles.contentCard, { backgroundColor: colors.background.primary, borderColor: colors.successLight + '40' }]}>
                <View style={styles.contentHeader}>
                  <View style={[styles.contentIcon, { backgroundColor: colors.background.secondary }]}>
                    {entry.type === 'text' && <FileText size={20} color={colors.primary} />}
                    {entry.type === 'photo' && <Camera size={20} color={colors.secondary} />}
                    {entry.type === 'voice' && <Mic size={20} color={colors.warning} />}
                  </View>
                  <View style={styles.contentInfo}>
                    <Text style={[styles.contentTitle, { color: colors.text.primary }]}>{entry.title}</Text>
                    {entry.description && (
                      <Text style={[styles.contentDescription, { color: colors.text.secondary }]}>{entry.description}</Text>
                    )}
                    <Text style={[styles.contentTime, { color: colors.text.tertiary }]}>
                      Shared: {formatDateTime(entry.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.contentBody, { borderTopColor: colors.border.light }]}>
                  {entry.type === 'text' && (
                    <Text style={[styles.contentText, { color: colors.text.secondary }]}>{entry.content}</Text>
                  )}
                  {entry.type === 'photo' && (
                    <Image source={{ uri: entry.content }} style={[styles.contentImage, { backgroundColor: colors.background.secondary }]} />
                  )}
                  {entry.type === 'voice' && (
                    <View style={[styles.voiceContent, { backgroundColor: colors.background.secondary }]}>
                      <Mic size={24} color={colors.warning} />
                      <Text style={[styles.voiceText, { color: colors.text.secondary }]}>Voice Recording Available</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Private Safety Content - Only available with private access code */}
        {accessLevel === 'full' && emergencyData?.privateContent && emergencyData.privateContent.length > 0 && (
          <View style={styles.section}>
            <View style={styles.privateSectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Private Safety Content</Text>
              <View style={[styles.privateLabel, { backgroundColor: colors.warning + '20' }]}>
                <Lock size={16} color={colors.warning} />
                <Text style={[styles.privateLabelText, { color: colors.warning }]}>Private</Text>
              </View>
            </View>
            {emergencyData.privateContent.map(entry => (
              <View key={entry.id} style={[styles.contentCard, { backgroundColor: colors.background.primary, borderColor: colors.warningLight + '40' }]}>
                <View style={styles.contentHeader}>
                  <View style={[styles.contentIcon, { backgroundColor: colors.background.secondary }]}>
                    {entry.type === 'text' && <FileText size={20} color={colors.primary} />}
                    {entry.type === 'photo' && <Camera size={20} color={colors.secondary} />}
                    {entry.type === 'voice' && <Mic size={20} color={colors.warning} />}
                  </View>
                  <View style={styles.contentInfo}>
                    <Text style={[styles.contentTitle, { color: colors.text.primary }]}>{entry.title}</Text>
                    <Text style={[styles.contentTime, { color: colors.text.tertiary }]}>
                      Created: {formatDateTime(entry.createdAt)}
                    </Text>
                  </View>
                </View>

                <View style={[styles.contentBody, { borderTopColor: colors.border.light }]}>
                  {entry.type === 'text' && (
                    <Text style={[styles.contentText, { color: colors.text.secondary }]}>{entry.content}</Text>
                  )}
                  {entry.type === 'photo' && (
                    <Image source={{ uri: entry.content }} style={[styles.contentImage, { backgroundColor: colors.background.secondary }]} />
                  )}
                  {entry.type === 'voice' && (
                    <View style={[styles.voiceContent, { backgroundColor: colors.background.secondary }]}>
                      <Mic size={24} color={colors.warning} />
                      <Text style={[styles.voiceText, { color: colors.text.secondary }]}>Voice Recording Available</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Show message if no shared content available */}
        {emergencyData?.sharedContent && emergencyData.sharedContent.length === 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Shared Safety Content</Text>
            <View style={[styles.noContentCard, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
              <Text style={[styles.noContentText, { color: colors.text.secondary }]}>
                No shared content available. The user hasn't shared any safety information yet.
              </Text>
            </View>
          </View>
        )}

        {/* Emergency Instructions */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.primaryLight + '10', borderColor: colors.primaryLight + '30' }]}>
          <Text style={[styles.instructionsTitle, { color: colors.primary }]}>What to do:</Text>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>1</Text>
            <Text style={[styles.instructionText, { color: colors.primary }]}>
              Contact local emergency services if immediate danger is suspected
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>2</Text>
            <Text style={[styles.instructionText, { color: colors.primary }]}>
              Use the location information to guide authorities
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>3</Text>
            <Text style={[styles.instructionText, { color: colors.primary }]}>
              Share this information with other emergency contacts
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Text style={[styles.instructionNumber, { backgroundColor: colors.primary, color: colors.text.inverse }]}>4</Text>
            <Text style={[styles.instructionText, { color: colors.primary }]}>
              Try calling the person directly if safe to do so
            </Text>
          </View>
        </View>
      </ScrollView>

      <PrivateAccessModal />
    </View>
  );

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        {isAuthenticated ? <EmergencyDashboard /> : <LoginForm />}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },

  // Login Form Styles
  loginContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },

  loginHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },

  loginTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },

  loginSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },

  loginForm: {
    marginBottom: 32,
  },

  inputGroup: {
    marginBottom: 20,
  },

  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  inputHelp: {
    fontSize: 12,
    marginTop: 4,
  },

  passwordContainer: {
    position: 'relative',
  },

  passwordInput: {
    paddingRight: 50,
  },

  passwordToggle: {
    position: 'absolute',
    right: 16,
    top: 12,
    padding: 4,
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginBottom: 12,
  },

  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },

  loginFooter: {
    padding: 20,
    borderRadius: 12,
  },

  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Dashboard Styles
  dashboardContainer: {
    flex: 1,
  },

  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },

  dashboardTitle: {
    fontSize: 24,
    fontWeight: '700',
  },

  dashboardSubtitle: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },

  accessLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },

  accessLevelText: {
    fontSize: 12,
    fontWeight: '600',
  },

  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },

  privateAccessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  privateAccessButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },

  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  dashboardContent: {
    flex: 1,
    padding: 20,
  },

  // Location Card Styles
  locationCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 12,
  },

  locationInfo: {
    marginBottom: 16,
  },

  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  locationCoords: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },

  locationTime: {
    fontSize: 12,
  },

  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  mapButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  // Section Styles
  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },

  privateSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  privateLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  privateLabelText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },

  // Session Card Styles
  sessionCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },

  sessionStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  sessionStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },

  sessionTime: {
    fontSize: 14,
    marginBottom: 4,
  },

  sessionTrigger: {
    fontSize: 14,
    marginBottom: 12,
  },

  sessionStats: {
    flexDirection: 'row',
    gap: 16,
  },

  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statText: {
    fontSize: 12,
    marginLeft: 4,
  },

  // Content Card Styles
  contentCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },

  contentHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  contentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  contentInfo: {
    flex: 1,
  },

  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },

  contentDescription: {
    fontSize: 14,
    marginBottom: 4,
  },

  contentTime: {
    fontSize: 12,
  },

  contentBody: {
    paddingTop: 12,
    borderTopWidth: 1,
  },

  contentText: {
    fontSize: 14,
    lineHeight: 20,
  },

  contentImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },

  voiceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },

  voiceText: {
    marginLeft: 12,
    fontSize: 14,
  },

  // No Content Card
  noContentCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },

  noContentText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Instructions Styles
  instructionsCard: {
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },

  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },

  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },

  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },

  // Private Access Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  privateModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },

  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },

  privateAccessInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  privateAccessInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },

  privateCodeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 8,
  },

  accessButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
