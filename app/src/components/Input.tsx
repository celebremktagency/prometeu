import React from 'react'
import { TextInput, Text, View } from 'react-native'

interface InputProps {
 label?: string
 value: string
 onChangeText: (text: string) => void
 placeholder?: string
 secureTextEntry?: boolean
 keyboardType?: 'default' | 'email-address' | 'numeric'
 error?: string
}

export const Input: React.FC<InputProps> = ({
 label,
 value,
 onChangeText,
 placeholder,
 secureTextEntry = false,
 keyboardType = 'default',
 error
}) => {
 return (
  <View style={{ marginBottom: 16 }}>
   {label && (
    <Text style={{ 
     marginBottom: 8,
     fontWeight: 'bold'
    }}>
     {label}
    </Text>
   )}
   <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    secureTextEntry={secureTextEntry}
    keyboardType={keyboardType}
    style={{
     borderWidth: 1,
     borderColor: error ? '#ff4444' : '#ddd',
     borderRadius: 8,
     padding: 12,
     backgroundColor: 'white'
    }}
   />
   {error && (
    <Text style={{ 
     color: '#ff4444',
     marginTop: 4,
     fontSize: 12
    }}>
     {error}
    </Text>
   )}
  </View>
 )
}