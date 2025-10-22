import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';
import { Link } from 'expo-router';
import { useSyncRutActivo } from '@/hooks/use-sync-rut-activo';

export default function HomeScreen() {
  useSyncRutActivo();
  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image
        source={require('@/assets/images/Furgo_Truck.png')}
        style={styles.logo}
        contentFit="contain"
      />

      {/* Botón Regístrate */}
      <Link href="/register" asChild>
        <TouchableHighlight
          underlayColor="#127067"
          style={styles.button}
        >
          <Text style={styles.buttonText}>Regístrate</Text>
        </TouchableHighlight>
      </Link>

      {/* Botón Ingresa */}
      <Link href="/login" asChild>
        <TouchableHighlight
          underlayColor="#127067"
          style={styles.button}
        >
          <Text style={styles.buttonText}>Ingresa</Text>
        </TouchableHighlight>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 60,
  },
  button: {
    backgroundColor: '#127067',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginVertical: 10,
    width: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
