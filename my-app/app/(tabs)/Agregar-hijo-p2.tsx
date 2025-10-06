import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { db } from '../../firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import CryptoJS from 'crypto-js';

export default function AddMedicalFileScreen() {
  const router = useRouter();
  const storage = getStorage();
  const [pdfFile, setPdfFile] = useState<{ uri: string; name?: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Recibe los datos del hijo desde la pantalla anterior
  const { nombres, apellidos, rut, fechaNacimiento, edad } = useLocalSearchParams();
  const datosCompletos = nombres && apellidos && rut && fechaNacimiento && edad;

  // === REEMPLAZA con una clave segura en producción ===
  const ENCRYPTION_KEY = 'REPLACE_THIS_WITH_A_STRONG_SECRET_KEY';

  // Utilidad: convierte Blob a base64 (data:[mime];base64,AAAA...)
  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => {
        reader.abort();
        reject(new Error('Error reading blob as base64'));
      };
      reader.onload = () => {
        // reader.result será 'data:application/pdf;base64,JVBERi0xLjcK...'
        const dataUrl = reader.result as string;
        // Extraemos solo la parte base64 después de la coma
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });

  // Seleccionar archivo PDF
  const pickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (result && (result as any).assets && (result as any).assets.length > 0) {
        const file = (result as any).assets[0];
        setPdfFile({ uri: file.uri, name: file.name ?? 'PDF' });
      } else if (result && result.type === 'success') {
        // manejo retrocompatibilidad si result tiene uri directamente
        setPdfFile({ uri: (result as any).uri, name: (result as any).name ?? 'PDF' });
      } else {
        Alert.alert('Error', 'No se seleccionó ningún archivo válido.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  // Abrir/descargar ficha médica base (Google Drive)
  const handleDownloadFicha = async () => {
    try {
      const url = 'https://drive.google.com/uc?export=download&id=1Q0zpJelx0Qg7eSefuSXppc6_X77RzIbd';
      await WebBrowser.openBrowserAsync(url);
    } catch {
      Alert.alert('Error', 'No se pudo abrir la ficha médica.');
    }
  };

  // Guardar hijo + ficha médica ENCRIPTADA
  const handleGuardar = async () => {
    if (!pdfFile) {
      Alert.alert('Atención', 'Debes cargar una ficha médica antes de continuar.');
      return;
    }
    if (!datosCompletos) {
      Alert.alert('Error', 'Faltan datos obligatorios del hijo.');
      return;
    }

    setIsUploading(true);

    try {
      // 1) Obtener blob del archivo local (fetch funciona con URIs locales en Expo)
      const fileResponse = await fetch(pdfFile.uri);
      const blob: Blob = await fileResponse.blob();

      // 2) Convertir blob a base64
      const base64 = await blobToBase64(blob);

      // 3) Encriptar la cadena base64 con AES (CryptoJS)
      //    Resultado: cadena en Base64 (representación del cifrado)
      const encrypted = CryptoJS.AES.encrypt(base64, ENCRYPTION_KEY).toString();

      // 4) Crear un blob con la cadena encriptada (texto). Aquí almacenamos texto encriptado.
      //    En producción podrías almacenar metadata indicando que está encriptado y algoritmo.
      const encryptedBlob = new Blob([encrypted], { type: 'application/octet-stream' });

      // 5) Subir al storage con extensión .enc para indicar que está encriptado
      const filename = `${rut}_${Date.now()}.pdf.enc`;
      const storageRef = ref(storage, `fichas_medicas/${filename}`);
      await uploadBytes(storageRef, encryptedBlob);

      // 6) Obtener URL de descarga (nota: la URL será del archivo encriptado)
      const downloadURL = await getDownloadURL(storageRef);

      // 7) Guardar documento en Firestore con la URL encriptada
      await addDoc(collection(db, 'hijos'), {
        nombres,
        apellidos,
        rut,
        fechaNacimiento,
        edad,
        fichaMedica: downloadURL,
        fichaMedicaEncrypted: true,
        creadoEn: new Date(),
      });

      Alert.alert('Éxito', 'Ficha médica encriptada y datos guardados correctamente');
      router.push('/perfil-usuario');
    } catch (err) {
      console.error('Error upload/encrypt:', err);
      Alert.alert('Error', 'No se pudo guardar la información. Intenta nuevamente.');
    } finally {
      setIsUploading(false);
    }
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

      {/* Botón de descarga de ficha médica */}
      <Pressable style={styles.downloadBox} onPress={handleDownloadFicha}>
        <Ionicons name="download-outline" size={22} color="#127067" />
        <Text style={styles.downloadText}>Descargar Ficha médica</Text>
      </Pressable>

      {/* Cuadro de carga */}
      <Pressable style={styles.uploadBox} onPress={pickPdf}>
        <Text style={styles.uploadText}>
          {pdfFile ? `Archivo: ${pdfFile.name ?? 'PDF'}` : 'Cargar Ficha médica'}
        </Text>
      </Pressable>

      {/* Botón Guardar */}
      <Pressable
        style={[styles.button, { opacity: isUploading ? 0.7 : 1 }]}
        onPress={handleGuardar}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Guardar</Text>
        )}
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
    marginBottom: 30,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  downloadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#127067',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  downloadText: {
    color: '#127067',
    fontSize: 16,
    marginLeft: 8,
  },
  uploadBox: {
    width: '85%',
    height: 150,
    borderWidth: 1.5,
    borderColor: '#127067',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  uploadText: {
    color: '#127067',
    fontSize: 16,
    textAlign: 'center',
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
});
