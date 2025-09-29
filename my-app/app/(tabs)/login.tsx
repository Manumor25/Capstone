import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
		const [correo, setCorreo] = useState('');
		const [contrasena, setContrasena] = useState('');
		const [errorLogin, setErrorLogin] = useState('');
		const router = useRouter();

		const manejarLogin = async () => {
			setErrorLogin('');
			try {
				const { getDocs, query, where, collection } = await import('firebase/firestore');
				const { db } = await import('../../firebaseConfig');
				const usuariosRef = collection(db, 'usuarios');
				const q = query(usuariosRef, where('correo', '==', correo), where('contrasena', '==', contrasena));
				const querySnapshot = await getDocs(q);
				if (!querySnapshot.empty) {
					router.push('/pagina-principal');
				} else {
					setErrorLogin('Correo o contraseña incorrectos.');
				}
			} catch (e) {
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
				{errorLogin ? (
					<Text style={styles.errorText}>{errorLogin}</Text>
				) : null}
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
