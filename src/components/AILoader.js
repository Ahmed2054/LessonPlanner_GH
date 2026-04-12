import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Easing, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';
import { styles } from '../theme/styles';

const TIPS = [
  "Did you know? You can edit any part of the plan after it's generated.",
  "AI analyzes your specific curriculum indicators for better results.",
  "Your saved plans are stored locally for privacy and quick access.",
  "Export to PDF for professional printing and sharing.",
  "DeepSeek AI is one of the most powerful models for educational content."
];

const AILoader = ({ onCancel, title = "AI is Thinking...", subtitle = "Writing your professional lesson plan" }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    // Pulsing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true, easing: Easing.inOut(Easing.ease) })
      ])
    ).start();

    // Rotation Animation
    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 3000, useNativeDriver: true, easing: Easing.linear })
    ).start();

    // Tip Rotation
    const tipInterval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    }, 5000);

    return () => clearInterval(tipInterval);
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Modal visible={true} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { alignItems: 'center', paddingVertical: 40 }]}>
          <View style={{ width: 100, height: 100, justifyContent: 'center', alignItems: 'center' }}>
            <Animated.View style={{ 
              position: 'absolute', 
              width: 80, 
              height: 80, 
              borderRadius: 40, 
              borderWidth: 2, 
              borderColor: COLORS.primary, 
              borderStyle: 'dashed',
              transform: [{ rotate: spin }] 
            }} />
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Ionicons name="sparkles" size={40} color={COLORS.primary} />
            </Animated.View>
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 25, color: COLORS.primary, fontSize: 18, textAlign: 'center' }]}>
            {title}
          </Text>
          <Text style={[styles.helpText, { color: COLORS.dark, opacity: 0.6, fontSize: 12, textAlign: 'center' }]}>
            {subtitle}
          </Text>

          <View style={{ height: 50, marginTop: 30, width: '90%', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.Text style={{ 
              fontSize: 12, 
              color: COLORS.dark, 
              opacity: fadeAnim, 
              textAlign: 'center', 
              fontStyle: 'italic',
              lineHeight: 16
            }}>
              {TIPS[tipIndex]}
            </Animated.Text>
          </View>

          <ActivityIndicator size="small" color={COLORS.primary} style={{ marginTop: 20 }} />

          {onCancel && (
            <TouchableOpacity 
              style={{ 
                marginTop: 35, 
                paddingVertical: 10, 
                paddingHorizontal: 25, 
                borderRadius: 20, 
                backgroundColor: '#f5f5f5',
                borderWidth: 1,
                borderColor: '#eee'
              }} 
              onPress={onCancel}
            >
              <Text style={{ color: COLORS.dark, fontWeight: '700', fontSize: 12 }}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default AILoader;
