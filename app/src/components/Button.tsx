import React from 'react'
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native'

interface ButtonProps {
 title: string
 onPress: () => void
 loading?: boolean
 disabled?: boolean
 variant?: 'primary' | 'secondary'
}

export const Button: React.FC<ButtonProps> = ({ 
 title, 
 onPress, 
 loading = false, 
 disabled = false,
 variant = 'primary'
}) => {
 return (
  <TouchableOpacity
   onPress={onPress}
   disabled={disabled || loading}
   style={{
    backgroundColor: variant === 'primary' ? '#007AFF' : '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    opacity: disabled ? 0.6 : 1
   }}
  >
   {loading ? (
    <ActivityIndicator color={variant === 'primary' ? 'white' : '#007AFF'} />
   ) : (
    <Text style={{ 
     color: variant === 'primary' ? 'white' : '#007AFF',
     fontWeight: 'bold'
    }}>
     {title}
    </Text>
   )}
  </TouchableOpacity>
 )
}