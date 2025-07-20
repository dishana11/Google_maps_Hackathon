import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Phone, Mail, User, Star } from 'lucide-react-native';
import { CommonStyles } from '../constants/Styles';
import { EmergencyContact } from '../types';

interface ContactCardProps {
  contact: EmergencyContact;
  onPress?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  colors: any;
}

export function ContactCard({ contact, onPress, onEdit, onDelete, colors }: ContactCardProps) {
  const styles = createStyles(colors);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[CommonStyles.row, CommonStyles.spaceBetween]}>
        <View style={[CommonStyles.row, { flex: 1 }]}>
          <View style={styles.avatar}>
            <User size={24} color={colors.text.secondary} />
          </View>
          
          <View style={styles.info}>
            <View style={CommonStyles.row}>
              <Text style={styles.name}>{contact.name}</Text>
              {contact.isPrimary && (
                <Star size={16} color={colors.warning} fill={colors.warning} />
              )}
            </View>
            
            <Text style={styles.relationship}>{contact.relationship}</Text>
            
            <View style={styles.contactInfo}>
              <View style={[CommonStyles.row, { marginBottom: 4 }]}>
                <Phone size={14} color={colors.text.tertiary} />
                <Text style={styles.contactText}>{contact.phone}</Text>
              </View>
              
              {contact.email && (
                <View style={CommonStyles.row}>
                  <Mail size={14} color={colors.text.tertiary} />
                  <Text style={styles.contactText}>{contact.email}</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        
        {onEdit && (
          <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
            <Text style={styles.actionText}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  
  info: {
    flex: 1,
  },
  
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginRight: 8,
  },
  
  relationship: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  
  contactInfo: {
    marginTop: 4,
  },
  
  contactText: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginLeft: 8,
  },
  
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  
  actionText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: '600',
  },
});
