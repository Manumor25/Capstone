import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableHighlight } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [userName, setUserName] = useState('');

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

  return (
    <View style={styles.container}>
      {/* Icono de usuario */}
      <View style={styles.profileImageContainer}>
        <Image
          source={require('@/assets/images/user_icon.png')} // Asegúrate de tener este ícono
          style={styles.profileImage}
          contentFit="cover"
        />
      </View>

      {/* Nombre dinámico */}
      <Text style={styles.userName}>{userName}</Text>

      {/* Botones */}
      <Link href="/Agregar-hijo" asChild>
      <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
      <Text style={styles.buttonText}>Añadir hijo</Text>
      </TouchableHighlight>
      </Link>
      

      <Link href="/(tabs)/Editar_hijo" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Editar hijo</Text>
        </TouchableHighlight>
      </Link>

      <Link href="/(tabs)/añadir_tutor" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Añadir tutor</Text>
        </TouchableHighlight>
      </Link>

      <Link href="/(tabs)/Editar-tutor" asChild>
        <TouchableHighlight style={styles.button} underlayColor="#0e5b52">
          <Text style={styles.buttonText}>Editar tutor</Text>
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
  },
  button: {
    backgroundColor: '#127067',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginVertical: 8,
    width: 180,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
});
