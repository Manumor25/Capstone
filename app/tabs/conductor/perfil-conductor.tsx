import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableHighlight, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncRutActivo } from '@/hooks/use-sync-rut-activo';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [userName, setUserName] = useState('');
  const router = useRouter();
  useSyncRutActivo();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const name = await AsyncStorage.getItem('userName');
        if (name && name.trim() !== '') setUserName(name);
        else setUserName('Usuario');
      } catch (error) {
        setUserName('Usuario');
      }
    };
    loadUserData();
  }, []);

  const handleVolver = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/conductor/pagina-principal-conductor');
    }
  };

  return (
    <View style={styles.container}>
      {/* Botón de volver */}
      <Pressable style={styles.backButton} onPress={handleVolver}>
        <Ionicons name="arrow-back" size={28} color="#127067" />
      </Pressable>

      {/* Icono de usuario */}
      <View style={styles.profileImageContainer}>
        <Image
          source={require('@/assets/images/user_icon.png')}
          style={styles.profileImage}
          contentFit="cover"
        />
      </View>

      {/* Nombre dinámico */}
      <Text style={styles.userName}>{userName}</Text>

      {/* Botones con tamaño ajustado */}
      <Link href="/conductor/Editar_datos_conductor" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Editar datos conductor</Text>
        </TouchableHighlight>
      </Link>

      <Link href="/conductor/Agregar_furgon" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Agregar furgon</Text>
        </TouchableHighlight>
      </Link>

      <Link href="/conductor/lista_vehiculos" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Editar datos vehículo</Text>
        </TouchableHighlight>
      </Link>

      <Link href="/apoderado/lista-hijos" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Añadir documentos</Text>
        </TouchableHighlight>
      </Link>

      <Link href="/apoderado/lista-tutores" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Editar documentos</Text>
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
    paddingTop: 80, // espacio para el botón de volver
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  profileImageContainer: {
    backgroundColor: '#e6e6e6',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  profileImage: {
    width: 50,
    height: 50,
  },
  userName: {
    fontSize: 20,
    color: '#333333',
    marginBottom: 30,
    textTransform: 'capitalize',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#127067',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginVertical: 6,
    minWidth: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
