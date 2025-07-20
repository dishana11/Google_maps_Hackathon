import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Camera, Mic, FileText, Share, Users, Calendar, Zap } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { StorageService } from '../../services/StorageService';
import { VaultEntry } from '../../types';
import i18n from '../../localization/i18n';

export default function SharedVaultScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickShare, setShowQuickShare] = useState(false);
  const [quickShareType, setQuickShareType] = useState<'text' | 'photo' | 'voice'>('text');
  const [quickContent, setQuickContent] = useState('');
  const [newEntry, setNewEntry] = useState({
    type: 'text' as 'text' | 'photo' | 'voice',
    content: '',
    title: '',
    description: '',
  });

  const styles = createStyles(colors);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    const sharedEntries = await StorageService.getSharedVaultEntries();
    setEntries(sharedEntries);
  };

  const handleQuickShare = async (type: 'text' | 'photo' | 'voice', content?: string) => {
    if (type === 'text' && !content?.trim()) {
      Alert.alert(i18n.t('common.error'), 'Please enter some text');
      return;
    }

    const entry: VaultEntry = {
      id: Date.now().toString(),
      type,
      title: `Quick ${type} - ${new Date().toLocaleTimeString()}`,
      content: content || `Quick ${type} content`,
      flagged: true,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const updatedEntries = [...entries, entry];
    setEntries(updatedEntries);
    await StorageService.saveSharedVaultEntries(updatedEntries);

    setShowQuickShare(false);
    setQuickContent('');
    Alert.alert(i18n.t('common.success'), i18n.t('quickShare.contentShared'));
  };

  const handleCapturePhoto = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Photo Capture', 'Camera access not available in web version. Using placeholder image.');
      handleQuickShare('photo', 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400');
    } else {
      // Would integrate with expo-camera
      handleQuickShare('photo', 'photo_placeholder_uri');
    }
  };

  const handleRecordVoice = () => {
    if (Platform.OS === 'web') {
      Alert.alert('Voice Recording', 'Voice recording not available in web version.');
    } else {
      // Would integrate with expo-av
      handleQuickShare('voice', 'voice_recording_uri');
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      Alert.alert(i18n.t('common.error'), 'Please fill in all fields');
      return;
    }

    const entry: VaultEntry = {
      id: Date.now().toString(),
      type: newEntry.type,
      title: newEntry.title,
      content: newEntry.content,
      description: newEntry.description,
      flagged: true,
      isPrivate: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const updatedEntries = [...entries, entry];
    setEntries(updatedEntries);
    await StorageService.saveSharedVaultEntries(updatedEntries);

    setNewEntry({ type: 'text', content: '', title: '', description: '' });
    setShowAddForm(false);

    Alert.alert(
      'Entry Shared',
      'Your entry has been added to the shared vault. Emergency contacts with the app can now view this content.',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Shared Entry',
      'Are you sure you want to delete this shared entry? Emergency contacts will no longer be able to access it.',
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedEntries = entries.filter(e => e.id !== entryId);
            setEntries(updatedEntries);
            await StorageService.saveSharedVaultEntries(updatedEntries);
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const QuickShareModal = () => (
    <View style={styles.modalOverlay}>
      <View style={styles.quickShareModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{i18n.t('quickShare.shareNow')}</Text>
          <TouchableOpacity onPress={() => setShowQuickShare(false)}>
            <Text style={styles.modalClose}>{i18n.t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.quickShareButtons}>
          <TouchableOpacity
            style={styles.quickShareButton}
            onPress={() => setQuickShareType('text')}
          >
            <FileText size={32} color={colors.primary} />
            <Text style={styles.quickShareButtonText}>{i18n.t('quickShare.quickText')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickShareButton}
            onPress={handleCapturePhoto}
          >
            <Camera size={32} color={colors.secondary} />
            <Text style={styles.quickShareButtonText}>{i18n.t('quickShare.quickPhoto')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickShareButton}
            onPress={handleRecordVoice}
          >
            <Mic size={32} color={colors.warning} />
            <Text style={styles.quickShareButtonText}>{i18n.t('quickShare.quickVoice')}</Text>
          </TouchableOpacity>
        </View>

        {quickShareType === 'text' && (
          <View style={styles.quickTextInput}>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background.secondary, borderColor: colors.border.light, color: colors.text.primary }]}
              value={quickContent}
              onChangeText={setQuickContent}
              placeholder={i18n.t('quickShare.textPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity
              style={[styles.shareButton, { backgroundColor: colors.success }]}
              onPress={() => handleQuickShare('text', quickContent)}
            >
              <Zap size={20} color={colors.text.inverse} />
              <Text style={[styles.shareButtonText, { color: colors.text.inverse }]}>
                {i18n.t('quickShare.shareNow')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={[styles.addDetailsButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}
          onPress={() => {
            setShowQuickShare(false);
            setShowAddForm(true);
          }}
        >
          <Text style={[styles.addDetailsButtonText, { color: colors.text.secondary }]}>
            {i18n.t('quickShare.addDetails')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const EntryCard = ({ entry }: { entry: VaultEntry }) => (
    <View style={[styles.entryCard, { backgroundColor: colors.background.primary, borderColor: colors.successLight + '40' }]}>
      <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
        <View style={CommonStyles.row}>
          <View style={[styles.entryIcon, { backgroundColor: colors.background.secondary }]}>
            {entry.type === 'text' && <FileText size={20} color={colors.primary} />}
            {entry.type === 'photo' && <Camera size={20} color={colors.secondary} />}
            {entry.type === 'voice' && <Mic size={20} color={colors.warning} />}
          </View>
          <View style={styles.entryInfo}>
            <Text style={[styles.entryTitle, { color: colors.text.primary }]}>{entry.title}</Text>
            {entry.description && (
              <Text style={[styles.entryDescription, { color: colors.text.secondary }]}>{entry.description}</Text>
            )}
            <Text style={[styles.entryDate, { color: colors.text.secondary }]}>Shared: {formatDate(entry.createdAt)}</Text>
            <Text style={[styles.expiryDate, { color: colors.success }]}>Available until: {formatDate(entry.expiresAt!)}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.deleteButton, { backgroundColor: colors.dangerLight + '20' }]}
          onPress={() => handleDeleteEntry(entry.id)}
        >
          <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Remove</Text>
        </TouchableOpacity>
      </View>
      
      <View style={[styles.entryContent, { borderTopColor: colors.border.light }]}>
        {entry.type === 'text' && (
          <Text style={[styles.textContent, { color: colors.text.secondary }]}>{entry.content}</Text>
        )}
        {entry.type === 'photo' && (
          <Image source={{ uri: entry.content }} style={[styles.photoContent, { backgroundColor: colors.background.secondary }]} />
        )}
        {entry.type === 'voice' && (
          <View style={[styles.voiceContent, { backgroundColor: colors.background.secondary }]}>
            <Mic size={24} color={colors.warning} />
            <Text style={[styles.voiceText, { color: colors.text.secondary }]}>Voice Recording</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.shareInfo, { borderTopColor: colors.border.light }]}>
        <Share size={16} color={colors.success} />
        <Text style={[styles.shareText, { color: colors.success }]}>Visible to emergency contacts</Text>
      </View>
    </View>
  );

  if (showAddForm) {
    return (
      <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <View style={styles.header}>
            <Text style={[CommonStyles.header, { color: colors.text.primary }]}>Share Safety Content</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <View style={[styles.warningCard, { backgroundColor: colors.warningLight + '20', borderColor: colors.warningLight + '40' }]}>
              <Users size={20} color={colors.warning} />
              <Text style={[styles.warningText, { color: colors.warning }]}>
                This content will be visible to your emergency contacts and available for 30 days.
              </Text>
            </View>

            <View style={styles.typeSelector}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Content Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.background.secondary, borderColor: colors.border.light },
                    newEntry.type === 'text' && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, type: 'text' })}
                >
                  <FileText size={20} color={newEntry.type === 'text' ? colors.text.inverse : colors.text.secondary} />
                  <Text style={[
                    styles.typeButtonText,
                    { color: colors.text.secondary },
                    newEntry.type === 'text' && { color: colors.text.inverse }
                  ]}>
                    Text
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.background.secondary, borderColor: colors.border.light },
                    newEntry.type === 'photo' && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, type: 'photo' })}
                >
                  <Camera size={20} color={newEntry.type === 'photo' ? colors.text.inverse : colors.text.secondary} />
                  <Text style={[
                    styles.typeButtonText,
                    { color: colors.text.secondary },
                    newEntry.type === 'photo' && { color: colors.text.inverse }
                  ]}>
                    Photo
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.background.secondary, borderColor: colors.border.light },
                    newEntry.type === 'voice' && { backgroundColor: colors.success, borderColor: colors.success }
                  ]}
                  onPress={() => setNewEntry({ ...newEntry, type: 'voice' })}
                >
                  <Mic size={20} color={newEntry.type === 'voice' ? colors.text.inverse : colors.text.secondary} />
                  <Text style={[
                    styles.typeButtonText,
                    { color: colors.text.secondary },
                    newEntry.type === 'voice' && { color: colors.text.inverse }
                  ]}>
                    Voice
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>{i18n.t('quickShare.title')}</Text>
              <TextInput
                style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                value={newEntry.title}
                onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
                placeholder={i18n.t('quickShare.titlePlaceholder')}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>{i18n.t('quickShare.description')} (Optional)</Text>
              <TextInput
                style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                value={newEntry.description}
                onChangeText={(text) => setNewEntry({ ...newEntry, description: text })}
                placeholder={i18n.t('quickShare.descriptionPlaceholder')}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Content</Text>
              {newEntry.type === 'text' ? (
                <TextInput
                  style={[CommonStyles.input, styles.textArea, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                  value={newEntry.content}
                  onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
                  placeholder="Enter your safety note..."
                  placeholderTextColor={colors.text.tertiary}
                  multiline
                  numberOfLines={4}
                />
              ) : (
                <TouchableOpacity style={[styles.mediaButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
                  <Text style={[styles.mediaButtonText, { color: colors.text.secondary }]}>
                    {newEntry.type === 'photo' ? 'Take Photo' : 'Record Voice'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[CommonStyles.button, { backgroundColor: colors.primary }]}
              onPress={handleAddEntry}
            >
              <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>
                {i18n.t('quickShare.shareContent')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <View>
            <Text style={[CommonStyles.header, { color: colors.text.primary }]}>Shared Vault</Text>
            <Text style={[CommonStyles.body, { color: colors.text.secondary }]}>Content visible to emergency contacts</Text>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.success }]} 
            onPress={() => setShowQuickShare(true)}
          >
            <Plus size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.successLight + '20', borderColor: colors.successLight + '40' }]}>
          <Share size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.success }]}>
            Shared content is available to emergency contacts for 30 days and can help if you feel unsafe.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Share size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No shared content yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
                Share photos, voice notes, or text when you feel uneasy but don't want to trigger SOS
              </Text>
              <TouchableOpacity
                style={[CommonStyles.button, styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowQuickShare(true)}
              >
                <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>Share First Content</Text>
              </TouchableOpacity>
            </View>
          ) : (
            entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))
          )}
        </ScrollView>

        {showQuickShare && <QuickShareModal />}
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  
  warningText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  entryCard: {
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
  
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  entryInfo: {
    flex: 1,
  },
  
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  entryDescription: {
    fontSize: 14,
    marginBottom: 4,
  },
  
  entryDate: {
    fontSize: 12,
  },
  
  expiryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  
  deleteButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  entryContent: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  
  textContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  
  photoContent: {
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
  
  shareInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  
  shareText: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '600',
  },
  
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
  },
  
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  emptyButton: {
    marginTop: 20,
    paddingVertical: 16,
  },
  
  formContent: {
    flex: 1,
    padding: 20,
  },
  
  typeSelector: {
    marginBottom: 24,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  typeButton: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  
  typeButtonText: {
    fontSize: 14,
    marginTop: 8,
    fontWeight: '600',
  },
  
  inputGroup: {
    marginBottom: 20,
  },
  
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  
  mediaButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  
  mediaButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  buttonContainer: {
    padding: 20,
  },

  // Quick Share Modal Styles
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

  quickShareModal: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },

  modalClose: {
    fontSize: 16,
    fontWeight: '600',
  },

  quickShareButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 24,
  },

  quickShareButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    minWidth: 80,
  },

  quickShareButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },

  quickTextInput: {
    marginBottom: 16,
  },

  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },

  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  addDetailsButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },

  addDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
