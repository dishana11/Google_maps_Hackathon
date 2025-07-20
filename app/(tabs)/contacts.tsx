import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Search, Globe } from 'lucide-react-native';
import { ContactCard } from '../../components/ContactCard';
import { useTheme } from '../../contexts/ThemeContext';
import { CommonStyles } from '../../constants/Styles';
import { StorageService } from '../../services/StorageService';
import { EmergencyContact } from '../../types';
import i18n from '../../localization/i18n';

const COUNTRY_CODES = [
  // North America
  { code: '+1', country: 'US/CA', flag: '🇺🇸', name: 'United States / Canada' },
  
  // Europe
  { code: '+44', country: 'UK', flag: '🇬🇧', name: 'United Kingdom' },
  { code: '+33', country: 'FR', flag: '🇫🇷', name: 'France' },
  { code: '+49', country: 'DE', flag: '🇩🇪', name: 'Germany' },
  { code: '+39', country: 'IT', flag: '🇮🇹', name: 'Italy' },
  { code: '+34', country: 'ES', flag: '🇪🇸', name: 'Spain' },
  { code: '+351', country: 'PT', flag: '🇵🇹', name: 'Portugal' },
  { code: '+31', country: 'NL', flag: '🇳🇱', name: 'Netherlands' },
  { code: '+32', country: 'BE', flag: '🇧🇪', name: 'Belgium' },
  { code: '+41', country: 'CH', flag: '🇨🇭', name: 'Switzerland' },
  { code: '+43', country: 'AT', flag: '🇦🇹', name: 'Austria' },
  { code: '+45', country: 'DK', flag: '🇩🇰', name: 'Denmark' },
  { code: '+46', country: 'SE', flag: '🇸🇪', name: 'Sweden' },
  { code: '+47', country: 'NO', flag: '🇳🇴', name: 'Norway' },
  { code: '+358', country: 'FI', flag: '🇫🇮', name: 'Finland' },
  { code: '+7', country: 'RU', flag: '🇷🇺', name: 'Russia' },
  { code: '+48', country: 'PL', flag: '🇵🇱', name: 'Poland' },
  { code: '+420', country: 'CZ', flag: '🇨🇿', name: 'Czech Republic' },
  { code: '+421', country: 'SK', flag: '🇸🇰', name: 'Slovakia' },
  { code: '+36', country: 'HU', flag: '🇭🇺', name: 'Hungary' },
  { code: '+40', country: 'RO', flag: '🇷🇴', name: 'Romania' },
  { code: '+359', country: 'BG', flag: '🇧🇬', name: 'Bulgaria' },
  { code: '+385', country: 'HR', flag: '🇭🇷', name: 'Croatia' },
  { code: '+381', country: 'RS', flag: '🇷🇸', name: 'Serbia' },
  { code: '+386', country: 'SI', flag: '🇸🇮', name: 'Slovenia' },
  { code: '+372', country: 'EE', flag: '🇪🇪', name: 'Estonia' },
  { code: '+371', country: 'LV', flag: '🇱🇻', name: 'Latvia' },
  { code: '+370', country: 'LT', flag: '🇱🇹', name: 'Lithuania' },
  { code: '+380', country: 'UA', flag: '🇺🇦', name: 'Ukraine' },
  { code: '+375', country: 'BY', flag: '🇧🇾', name: 'Belarus' },
  { code: '+389', country: 'MK', flag: '🇲🇰', name: 'North Macedonia' },
  { code: '+355', country: 'AL', flag: '🇦🇱', name: 'Albania' },
  { code: '+356', country: 'MT', flag: '🇲🇹', name: 'Malta' },
  { code: '+354', country: 'IS', flag: '🇮🇸', name: 'Iceland' },
  { code: '+353', country: 'IE', flag: '🇮🇪', name: 'Ireland' },
  
  // Asia
  { code: '+86', country: 'CN', flag: '🇨🇳', name: 'China' },
  { code: '+81', country: 'JP', flag: '🇯🇵', name: 'Japan' },
  { code: '+82', country: 'KR', flag: '🇰🇷', name: 'South Korea' },
  { code: '+91', country: 'IN', flag: '🇮🇳', name: 'India' },
  { code: '+92', country: 'PK', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+880', country: 'BD', flag: '🇧🇩', name: 'Bangladesh' },
  { code: '+94', country: 'LK', flag: '🇱🇰', name: 'Sri Lanka' },
  { code: '+977', country: 'NP', flag: '🇳🇵', name: 'Nepal' },
  { code: '+975', country: 'BT', flag: '🇧🇹', name: 'Bhutan' },
  { code: '+960', country: 'MV', flag: '🇲🇻', name: 'Maldives' },
  { code: '+65', country: 'SG', flag: '🇸🇬', name: 'Singapore' },
  { code: '+60', country: 'MY', flag: '🇲🇾', name: 'Malaysia' },
  { code: '+66', country: 'TH', flag: '🇹🇭', name: 'Thailand' },
  { code: '+84', country: 'VN', flag: '🇻🇳', name: 'Vietnam' },
  { code: '+63', country: 'PH', flag: '🇵🇭', name: 'Philippines' },
  { code: '+62', country: 'ID', flag: '🇮🇩', name: 'Indonesia' },
  { code: '+673', country: 'BN', flag: '🇧🇳', name: 'Brunei' },
  { code: '+856', country: 'LA', flag: '🇱🇦', name: 'Laos' },
  { code: '+855', country: 'KH', flag: '🇰🇭', name: 'Cambodia' },
  { code: '+95', country: 'MM', flag: '🇲🇲', name: 'Myanmar' },
  { code: '+98', country: 'IR', flag: '🇮🇷', name: 'Iran' },
  { code: '+964', country: 'IQ', flag: '🇮🇶', name: 'Iraq' },
  { code: '+90', country: 'TR', flag: '🇹🇷', name: 'Turkey' },
  { code: '+972', country: 'IL', flag: '🇮🇱', name: 'Israel' },
  { code: '+961', country: 'LB', flag: '🇱🇧', name: 'Lebanon' },
  { code: '+963', country: 'SY', flag: '🇸🇾', name: 'Syria' },
  { code: '+962', country: 'JO', flag: '🇯🇴', name: 'Jordan' },
  { code: '+970', country: 'PS', flag: '🇵🇸', name: 'Palestine' },
  { code: '+996', country: 'KG', flag: '🇰🇬', name: 'Kyrgyzstan' },
  { code: '+998', country: 'UZ', flag: '🇺🇿', name: 'Uzbekistan' },
  { code: '+992', country: 'TJ', flag: '🇹🇯', name: 'Tajikistan' },
  { code: '+993', country: 'TM', flag: '🇹🇲', name: 'Turkmenistan' },
  { code: '+7', country: 'KZ', flag: '🇰🇿', name: 'Kazakhstan' },
  { code: '+976', country: 'MN', flag: '🇲🇳', name: 'Mongolia' },
  { code: '+852', country: 'HK', flag: '🇭🇰', name: 'Hong Kong' },
  { code: '+853', country: 'MO', flag: '🇲🇴', name: 'Macau' },
  { code: '+886', country: 'TW', flag: '🇹🇼', name: 'Taiwan' },
  
  // Middle East
  { code: '+971', country: 'AE', flag: '🇦🇪', name: 'United Arab Emirates' },
  { code: '+966', country: 'SA', flag: '🇸🇦', name: 'Saudi Arabia' },
  { code: '+974', country: 'QA', flag: '🇶🇦', name: 'Qatar' },
  { code: '+973', country: 'BH', flag: '🇧🇭', name: 'Bahrain' },
  { code: '+965', country: 'KW', flag: '🇰🇼', name: 'Kuwait' },
  { code: '+968', country: 'OM', flag: '🇴🇲', name: 'Oman' },
  { code: '+967', country: 'YE', flag: '🇾🇪', name: 'Yemen' },
  
  // Oceania
  { code: '+61', country: 'AU', flag: '🇦🇺', name: 'Australia' },
  { code: '+64', country: 'NZ', flag: '🇳🇿', name: 'New Zealand' },
  { code: '+679', country: 'FJ', flag: '🇫🇯', name: 'Fiji' },
  { code: '+685', country: 'WS', flag: '🇼🇸', name: 'Samoa' },
  { code: '+676', country: 'TO', flag: '🇹🇴', name: 'Tonga' },
  { code: '+678', country: 'VU', flag: '🇻🇺', name: 'Vanuatu' },
  { code: '+687', country: 'NC', flag: '🇳🇨', name: 'New Caledonia' },
  { code: '+689', country: 'PF', flag: '🇵🇫', name: 'French Polynesia' },
  
  // South America
  { code: '+55', country: 'BR', flag: '🇧🇷', name: 'Brazil' },
  { code: '+52', country: 'MX', flag: '🇲🇽', name: 'Mexico' },
  { code: '+54', country: 'AR', flag: '🇦🇷', name: 'Argentina' },
  { code: '+56', country: 'CL', flag: '🇨🇱', name: 'Chile' },
  { code: '+57', country: 'CO', flag: '🇨🇴', name: 'Colombia' },
  { code: '+51', country: 'PE', flag: '🇵🇪', name: 'Peru' },
  { code: '+58', country: 'VE', flag: '🇻🇪', name: 'Venezuela' },
  { code: '+593', country: 'EC', flag: '🇪🇨', name: 'Ecuador' },
  { code: '+591', country: 'BO', flag: '🇧🇴', name: 'Bolivia' },
  { code: '+595', country: 'PY', flag: '🇵🇾', name: 'Paraguay' },
  { code: '+598', country: 'UY', flag: '🇺🇾', name: 'Uruguay' },
  { code: '+597', country: 'SR', flag: '🇸🇷', name: 'Suriname' },
  { code: '+592', country: 'GY', flag: '🇬🇾', name: 'Guyana' },
  { code: '+594', country: 'GF', flag: '🇬🇫', name: 'French Guiana' },
  
  // Africa
  { code: '+27', country: 'ZA', flag: '🇿🇦', name: 'South Africa' },
  { code: '+20', country: 'EG', flag: '🇪🇬', name: 'Egypt' },
  { code: '+234', country: 'NG', flag: '🇳🇬', name: 'Nigeria' },
  { code: '+254', country: 'KE', flag: '🇰🇪', name: 'Kenya' },
  { code: '+255', country: 'TZ', flag: '🇹🇿', name: 'Tanzania' },
  { code: '+256', country: 'UG', flag: '🇺🇬', name: 'Uganda' },
  { code: '+250', country: 'RW', flag: '🇷🇼', name: 'Rwanda' },
  { code: '+257', country: 'BI', flag: '🇧🇮', name: 'Burundi' },
  { code: '+251', country: 'ET', flag: '🇪🇹', name: 'Ethiopia' },
  { code: '+252', country: 'SO', flag: '🇸🇴', name: 'Somalia' },
  { code: '+253', country: 'DJ', flag: '🇩🇯', name: 'Djibouti' },
  { code: '+291', country: 'ER', flag: '🇪🇷', name: 'Eritrea' },
  { code: '+249', country: 'SD', flag: '🇸🇩', name: 'Sudan' },
  { code: '+211', country: 'SS', flag: '🇸🇸', name: 'South Sudan' },
  { code: '+218', country: 'LY', flag: '🇱🇾', name: 'Libya' },
  { code: '+216', country: 'TN', flag: '🇹🇳', name: 'Tunisia' },
  { code: '+213', country: 'DZ', flag: '🇩🇿', name: 'Algeria' },
  { code: '+212', country: 'MA', flag: '🇲🇦', name: 'Morocco' },
  { code: '+221', country: 'SN', flag: '🇸🇳', name: 'Senegal' },
  { code: '+223', country: 'ML', flag: '🇲🇱', name: 'Mali' },
  { code: '+226', country: 'BF', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: '+227', country: 'NE', flag: '🇳🇪', name: 'Niger' },
  { code: '+235', country: 'TD', flag: '🇹🇩', name: 'Chad' },
  { code: '+236', country: 'CF', flag: '🇨🇫', name: 'Central African Republic' },
  { code: '+237', country: 'CM', flag: '🇨🇲', name: 'Cameroon' },
  { code: '+240', country: 'GQ', flag: '🇬🇶', name: 'Equatorial Guinea' },
  { code: '+241', country: 'GA', flag: '🇬🇦', name: 'Gabon' },
  { code: '+242', country: 'CG', flag: '🇨🇬', name: 'Republic of the Congo' },
  { code: '+243', country: 'CD', flag: '🇨🇩', name: 'Democratic Republic of the Congo' },
  { code: '+244', country: 'AO', flag: '🇦🇴', name: 'Angola' },
  { code: '+260', country: 'ZM', flag: '🇿🇲', name: 'Zambia' },
  { code: '+263', country: 'ZW', flag: '🇿🇼', name: 'Zimbabwe' },
  { code: '+264', country: 'NA', flag: '🇳🇦', name: 'Namibia' },
  { code: '+267', country: 'BW', flag: '🇧🇼', name: 'Botswana' },
  { code: '+268', country: 'SZ', flag: '🇸🇿', name: 'Eswatini' },
  { code: '+266', country: 'LS', flag: '🇱🇸', name: 'Lesotho' },
  { code: '+261', country: 'MG', flag: '🇲🇬', name: 'Madagascar' },
  { code: '+230', country: 'MU', flag: '🇲🇺', name: 'Mauritius' },
  { code: '+248', country: 'SC', flag: '🇸🇨', name: 'Seychelles' },
  { code: '+269', country: 'KM', flag: '🇰🇲', name: 'Comoros' },
  { code: '+262', country: 'RE', flag: '🇷🇪', name: 'Réunion' },
  { code: '+290', country: 'SH', flag: '🇸🇭', name: 'Saint Helena' },
  
  // Caribbean
  { code: '+1242', country: 'BS', flag: '🇧🇸', name: 'Bahamas' },
  { code: '+1246', country: 'BB', flag: '🇧🇧', name: 'Barbados' },
  { code: '+1284', country: 'VG', flag: '🇻🇬', name: 'British Virgin Islands' },
  { code: '+1345', country: 'KY', flag: '🇰🇾', name: 'Cayman Islands' },
  { code: '+53', country: 'CU', flag: '🇨🇺', name: 'Cuba' },
  { code: '+1767', country: 'DM', flag: '🇩🇲', name: 'Dominica' },
  { code: '+1809', country: 'DO', flag: '🇩🇴', name: 'Dominican Republic' },
  { code: '+1473', country: 'GD', flag: '🇬🇩', name: 'Grenada' },
  { code: '+509', country: 'HT', flag: '🇭🇹', name: 'Haiti' },
  { code: '+1876', country: 'JM', flag: '🇯🇲', name: 'Jamaica' },
  { code: '+1664', country: 'MS', flag: '🇲🇸', name: 'Montserrat' },
  { code: '+1787', country: 'PR', flag: '🇵🇷', name: 'Puerto Rico' },
  { code: '+1869', country: 'KN', flag: '🇰🇳', name: 'Saint Kitts and Nevis' },
  { code: '+1758', country: 'LC', flag: '🇱🇨', name: 'Saint Lucia' },
  { code: '+1784', country: 'VC', flag: '🇻🇨', name: 'Saint Vincent and the Grenadines' },
  { code: '+1868', country: 'TT', flag: '🇹🇹', name: 'Trinidad and Tobago' },
  { code: '+1649', country: 'TC', flag: '🇹🇨', name: 'Turks and Caicos Islands' },
  { code: '+1340', country: 'VI', flag: '🇻🇮', name: 'U.S. Virgin Islands' },
];

// Helper function to extract country code from phone number
const extractCountryCode = (phoneNumber: string): string => {
  if (!phoneNumber) return '+1';
  
  // Remove any spaces and ensure it starts with +
  const cleanNumber = phoneNumber.replace(/\s+/g, '');
  if (!cleanNumber.startsWith('+')) return '+1';
  
  // Sort by length (longest first) to match longer codes first
  const sortedCodes = COUNTRY_CODES.sort((a, b) => b.code.length - a.code.length);
  
  for (const country of sortedCodes) {
    if (cleanNumber.startsWith(country.code)) {
      return country.code;
    }
  }
  return '+1'; // Default fallback
};

// Helper function to remove country code from phone number
const removeCountryCode = (phoneNumber: string, countryCode: string): string => {
  if (!phoneNumber) return '';
  const cleanNumber = phoneNumber.replace(/\s+/g, '');
  if (cleanNumber.startsWith(countryCode)) {
    return cleanNumber.substring(countryCode.length);
  }
  return cleanNumber.replace(/^\+/, ''); // Remove + if present
};

export default function ContactsScreen() {
  const { colors } = useTheme();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('+1');
  const [whatsappCountryCode, setWhatsappCountryCode] = useState('+1');
  const [currentField, setCurrentField] = useState<'phone' | 'whatsapp'>('phone');

  const styles = createStyles(colors);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const savedContacts = await StorageService.getEmergencyContacts();
    setContacts(savedContacts);
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phone.includes(searchQuery) ||
    contact.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter countries based on search query
  const filteredCountries = COUNTRY_CODES.filter(country =>
    country.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    country.country.toLowerCase().includes(countrySearchQuery.toLowerCase()) ||
    country.code.includes(countrySearchQuery)
  );

  const handleAddContact = () => {
    setEditingContact(null);
    setSelectedCountryCode('+1');
    setWhatsappCountryCode('+1');
    setShowAddForm(true);
  };

  const handleEditContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    
    // Extract country codes from existing phone numbers
    const phoneCountryCode = extractCountryCode(contact.phone);
    const whatsappCode = contact.whatsappNumber ? extractCountryCode(contact.whatsappNumber) : '+1';
    
    setSelectedCountryCode(phoneCountryCode);
    setWhatsappCountryCode(whatsappCode);
    setShowAddForm(true);
  };

  const handleDeleteContact = (contactId: string) => {
    Alert.alert(
      i18n.t('contacts.deleteContact'),
      i18n.t('contacts.deleteContactConfirm'),
      [
        { text: i18n.t('common.cancel'), style: 'cancel' },
        {
          text: i18n.t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            const updatedContacts = contacts.filter(c => c.id !== contactId);
            setContacts(updatedContacts);
            await StorageService.saveEmergencyContacts(updatedContacts);
          },
        },
      ]
    );
  };

  const openCountryPicker = (field: 'phone' | 'whatsapp') => {
    setCurrentField(field);
    setCountrySearchQuery('');
    setShowCountryPicker(true);
  };

  const selectCountryCode = (code: string) => {
    if (currentField === 'phone') {
      setSelectedCountryCode(code);
    } else {
      setWhatsappCountryCode(code);
    }
    setShowCountryPicker(false);
    setCountrySearchQuery('');
  };

  const CountryPickerModal = () => (
    <Modal visible={showCountryPicker} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.countryPickerModal, { backgroundColor: colors.background.primary }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border.light }]}>
            <Text style={[styles.modalTitle, { color: colors.text.primary }]}>
              {i18n.t('contacts.countryCode')} ({COUNTRY_CODES.length} countries)
            </Text>
            <TouchableOpacity onPress={() => {
              setShowCountryPicker(false);
              setCountrySearchQuery('');
            }}>
              <Text style={[styles.modalClose, { color: colors.primary }]}>
                {i18n.t('common.cancel')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={[styles.searchContainer, { borderBottomColor: colors.border.light }]}>
            <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
              <Search size={20} color={colors.text.tertiary} />
              <TextInput
                style={[styles.searchInput, { color: colors.text.primary }]}
                placeholder="Search countries..."
                value={countrySearchQuery}
                onChangeText={setCountrySearchQuery}
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
          
          <ScrollView style={styles.countryList}>
            {filteredCountries.map((country) => (
              <TouchableOpacity
                key={`${country.code}-${country.country}`}
                style={[styles.countryItem, { borderBottomColor: colors.border.light }]}
                onPress={() => selectCountryCode(country.code)}
              >
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <View style={styles.countryInfo}>
                  <Text style={[styles.countryName, { color: colors.text.primary }]}>
                    {country.name}
                  </Text>
                  <Text style={[styles.countryCode, { color: colors.text.secondary }]}>
                    {country.code}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            {filteredCountries.length === 0 && (
              <View style={styles.noResultsContainer}>
                <Text style={[styles.noResultsText, { color: colors.text.secondary }]}>
                  No countries found matching "{countrySearchQuery}"
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (showAddForm) {
    return (
      <ContactForm
        contact={editingContact}
        onSave={async (contactData) => {
          if (!contactData.name || !contactData.phone || !contactData.relationship) {
            Alert.alert(i18n.t('common.error'), i18n.t('contacts.fillAllFields'));
            return;
          }

          let updatedContacts: EmergencyContact[];

          if (editingContact) {
            updatedContacts = contacts.map(contact =>
              contact.id === editingContact.id
                ? { ...contact, ...contactData }
                : contact
            );
          } else {
            const newContact: EmergencyContact = {
              id: Date.now().toString(),
              name: contactData.name!,
              phone: contactData.phone!,
              email: contactData.email || '',
              whatsappNumber: contactData.whatsappNumber || '',
              relationship: contactData.relationship!,
              isPrimary: contactData.isPrimary || false,
              createdAt: new Date().toISOString(),
            };
            updatedContacts = [...contacts, newContact];
          }

          setContacts(updatedContacts);
          await StorageService.saveEmergencyContacts(updatedContacts);
          setShowAddForm(false);
          setEditingContact(null);
          Alert.alert(i18n.t('common.success'), i18n.t('contacts.contactSaved'));
        }}
        onCancel={() => {
          setShowAddForm(false);
          setEditingContact(null);
        }}
        colors={colors}
        selectedCountryCode={selectedCountryCode}
        whatsappCountryCode={whatsappCountryCode}
        onOpenCountryPicker={openCountryPicker}
      />
    );
  }

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.container, { backgroundColor: colors.background.primary }]}>
        <View style={styles.header}>
          <Text style={[CommonStyles.header, { color: colors.text.primary }]}>
            {i18n.t('contacts.title')}
          </Text>
          <Text style={[CommonStyles.body, { color: colors.text.secondary }]}>
            {i18n.t('contacts.subtitle')}
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <View style={[styles.searchBar, { backgroundColor: colors.background.secondary }]}>
            <Search size={20} color={colors.text.tertiary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text.primary }]}
              placeholder={i18n.t('contacts.searchPlaceholder')}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: colors.primary }]} 
            onPress={handleAddContact}
          >
            <Plus size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text.secondary }]}>
                {searchQuery ? i18n.t('contacts.noContactsFound') : i18n.t('contacts.noContacts')}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={[CommonStyles.button, styles.emptyButton, { backgroundColor: colors.primary }]}
                  onPress={handleAddContact}
                >
                  <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>
                    {i18n.t('contacts.addFirstContact')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredContacts.map(contact => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onEdit={() => handleEditContact(contact)}
                onDelete={() => handleDeleteContact(contact.id)}
                colors={colors}
              />
            ))
          )}
        </ScrollView>

        <CountryPickerModal />
      </View>
    </SafeAreaView>
  );
}

