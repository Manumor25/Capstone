import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';

export default function AddChildScreen() {
  const router = useRouter();

  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [rut, setRut] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [edad, setEdad] = useState('');

  const [errores, setErrores] = useState({
    nombres: '',
    apellidos: '',
    rut: '',
    fechaNacimiento: '',
    edad: '',
  });

  const manejarSiguiente = () => {
    let nuevosErrores = {
      nombres: '',
      apellidos: '',
      rut: '',
      fechaNacimiento: '',
      edad: '',
    };
    if (!nombres) nuevosErrores.nombres = 'Ingresa el nombre del hijo';
    if (!apellidos) nuevosErrores.apellidos = 'Ingresa el apellido';
    if (!rut) nuevosErrores.rut = 'Ingresa el RUT';
    if (!fechaNacimiento) nuevosErrores.fechaNacimiento = 'Ingresa la fecha de nacimiento';
    if (!edad) nuevosErrores.edad = 'Ingresa la edad';
    setErrores(nuevosErrores);
    if (Object.values(nuevosErrores).some((msg) => msg !== '')) return;
    // Navegar a la siguiente página pasando los datos por params
    router.push({
      pathname: '/Agregar-hijo-p2',
      params: { nombres, apellidos, rut, fechaNacimiento, edad },
    });
  };

  return (
    <View style={styles.container}>
      {/* Botón volver */}
      <Pressable style={styles.backButton} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={28} color="#127067" />
      </Pressable>

      {/* Icono usuario */}
      <View style={styles.profileImageContainer}>
        <Image
          source={require('@/assets/images/user_icon.png')}
          style={styles.profileImage}
          contentFit="cover"
        />
      </View>

      <Text style={styles.title}>añadir hijo</Text>

      {/* Campos */}
      <TextInput
        style={styles.input}
        placeholder="Nombres"
        value={nombres}
        onChangeText={setNombres}
      />
      {errores.nombres ? <Text style={styles.errorText}>{errores.nombres}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Apellidos"
        value={apellidos}
        onChangeText={setApellidos}
      />
      {errores.apellidos ? <Text style={styles.errorText}>{errores.apellidos}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Rut"
        value={rut}
        onChangeText={setRut}
      />
      {errores.rut ? <Text style={styles.errorText}>{errores.rut}</Text> : null}

      <TextInput
        style={styles.input}
        placeholder="Fecha de nacimiento"
        value={fechaNacimiento}
        onChangeText={setFechaNacimiento}
      />
      {errores.fechaNacimiento ? (
        <Text style={styles.errorText}>{errores.fechaNacimiento}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Edad"
        value={edad}
        keyboardType="numeric"
        onChangeText={setEdad}
      />
      {errores.edad ? <Text style={styles.errorText}>{errores.edad}</Text> : null}

      {/* Botón siguiente */}
      <Pressable style={styles.button} onPress={manejarSiguiente}>
        <Text style={styles.buttonText}>Siguiente</Text>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 22,
    marginBottom: 20,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  input: {
    width: '90%',
    borderColor: '#127067',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#127067',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    marginTop: 10,
    width: 150,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    fontSize: 13,
    marginBottom: 5,
    alignSelf: 'flex-start',
    marginLeft: 25,
  },
});
