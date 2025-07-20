import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Camera, Mic, FileText, Lock, Calendar, Flag, Share, Key, Copy, Eye, EyeOff, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { StorageService } from '../../services/StorageService';
import { VaultEntry } from '../../types';
import i18n from '../../localization/i18n';

export default function PrivateVaultScreen() {
  const { colors } = useTheme();
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAccessCodeModal, setShowAccessCodeModal] = useState(false);
  const [privateAccessCode, setPrivateAccessCode] = useState<string>('');
  const [showCode, setShowCode] = useState(false);
  const [newEntry, setNewEntry] = useState({
    type: 'text' as 'text' | 'photo' | 'voice',
    content: '',
    title: '',
    flagged: false,
  });

  const styles = createStyles(colors);

  useEffect(() => {
    loadEntries();
    loadPrivateAccessCode();
  }, []);

  const loadEntries = async () => {
    const privateEntries = await StorageService.getPrivateVaultEntries();
    setEntries(privateEntries);
  };

  const loadPrivateAccessCode = async () => {
    const code = await StorageService.getPrivateAccessCode();
    setPrivateAccessCode(code || '');
  };

  const generateNewAccessCode = async () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
    setPrivateAccessCode(newCode);
    await StorageService.savePrivateAccessCode(newCode);
    Alert.alert(
      'New Access Code Generated',
      'Your new private vault access code has been generated. Share this with trusted family members who should have access to your private data in emergencies.',
      [{ text: 'OK' }]
    );
  };

  const copyCodeToClipboard = () => {
    // For web, use the Clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(privateAccessCode);
      Alert.alert('Copied', 'Access code copied to clipboard');
    } else {
      Alert.alert('Access Code', `Your private access code is: ${privateAccessCode}`);
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
      flagged: newEntry.flagged,
      isPrivate: true,
      createdAt: new Date().toISOString(),
      expiresAt: newEntry.flagged ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const updatedEntries = [...entries, entry];
    setEntries(updatedEntries);
    await StorageService.savePrivateVaultEntries(updatedEntries);

    setNewEntry({ type: 'text', content: '', title: '', flagged: false });
    setShowAddForm(false);
  };

  const handleDeleteEntry = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedEntries = entries.filter(e => e.id !== entryId);
            setEntries(updatedEntries);
            await StorageService.savePrivateVaultEntries(updatedEntries);
          },
        },
      ]
    );
  };

  const handleToggleFlag = async (entryId: string) => {
    const updatedEntries = entries.map(entry => {
      if (entry.id === entryId) {
        return {
          ...entry,
          flagged: !entry.flagged,
          expiresAt: !entry.flagged ? undefined : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
      }
      return entry;
    });
    
    setEntries(updatedEntries);
    await StorageService.savePrivateVaultEntries(updatedEntries);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const AccessCodeModal = () => (
    <Modal visible={showAccessCodeModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.accessCodeModal, { backgroundColor: colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              Private Vault Access Code
            </Text>
            <TouchableOpacity onPress={() => setShowAccessCodeModal(false)}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.accessCodeInfo, { backgroundColor: colors.warningLight + '20', borderColor: colors.warningLight + '40' }]}>
            <Key size={24} color={colors.warning} />
            <Text style={[styles.accessCodeInfoText, { color: colors.warning }]}>
              This code allows emergency contacts to access your private vault data. Only share with trusted family members.
            </Text>
          </View>

          <View style={styles.codeSection}>
            <Text style={[styles.codeLabel, { color: colors.text.primary }]}>
              Current Access Code:
            </Text>
            
            <View style={[styles.codeContainer, { backgroundColor: colors.background.secondary, borderColor: colors.border.light }]}>
              <Text style={[styles.codeText, { color: colors.text.primary }]}>
                {showCode ? privateAccessCode : '••••••'}
              </Text>
              <TouchableOpacity
                style={styles.codeToggle}
                onPress={() => setShowCode(!showCode)}
              >
                {showCode ? (
                  <EyeOff size={20} color={colors.text.secondary} />
                ) : (
                  <Eye size={20} color={colors.text.secondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.codeActions}>
              <TouchableOpacity
                style={[styles.codeActionButton, { backgroundColor: colors.primary }]}
                onPress={copyCodeToClipboard}
              >
                <Copy size={16} color={colors.text.inverse} />
                <Text style={[styles.codeActionText, { color: colors.text.inverse }]}>
                  Copy Code
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.codeActionButton, { backgroundColor: colors.secondary }]}
                onPress={generateNewAccessCode}
              >
                <RefreshCw size={16} color={colors.text.inverse} />
                <Text style={[styles.codeActionText, { color: colors.text.inverse }]}>
                  Generate New
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.sharingInstructions, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '40' }]}>
            <Text style={[styles.instructionsTitle, { color: colors.primary }]}>
              How to share with family:
            </Text>
            <Text style={[styles.instructionsText, { color: colors.primary }]}>
              1. Copy the access code above{'\n'}
              2. Share it securely with trusted family members{'\n'}
              3. They can use it in the Emergency Access tab{'\n'}
              4. Generate a new code anytime to revoke access
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const EntryCard = ({ entry }: { entry: VaultEntry }) => (
    <View style={[styles.entryCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
      <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
        <View style={CommonStyles.row}>
          <View style={[styles.entryIcon, { backgroundColor: colors.background.secondary }]}>
            {entry.type === 'text' && <FileText size={20} color={colors.primary} />}
            {entry.type === 'photo' && <Camera size={20} color={colors.secondary} />}
            {entry.type === 'voice' && <Mic size={20} color={colors.warning} />}
          </View>
          <View style={styles.entryInfo}>
            <Text style={[styles.entryTitle, { color: colors.text.primary }]}>{entry.title}</Text>
            <Text style={[styles.entryDate, { color: colors.text.secondary }]}>Created: {formatDate(entry.createdAt)}</Text>
            {entry.expiresAt && (
              <Text style={[styles.expiryDate, { color: colors.warning }]}>Expires: {formatDate(entry.expiresAt)}</Text>
            )}
          </View>
        </View>
        
        <View style={CommonStyles.row}>
          <TouchableOpacity
            style={[styles.flagButton, entry.flagged && styles.flagButtonActive]}
            onPress={() => handleToggleFlag(entry.id)}
          >
            <Flag size={16} color={entry.flagged ? colors.text.inverse : colors.text.tertiary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.dangerLight + '20' }]}
            onPress={() => handleDeleteEntry(entry.id)}
          >
            <Text style={[styles.deleteButtonText, { color: colors.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
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
    </View>
  );

  if (showAddForm) {
    return (
      <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
        <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
          <View style={styles.header}>
            <Text style={[CommonStyles.header, { color: colors.text.primary }]}>Add Private Entry</Text>
            <TouchableOpacity onPress={() => setShowAddForm(false)}>
              <Text style={[styles.cancelText, { color: colors.primary }]}>{i18n.t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContent}>
            <View style={styles.typeSelector}>
              <Text style={[styles.label, { color: colors.text.primary }]}>Entry Type</Text>
              <View style={styles.typeButtons}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    { backgroundColor: colors.background.secondary, borderColor: colors.border.light },
                    newEntry.type === 'text' && { backgroundColor: colors.primary, borderColor: colors.primary }
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
                    newEntry.type === 'photo' && { backgroundColor: colors.primary, borderColor: colors.primary }
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
                    newEntry.type === 'voice' && { backgroundColor: colors.primary, borderColor: colors.primary }
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
              <Text style={[styles.label, { color: colors.text.primary }]}>Title</Text>
              <TextInput
                style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                value={newEntry.title}
                onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
                placeholder="Enter a title for this entry"
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
                  placeholder="Enter your private note..."
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

            <TouchableOpacity
              style={styles.flagToggle}
              onPress={() => setNewEntry({ ...newEntry, flagged: !newEntry.flagged })}
            >
              <View style={[
                styles.checkbox,
                { borderColor: colors.border.medium },
                newEntry.flagged && { backgroundColor: colors.warning, borderColor: colors.warning }
              ]}>
                {newEntry.flagged && <Text style={[styles.checkmark, { color: colors.text.inverse }]}>✓</Text>}
              </View>
              <Text style={[styles.flagToggleText, { color: colors.text.primary }]}>Keep after 7 days (flagged)</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[CommonStyles.button, { backgroundColor: colors.primary }]}
              onPress={handleAddEntry}
            >
              <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>Save Entry</Text>
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
            <Text style={[CommonStyles.header, { color: colors.text.primary }]}>Private Vault</Text>
            <Text style={[CommonStyles.body, { color: colors.text.secondary }]}>Your personal safety documentation</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={[styles.accessCodeButton, { backgroundColor: colors.warning }]} 
              onPress={() => setShowAccessCodeModal(true)}
            >
              <Key size={20} color={colors.text.inverse} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: colors.primary }]} 
              onPress={() => setShowAddForm(true)}
            >
              <Plus size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.primaryLight + '20', borderColor: colors.primaryLight + '40' }]}>
          <Lock size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.primary }]}>
            Private entries are only visible to you and auto-delete after 7 days unless flagged. Generate an access code to share with trusted family members for emergencies.
          </Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {entries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Lock size={48} color={colors.text.tertiary} />
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>No private entries yet</Text>
              <Text style={[styles.emptySubtext, { color: colors.text.tertiary }]}>
                Add photos, voice notes, or text entries for your personal safety documentation
              </Text>
              <TouchableOpacity
                style={[CommonStyles.button, styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>Add First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            entries.map(entry => (
              <EntryCard key={entry.id} entry={entry} />
            ))
          )}
        </ScrollView>

        <AccessCodeModal />
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

  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },

  accessCodeButton: {
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
  
  entryDate: {
    fontSize: 12,
  },
  
  expiryDate: {
    fontSize: 12,
    marginTop: 2,
  },
  
  flagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  
  flagButtonActive: {
    backgroundColor: colors.warning,
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
  
  flagToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  checkmark: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  flagToggleText: {
    fontSize: 16,
  },
  
  buttonContainer: {
    padding: 20,
  },

  // Access Code Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  accessCodeModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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

  accessCodeInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  accessCodeInfoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },

  codeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },

  codeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },

  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },

  codeText: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },

  codeToggle: {
    padding: 4,
  },

  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },

  codeActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },

  codeActionText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },

  sharingInstructions: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },

  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },

  instructionsText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
