import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, Phone, Mail, Shield, CreditCard as Edit3, Save, X } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { StorageService } from '../../services/StorageService';
import { UserProfile } from '../../types';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const styles = createStyles(colors);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await StorageService.getUserProfile();
      if (savedProfile) {
        setProfile(savedProfile);
        setEditForm({
          name: savedProfile.name || '',
          phone: savedProfile.phone || '',
          email: savedProfile.email || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form to original values when canceling
      if (profile) {
        setEditForm({
          name: profile.name || '',
          phone: profile.phone || '',
          email: profile.email || '',
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!editForm.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!editForm.phone.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return;
    }

    if (!editForm.email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editForm.email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      let updatedProfile: UserProfile;
      
      if (profile) {
        // Update existing profile
        updatedProfile = {
          ...profile,
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
        };
      } else {
        // Create new profile
        updatedProfile = {
          id: Date.now().toString(),
          name: editForm.name.trim(),
          phone: editForm.phone.trim(),
          email: editForm.email.trim(),
          emergencyContacts: [],
          settings: {
            voiceCommandEnabled: true,
            voiceCommand: 'emergency help',
            autoPhotoCapture: true,
            autoVideoRecording: false,
            locationSharingEnabled: true,
            dataRetentionDays: 7,
            emergencyMode: false,
            locationTrackingMode: 'manual',
            speedDetectionEnabled: true,
            speedThreshold: 50,
            whatsappIntegrationEnabled: true,
          },
          createdAt: new Date().toISOString(),
        };
      }

      // Save to storage
      await StorageService.saveUserProfile(updatedProfile);
      
      // Update local state
      setProfile(updatedProfile);
      setIsEditing(false);
      
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const StatCard = ({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) => (
    <View style={[styles.statCard, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
      <View style={[styles.statIcon, { backgroundColor: colors.background.secondary }]}>
        {icon}
      </View>
      <Text style={[styles.statValue, { color: colors.text.primary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.text.secondary }]}>{title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <Text style={[CommonStyles.header, { color: colors.text.primary }]}>Profile</Text>
          <TouchableOpacity style={styles.editButton} onPress={handleEditToggle} disabled={isLoading}>
            {isEditing ? (
              <X size={24} color={colors.text.secondary} />
            ) : (
              <Edit3 size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Info */}
          <View style={styles.profileSection}>
            <View style={[styles.avatar, { backgroundColor: colors.background.secondary, borderColor: colors.primary }]}>
              <User size={48} color={colors.text.secondary} />
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Full Name *</Text>
                  <TextInput
                    style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.text.tertiary}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Phone Number *</Text>
                  <TextInput
                    style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                    value={editForm.phone}
                    onChangeText={(text) => setEditForm({ ...editForm, phone: text })}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                    placeholderTextColor={colors.text.tertiary}
                    editable={!isLoading}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.text.primary }]}>Email Address *</Text>
                  <TextInput
                    style={[CommonStyles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                    value={editForm.email}
                    onChangeText={(text) => setEditForm({ ...editForm, email: text })}
                    placeholder="Enter your email address"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={colors.text.tertiary}
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity 
                  style={[
                    CommonStyles.button, 
                    { backgroundColor: colors.primary },
                    isLoading && { backgroundColor: colors.border.medium }
                  ]} 
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Save size={20} color={colors.text.inverse} />
                  <Text style={[CommonStyles.buttonText, { marginLeft: 8, color: colors.text.inverse }]}>
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: colors.text.primary }]}>
                  {profile?.name || 'Your Name'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.text.secondary }]}>
                  {profile?.email || 'your.email@example.com'}
                </Text>
                <Text style={[styles.profilePhone, { color: colors.text.secondary }]}>
                  {profile?.phone || '+1 (555) 123-4567'}
                </Text>
                
                {profile?.createdAt && (
                  <Text style={[styles.memberSince, { color: colors.text.tertiary }]}>
                    Member since {new Date(profile.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Stats */}
          {!isEditing && (
            <View style={styles.statsSection}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Safety Stats</Text>
              
              <View style={styles.statsGrid}>
                <StatCard
                  title="Emergency Contacts"
                  value={profile?.emergencyContacts?.length?.toString() || '0'}
                  icon={<User size={24} color={colors.primary} />}
                />
                <StatCard
                  title="Data Retention"
                  value={`${profile?.settings?.dataRetentionDays || 7} days`}
                  icon={<Shield size={24} color={colors.secondary} />}
                />
              </View>
            </View>
          )}

          {/* Safety Features */}
          {!isEditing && (
            <View style={styles.featuresSection}>
              <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Safety Features</Text>
              
              <View style={[styles.featureItem, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.background.secondary }]}>
                  <Shield size={20} color={colors.success} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.text.primary }]}>Emergency SOS</Text>
                  <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                    Quickly alert emergency contacts with your location
                  </Text>
                </View>
                <View style={[styles.featureStatus, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.featureStatusText, { color: colors.success }]}>Active</Text>
                </View>
              </View>

              <View style={[styles.featureItem, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.background.secondary }]}>
                  <Phone size={20} color={colors.primary} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.text.primary }]}>Voice Commands</Text>
                  <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                    Activate emergency mode with voice commands
                  </Text>
                </View>
                <View style={[styles.featureStatus, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.featureStatusText, { color: colors.success }]}>
                    {profile?.settings?.voiceCommandEnabled ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={[styles.featureItem, { backgroundColor: colors.background.primary, borderColor: colors.border.light }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.background.secondary }]}>
                  <Mail size={20} color={colors.warning} />
                </View>
                <View style={styles.featureInfo}>
                  <Text style={[styles.featureTitle, { color: colors.text.primary }]}>Location Sharing</Text>
                  <Text style={[styles.featureDescription, { color: colors.text.secondary }]}>
                    Share real-time location with trusted contacts
                  </Text>
                </View>
                <View style={[styles.featureStatus, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.featureStatusText, { color: colors.success }]}>
                    {profile?.settings?.locationSharingEnabled ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
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
  
  editButton: {
    padding: 8,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 32,
  },
  
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 3,
  },
  
  profileInfo: {
    alignItems: 'center',
  },
  
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  
  profileEmail: {
    fontSize: 16,
    marginBottom: 4,
  },
  
  profilePhone: {
    fontSize: 16,
    marginBottom: 12,
  },
  
  memberSince: {
    fontSize: 14,
  },
  
  editForm: {
    width: '100%',
    maxWidth: 300,
  },
  
  inputGroup: {
    marginBottom: 16,
  },
  
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  statsSection: {
    marginBottom: 32,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
  },
  
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  
  statTitle: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  featuresSection: {
    marginBottom: 32,
  },
  
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  featureInfo: {
    flex: 1,
  },
  
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  
  featureDescription: {
    fontSize: 14,
  },
  
  featureStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  
  featureStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
