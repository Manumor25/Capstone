import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const PaginaPrincipal = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.push('/')}> 
        <Ionicons name="arrow-back" size={28} color="#127067" />
      </Pressable>
      <Text style={styles.title}>Página Principal</Text>
      {/* ...contenido de la página principal... */}
    </View>
  );
};

export default PaginaPrincipal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 60,
    marginBottom: 20,
  },
});