interface ContactFormProps {
  contact: EmergencyContact | null;
  onSave: (contact: Partial<EmergencyContact>) => void;
  onCancel: () => void;
  colors: any;
  selectedCountryCode: string;
  whatsappCountryCode: string;
  onOpenCountryPicker: (field: 'phone' | 'whatsapp') => void;
}

function ContactForm({ 
  contact, 
  onSave, 
  onCancel, 
  colors, 
  selectedCountryCode, 
  whatsappCountryCode, 
  onOpenCountryPicker 
}: ContactFormProps) {
  const [name, setName] = useState(contact?.name || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(contact?.email || '');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [relationship, setRelationship] = useState(contact?.relationship || '');
  const [isPrimary, setIsPrimary] = useState(contact?.isPrimary || false);

  const styles = createStyles(colors);

  // Initialize phone numbers without country codes when editing
  useEffect(() => {
    if (contact) {
      // Remove country code from phone number for display
      const phoneWithoutCode = removeCountryCode(contact.phone, extractCountryCode(contact.phone));
      setPhone(phoneWithoutCode);
      
      if (contact.whatsappNumber) {
        const whatsappWithoutCode = removeCountryCode(contact.whatsappNumber, extractCountryCode(contact.whatsappNumber));
        setWhatsappNumber(whatsappWithoutCode);
      }
    }
  }, [contact]);

  const handleSave = () => {
    // Clean phone numbers and combine with country codes
    const cleanPhone = phone.replace(/^\+/, '').replace(/\s+/g, '');
    const cleanWhatsapp = whatsappNumber.replace(/^\+/, '').replace(/\s+/g, '');
    
    const fullPhone = selectedCountryCode + cleanPhone;
    const fullWhatsapp = cleanWhatsapp ? whatsappCountryCode + cleanWhatsapp : '';

    onSave({
      name,
      phone: fullPhone,
      email,
      whatsappNumber: fullWhatsapp,
      relationship,
      isPrimary,
    });
  };

  return (
    <SafeAreaView style={[CommonStyles.safeArea, { backgroundColor: colors.background.primary }]}>
      <View style={[styles.formContainer, { backgroundColor: colors.background.primary }]}>
        <View style={styles.formHeader}>
          <Text style={[CommonStyles.header, { color: colors.text.primary }]}>
            {contact ? i18n.t('contacts.editContact') : i18n.t('contacts.addContact')}
          </Text>
          <TouchableOpacity onPress={onCancel}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              {i18n.t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContent} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {i18n.t('contacts.name')} *
            </Text>
            <TextInput
              style={[CommonStyles.input, styles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
              value={name}
              onChangeText={setName}
              placeholder="Enter full name"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {i18n.t('contacts.phone')} *
            </Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={[styles.countryCodeButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.medium }]}
                onPress={() => onOpenCountryPicker('phone')}
              >
                <Globe size={16} color={colors.text.secondary} />
                <Text style={[styles.countryCodeText, { color: colors.text.primary }]}>
                  {selectedCountryCode}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[CommonStyles.input, styles.phoneInput, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                value={phone}
                onChangeText={setPhone}
                placeholder={i18n.t('contacts.phoneNumber')}
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {i18n.t('contacts.email')} ({i18n.t('contacts.optional')})
            </Text>
            <TextInput
              style={[CommonStyles.input, styles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email address"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {i18n.t('contacts.whatsapp')} ({i18n.t('contacts.optional')})
            </Text>
            <View style={styles.phoneInputContainer}>
              <TouchableOpacity
                style={[styles.countryCodeButton, { backgroundColor: colors.background.secondary, borderColor: colors.border.medium }]}
                onPress={() => onOpenCountryPicker('whatsapp')}
              >
                <Globe size={16} color={colors.text.secondary} />
                <Text style={[styles.countryCodeText, { color: colors.text.primary }]}>
                  {whatsappCountryCode}
                </Text>
              </TouchableOpacity>
              <TextInput
                style={[CommonStyles.input, styles.phoneInput, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                placeholder="WhatsApp number"
                keyboardType="phone-pad"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              {i18n.t('contacts.relationship')} *
            </Text>
            <TextInput
              style={[CommonStyles.input, styles.input, { backgroundColor: colors.background.primary, borderColor: colors.border.medium, color: colors.text.primary }]}
              value={relationship}
              onChangeText={setRelationship}
              placeholder={i18n.t('contacts.relationshipPlaceholder')}
              placeholderTextColor={colors.text.tertiary}
            />
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={() => setIsPrimary(!isPrimary)}
          >
            <View style={[styles.checkbox, { borderColor: colors.border.medium }, isPrimary && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {isPrimary && <Text style={[styles.checkmark, { color: colors.text.inverse }]}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.text.primary }]}>
              {i18n.t('contacts.primaryContact')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[CommonStyles.button, styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
          >
            <Text style={[CommonStyles.buttonText, { color: colors.text.inverse }]}>
              {contact ? 'Update' : i18n.t('common.save')} Contact
            </Text>
          </TouchableOpacity>
        </View>
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
  
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  
  emptyButton: {
    paddingVertical: 16,
  },
  
  formContainer: {
    flex: 1,
  },

  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },

  cancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  
  formContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  inputGroup: {
    marginBottom: 20,
  },
  
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  
  input: {
    fontSize: 16,
  },

  phoneInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  countryCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 80,
  },

  countryCodeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },

  phoneInput: {
    flex: 1,
    fontSize: 16,
  },
  
  checkboxContainer: {
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
  
  checkboxLabel: {
    fontSize: 16,
  },
  
  buttonContainer: {
    padding: 20,
  },
  
  saveButton: {
    paddingVertical: 16,
  },

  // Country Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },

  countryPickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
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
  },

  countryList: {
    flex: 1,
  },

  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },

  countryFlag: {
    fontSize: 24,
    marginRight: 12,
  },

  countryInfo: {
    flex: 1,
  },

  countryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  countryCode: {
    fontSize: 14,
  },

  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },

  noResultsText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
