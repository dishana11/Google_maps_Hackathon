import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Alert, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mic, Camera, MapPin, Clock, Shield, Trash2, Play, Square, RotateCcw, Palette, Globe, ChevronRight, Search } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { StorageService } from '../../services/StorageService';
import { UserSettings } from '../../types';
import i18n, { setLanguage, getCurrentLanguage, getSupportedLanguages } from '../../localization/i18n';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    voiceCommandEnabled: true,
    voiceCommand: 'emergency help',
    autoPhotoCapture: true,
    autoVideoRecording: false,
    locationSharingEnabled: true,
    dataRetentionDays: 7,
    emergencyMode: false,
  });

  const [voiceRecordingState, setVoiceRecordingState] = useState<{
    isRecording: boolean;
    currentTrial: number;
    recordings: string[];
    selectedRecording: string | null;
  }>({
    isRecording: false,
    currentTrial: 0,
    recordings: [],
    selectedRecording: null,
  });

  const [showVoiceRecording, setShowVoiceRecording] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [languageSearchQuery, setLanguageSearchQuery] = useState('');

  const styles = createStyles(colors);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const savedSettings = await StorageService.getUserSettings();
    setSettings(savedSettings);
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    await StorageService.saveUserSettings(updatedSettings);
  };

  const handleLanguageChange = async (languageCode: string) => {
    await setLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setShowLanguagePicker(false);
    setLanguageSearchQuery('');
    // Force re-render by updating a state
    loadSettings();
  };

  const startVoiceRecording = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Voice Recording',
        'Voice recording is not available in the web version. Please use the text input option instead.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setVoiceRecordingState(prev => ({
        ...prev,
        isRecording: true,
      }));

      setTimeout(() => {
        const newRecording = `Recording ${voiceRecordingState.currentTrial + 1}`;
        setVoiceRecordingState(prev => ({
          ...prev,
          isRecording: false,
          currentTrial: prev.currentTrial + 1,
          recordings: [...prev.recordings, newRecording],
        }));
      }, 3000);

    } catch (error) {
      Alert.alert('Error', 'Failed to start voice recording');
      setVoiceRecordingState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const stopVoiceRecording = () => {
    setVoiceRecordingState(prev => ({ ...prev, isRecording: false }));
  };

  const playRecording = (recording: string) => {
    Alert.alert('Playing Recording', `Playing: ${recording}`);
  };

  const selectRecording = (recording: string) => {
    setVoiceRecordingState(prev => ({ ...prev, selectedRecording: recording }));
  };

  const saveVoiceCommand = () => {
    if (voiceRecordingState.selectedRecording) {
      updateSettings({ voiceCommand: voiceRecordingState.selectedRecording });
      setShowVoiceRecording(false);
      Alert.alert('Success', 'Voice command saved successfully!');
    } else {
      Alert.alert('Error', 'Please select a recording first');
    }
  };

  const resetVoiceRecording = () => {
    setVoiceRecordingState({
      isRecording: false,
      currentTrial: 0,
      recordings: [],
      selectedRecording: null,
    });
  };

  const handleClearData = () => {
    Alert.alert(
      i18n.t('settings.clearAllData'),
      i18n.t('settings.clearDataWarning'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('settings.clearAllData'),
          style: 'destructive',
          onPress: async () => {
            Alert.alert(i18n.t('common.success'), i18n.t('settings.dataCleared'));
          },
        },
      ]
    );
  };

  // Filter languages based on search query
  const filteredLanguages = getSupportedLanguages().filter(language =>
    language.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    language.nativeName.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
    language.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
  );

  const SettingItem = ({ 
    title, 
    description, 
    icon, 
    children 
  }: { 
    title: string; 
    description?: string; 
    icon: React.ReactNode; 
    children: React.ReactNode; 
  }) => (
    <View style={[styles.settingItem, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
      <View style={styles.settingHeader}>
        <View style={[styles.settingIcon, { backgroundColor: colors.background.secondary }]}>
          {icon}
        </View>
        <View style={styles.settingInfo}>
          <Text style={[styles.settingTitle, { color: colors.text.primary }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>{description}</Text>
          )}
        </View>
      </View>
      <View style={styles.settingControl}>
        {children}
      </View>
    </View>
  );

  const ThemePickerModal = () => (
    <Modal visible={showThemePicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.pickerModal, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.theme')}
            </Text>
            <TouchableOpacity onPress={() => setShowThemePicker(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.optionsList}>
            {[
              { key: 'light', label: i18n.t('themes.light') },
              { key: 'dark', label: i18n.t('themes.dark') },
              { key: 'system', label: i18n.t('themes.system') },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.optionItem,
                  { borderBottomColor: colors.border.light },
                  theme === option.key && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => {
                  setTheme(option.key as 'light' | 'dark' | 'system');
                  setShowThemePicker(false);
                }}
              >
                <Text style={[
                  styles.optionText,
                  { color: colors.text.primary },
                  theme === option.key && { color: colors.primary, fontWeight: '600' }
                ]}>
                  {option.label}
                </Text>
                {theme === option.key && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  const LanguagePickerModal = () => (
    <Modal visible={showLanguagePicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.languageModal, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.language')} ({getSupportedLanguages().length} languages)
            </Text>
            <TouchableOpacity onPress={() => {
              setShowLanguagePicker(false);
              setLanguageSearchQuery('');
            }}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
              <Search size={20} color={colors.text.tertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Search languages..."
                value={languageSearchQuery}
                onChangeText={setLanguageSearchQuery}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
          
          <ScrollView style={styles.languageList}>
            {filteredLanguages.map((language) => (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageItem,
                  { borderBottomColor: colors.border.light },
                  currentLanguage === language.code && { backgroundColor: colors.primary + '20' }
                ]}
                onPress={() => handleLanguageChange(language.code)}
              >
                <View style={styles.languageInfo}>
                  <Text style={[
                    styles.languageName,
                    { color: colors.text.primary },
                    currentLanguage === language.code && { color: colors.primary, fontWeight: '600' }
                  ]}>
                    {language.nativeName}
                  </Text>
                  <Text style={[
                    styles.languageEnglishName,
                    { color: colors.text.secondary },
                    currentLanguage === language.code && { color: colors.primary }
                  ]}>
                    {language.name}
                  </Text>
                </View>
                <Text style={[
                  styles.languageCode,
                  { color: colors.text.tertiary },
                  currentLanguage === language.code && { color: colors.primary }
                ]}>
                  {language.code.toUpperCase()}
                </Text>
                {currentLanguage === language.code && (
                  <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            {filteredLanguages.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: colors.text.secondary }]}>
                  No languages found matching "{languageSearchQuery}"
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const VoiceRecordingModal = () => (
    <View style={styles.voiceRecordingModal}>
      <View style={styles.modalHeader}>
        <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Record Voice Command</Text>
        <TouchableOpacity onPress={() => setShowVoiceRecording(false)}>
          <Text style={[styles.modalClose, { color: colors.primary }]}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.modalDescription, { color: colors.text.secondary }]}>
        Record your emergency phrase 3 times for better recognition. Speak clearly and consistently.
      </Text>

      <View style={styles.recordingSection}>
        <Text style={[styles.recordingTitle, { color: colors.text.primary }]}>
          Trial {voiceRecordingState.currentTrial + 1} of 3
        </Text>

        <TouchableOpacity
          style={[
            styles.recordButton,
            { backgroundColor: colors.primary },
            voiceRecordingState.isRecording && { backgroundColor: colors.danger },
            voiceRecordingState.currentTrial >= 3 && { backgroundColor: colors.border.medium },
          ]}
          onPress={voiceRecordingState.isRecording ? stopVoiceRecording : startVoiceRecording}
          disabled={voiceRecordingState.currentTrial >= 3}
        >
          {voiceRecordingState.isRecording ? (
            <Square size={32} color={colors.text.inverse} />
          ) : (
            <Mic size={32} color={colors.text.inverse} />
          )}
        </TouchableOpacity>

        <Text style={[styles.recordingStatus, { color: colors.text.secondary }]}>
          {voiceRecordingState.isRecording 
            ? 'Recording... Tap to stop' 
            : voiceRecordingState.currentTrial >= 3 
              ? 'All trials completed' 
              : 'Tap to start recording'
          }
        </Text>
      </View>

      {voiceRecordingState.recordings.length > 0 && (
        <View style={styles.recordingsList}>
          <Text style={[styles.recordingsTitle, { color: colors.text.primary }]}>Your Recordings:</Text>
          {voiceRecordingState.recordings.map((recording, index) => (
            <View key={index} style={[styles.recordingItem, { backgroundColor: colors.background.secondary }]}>
              <TouchableOpacity
                style={[styles.playButton, { backgroundColor: colors.primaryLight + '20' }]}
                onPress={() => playRecording(recording)}
              >
                <Play size={16} color={colors.primary} />
              </TouchableOpacity>
              
              <Text style={[styles.recordingLabel, { color: colors.text.primary }]}>Trial {index + 1}</Text>
              
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  { borderColor: colors.primary },
                  voiceRecordingState.selectedRecording === recording && { backgroundColor: colors.primary },
                ]}
                onPress={() => selectRecording(recording)}
              >
                <Text style={[
                  styles.selectButtonText,
                  { color: colors.primary },
                  voiceRecordingState.selectedRecording === recording && { color: colors.text.inverse },
                ]}>
                  {voiceRecordingState.selectedRecording === recording ? 'Selected' : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.modalActions}>
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: colors.background.secondary }]}
          onPress={resetVoiceRecording}
        >
          <RotateCcw size={16} color={colors.text.secondary} />
          <Text style={[styles.resetButtonText, { color: colors.text.secondary }]}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: colors.success },
            !voiceRecordingState.selectedRecording && { backgroundColor: colors.border.medium },
          ]}
          onPress={saveVoiceCommand}
          disabled={!voiceRecordingState.selectedRecording}
        >
          <Text style={[styles.saveButtonText, { color: colors.text.inverse }]}>Save Voice Command</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <Text style={[CommonStyles.header, { color: colors.text.primary }]}>
            {i18n.t('settings.title')}
          </Text>
          <Text style={[CommonStyles.body, { color: colors.text.secondary }]}>
            {i18n.t('settings.subtitle')}
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.appearance')}
            </Text>
            
            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}
              onPress={() => setShowThemePicker(true)}
            >
              <View style={styles.settingHeader}>
                <View style={[styles.settingIcon, { backgroundColor: colors.background.secondary }]}>
                  <Palette size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                    {i18n.t('settings.theme')}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                    {i18n.t('settings.themeDesc')}
                  </Text>
                </View>
              </View>
              <View style={styles.settingControl}>
                <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
                  {i18n.t(`themes.${theme}`)}
                </Text>
                <ChevronRight size={20} color={colors.text.tertiary} />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.settingItem, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}
              onPress={() => setShowLanguagePicker(true)}
            >
              <View style={styles.settingHeader}>
                <View style={[styles.settingIcon, { backgroundColor: colors.background.secondary }]}>
                  <Globe size={20} color={colors.primary} />
                </View>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingTitle, { color: colors.text.primary }]}>
                    {i18n.t('settings.language')}
                  </Text>
                  <Text style={[styles.settingDescription, { color: colors.text.secondary }]}>
                    {i18n.t('settings.languageDesc')}
                  </Text>
                </View>
              </View>
              <View style={styles.settingControl}>
                <Text style={[styles.settingValue, { color: colors.text.secondary }]}>
                  {getSupportedLanguages().find(lang => lang.code === currentLanguage)?.nativeName || 'English'}
                </Text>
                <ChevronRight size={20} color={colors.text.tertiary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Voice Commands */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.voiceCommands')}
            </Text>
            
            <SettingItem
              title={i18n.t('settings.voiceActivation')}
              description={i18n.t('settings.voiceActivationDesc')}
              icon={<Mic size={20} color={colors.primary} />}
            >
              <Switch
                value={settings.voiceCommandEnabled}
                onValueChange={(value) => updateSettings({ voiceCommandEnabled: value })}
                trackColor={{ false: colors.border.medium, true: colors.primaryLight }}
                thumbColor={settings.voiceCommandEnabled ? colors.primary : colors.text.tertiary}
              />
            </SettingItem>

            {settings.voiceCommandEnabled && (
              <View style={styles.voiceCommandSection}>
                <Text style={[styles.inputLabel, { color: colors.text.primary }]}>
                  {i18n.t('settings.voiceCommandPhrase')}
                </Text>
                <TextInput
                  style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                  value={settings.voiceCommand}
                  onChangeText={(text) => updateSettings({ voiceCommand: text })}
                  placeholder="Enter your emergency phrase"
                  placeholderTextColor={colors.text.tertiary}
                />
                <Text style={[styles.inputHelp, { color: colors.text.tertiary }]}>
                  {i18n.t('settings.voiceCommandHelp')}
                </Text>

                <View style={styles.voiceOptions}>
                  <TouchableOpacity
                    style={[styles.voiceOptionButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}
                    onPress={() => setShowVoiceRecording(true)}
                  >
                    <Mic size={20} color={colors.primary} />
                    <Text style={[styles.voiceOptionText, { color: colors.primary }]}>
                      {i18n.t('settings.recordVoiceCommand')}
                    </Text>
                  </TouchableOpacity>
                  
                  <Text style={[styles.voiceOptionDescription, { color: colors.text.tertiary }]}>
                    {i18n.t('settings.recordVoiceDesc')}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Media Capture */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.mediaCapture')}
            </Text>
            
            <SettingItem
              title={i18n.t('settings.autoPhotoCapture')}
              description={i18n.t('settings.autoPhotoCaptureDesc')}
              icon={<Camera size={20} color={colors.primary} />}
            >
              <Switch
                value={settings.autoPhotoCapture}
                onValueChange={(value) => updateSettings({ autoPhotoCapture: value })}
                trackColor={{ false: colors.border.medium, true: colors.primaryLight }}
                thumbColor={settings.autoPhotoCapture ? colors.primary : colors.text.tertiary}
              />
            </SettingItem>

            <SettingItem
              title={i18n.t('settings.autoVideoRecording')}
              description={i18n.t('settings.autoVideoRecordingDesc')}
              icon={<Camera size={20} color={colors.primary} />}
            >
              <Switch
                value={settings.autoVideoRecording}
                onValueChange={(value) => updateSettings({ autoVideoRecording: value })}
                trackColor={{ false: colors.border.medium, true: colors.primaryLight }}
                thumbColor={settings.autoVideoRecording ? colors.primary : colors.text.tertiary}
              />
            </SettingItem>
          </View>

          {/* Location & Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.locationPrivacy')}
            </Text>
            
            <SettingItem
              title={i18n.t('settings.locationSharing')}
              description={i18n.t('settings.locationSharingDesc')}
              icon={<MapPin size={20} color={colors.primary} />}
            >
              <Switch
                value={settings.locationSharingEnabled}
                onValueChange={(value) => updateSettings({ locationSharingEnabled: value })}
                trackColor={{ false: colors.border.medium, true: colors.primaryLight }}
                thumbColor={settings.locationSharingEnabled ? colors.primary : colors.text.tertiary}
              />
            </SettingItem>

            <SettingItem
              title={i18n.t('settings.dataRetention')}
              description={i18n.t('settings.dataRetentionDesc')}
              icon={<Clock size={20} color={colors.primary} />}
            >
              <View style={[styles.retentionControl, { backgroundColor: colors.background.secondary }]}>
                <Text style={[styles.retentionValue, { color: colors.text.primary }]}>
                  {settings.dataRetentionDays} days
                </Text>
              </View>
            </SettingItem>
          </View>

          {/* Emergency Mode */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.emergencyMode')}
            </Text>
            
            <SettingItem
              title={i18n.t('settings.emergencyMode')}
              description={i18n.t('settings.emergencyModeDesc')}
              icon={<Shield size={20} color={colors.danger} />}
            >
              <Switch
                value={settings.emergencyMode}
                onValueChange={(value) => updateSettings({ emergencyMode: value })}
                trackColor={{ false: colors.border.medium, true: colors.dangerLight }}
                thumbColor={settings.emergencyMode ? colors.danger : colors.text.tertiary}
              />
            </SettingItem>

            {settings.emergencyMode && (
              <View style={[styles.emergencyModeInfo, { backgroundColor: colors.dangerLight + '20', borderColor: colors.dangerLight + '40' }]}>
                <Text style={[styles.emergencyModeText, { color: colors.danger }]}>
                  Emergency mode is active. This enhances security but may limit some features.
                </Text>
              </View>
            )}
          </View>

          {/* Data Management */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
              {i18n.t('settings.dataManagement')}
            </Text>
            
            <TouchableOpacity 
              style={[styles.dangerButton, { backgroundColor: colors.dangerLight + '20', borderColor: colors.dangerLight + '40' }]} 
              onPress={handleClearData}
            >
              <Trash2 size={20} color={colors.danger} />
              <Text style={[styles.dangerButtonText, { color: colors.danger }]}>
                {i18n.t('settings.clearAllData')}
              </Text>
            </TouchableOpacity>
            
            <Text style={[styles.dangerButtonDescription, { color: colors.text.tertiary }]}>
              {i18n.t('settings.clearDataDesc')}
            </Text>
          </View>
        </ScrollView>

        {/* Voice Recording Modal */}
        {showVoiceRecording && (
          <View style={styles.modalOverlay}>
            <VoiceRecordingModal />
          </View>
        )}

        <ThemePickerModal />
        <LanguagePickerModal />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 16,
  },
  
  settingItem: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  settingInfo: {
    flex: 1,
  },
  
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  settingDescription: {
    fontSize: 14,
  },
  
  settingControl: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
  },

  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  
  voiceCommandSection: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  inputHelp: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  
  voiceOptions: {
    marginTop: 16,
  },
  
  voiceOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  voiceOptionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
  
  voiceOptionDescription: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  
  retentionControl: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  
  retentionValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  emergencyModeInfo: {
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  
  emergencyModeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  
  dangerButtonDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },

  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  pickerModal: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '70%',
  },

  languageModal: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
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

  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },

  optionsList: {
    flex: 1,
  },

  languageList: {
    flex: 1,
  },

  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  languageInfo: {
    flex: 1,
  },

  languageName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  languageEnglishName: {
    fontSize: 14,
  },

  languageCode: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 12,
    minWidth: 30,
    textAlign: 'center',
  },

  optionText: {
    fontSize: 16,
  },

  checkmark: {
    fontSize: 16,
    fontWeight: '700',
  },

  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },

  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },

  // Voice Recording Modal Styles
  voiceRecordingModal: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },

  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },

  recordingSection: {
    alignItems: 'center',
    marginBottom: 24,
  },

  recordingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
  },

  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  recordingStatus: {
    fontSize: 14,
    textAlign: 'center',
  },

  recordingsList: {
    marginBottom: 24,
  },

  recordingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  recordingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },

  playButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  recordingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },

  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },

  selectButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },

  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },

  resetButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  saveButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },

  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
