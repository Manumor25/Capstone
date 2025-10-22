import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { useSyncRutActivo } from '@/hooks/use-sync-rut-activo';

interface Usuario {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  rut: string;
  rol: string; // Nuevo campo para el rol
}

export default function LoginScreen() {
  const [correo, setCorreo] = useState<string>('');
  const [contrasena, setContrasena] = useState<string>('');
  const [errorLogin, setErrorLogin] = useState<string>('');
  const router = useRouter();
  useSyncRutActivo();

  const manejarLogin = async () => {
    setErrorLogin('');

    if (!correo || !contrasena) {
      setErrorLogin('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('correo', '==', correo.trim()));
      const querySnapshot = await getDocs(q);

      console.log('Usuarios encontrados:', querySnapshot.docs.length);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data() as Usuario;
        console.log('Datos del usuario:', userData);

        // Validar contraseña
        if (userData.contrasena !== contrasena) {
          setErrorLogin('Correo o contraseña incorrectos.');
          return;
        }

        // Validar que tenga rut
        if (!userData.rut) {
          Alert.alert('Error', 'El usuario no tiene un RUT asignado en la base de datos.');
          return;
        }

        // Validar que tenga rol
        if (!userData.rol) {
          Alert.alert('Error', 'El usuario no tiene un rol asignado en la base de datos.');
          return;
        }

        // Guardar datos en AsyncStorage
        await AsyncStorage.setItem('rutUsuario', String(userData.rut));
        const nombreCompleto = `${userData.nombres} ${userData.apellidos}`;
        await AsyncStorage.setItem('userName', nombreCompleto);
        await AsyncStorage.setItem('userRole', userData.rol); // Guardar el rol

        console.log('✅ Login exitoso, RUT y nombre guardados:', userData.rut, nombreCompleto);
        console.log('✅ Rol del usuario:', userData.rol);

        // Redirigir según el rol del usuario
        if (userData.rol === 'Conductor') {
          router.replace('/conductor/pagina-principal-conductor');
        } else if (userData.rol === 'Apoderado') {
          router.replace('/apoderado/pagina-principal-apoderado');
        } else {
          Alert.alert('Error', 'Rol de usuario no válido.');
        }
      } else {
        setErrorLogin('Correo o contraseña incorrectos.');
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      setErrorLogin('Ocurrió un error al iniciar sesión.');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={() => router.push('/')}>
        <Ionicons name="arrow-back" size={28} color="#127067" />
      </Pressable>

      <Image
        source={require('@/assets/images/Furgo_Truck.png')}
        style={styles.logo}
        contentFit="contain"
      />

      <Text style={styles.title}>Ingreso</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo"
        keyboardType="email-address"
        autoCapitalize="none"
        value={correo}
        onChangeText={setCorreo}
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={contrasena}
        onChangeText={setContrasena}
      />

      {errorLogin ? <Text style={styles.errorText}>{errorLogin}</Text> : null}

      <Pressable style={styles.button} onPress={manejarLogin}>
        <Text style={styles.buttonText}>Iniciar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 5,
    alignSelf: 'flex-start',
    marginLeft: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    width: '90%',
    borderColor: '#127067',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#127067',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 6,
    marginTop: 10,
    width: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});
