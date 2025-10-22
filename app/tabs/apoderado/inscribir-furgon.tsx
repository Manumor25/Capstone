import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableHighlight,
  StyleSheet,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { db } from '@/firebaseConfig';
import { useSyncRutActivo } from '@/hooks/use-sync-rut-activo';
import { addDoc, collection, getDocs, doc, getDoc, query, where, limit, serverTimestamp } from 'firebase/firestore';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import CryptoJS from 'crypto-js';

interface Hijo {
  id: string;
  nombres: string;
  apellidos: string;
  rut: string;
}

const ENCRYPTION_SALT = 'VEHICULO_IMG_V1';

export default function PostularFurgon() {
  const router = useRouter();
  const params = useLocalSearchParams();
  useSyncRutActivo();
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [hijoSeleccionado, setHijoSeleccionado] = useState('');
  const [rutHijoSeleccionado, setRutHijoSeleccionado] = useState('');
  const [rutUsuario, setRutUsuario] = useState('');
  const [fotoFurgon, setFotoFurgon] = useState<string | null>(null);
  const [cargandoFoto, setCargandoFoto] = useState(false);
  const rutConductorParam = (params.rutConductor as string) || '';
  const patenteParam = (params.patente as string) || '';
  const furgonIdParam = (params.id as string) || '';

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [rutGuardado, rutHijoPrevio] = await Promise.all([
          AsyncStorage.getItem('rutUsuario'),
          AsyncStorage.getItem('rutHijoSeleccionado'),
        ]);
        if (!rutGuardado) {
          Alert.alert('Error', 'No se encontro el RUT del usuario activo.');
          return;
        }
        setRutUsuario(rutGuardado);

        const hijosRef = collection(db, 'Hijos');
        const q = query(hijosRef, where('rutUsuario', '==', rutGuardado));
        const snapshot = await getDocs(q);

        const lista = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            nombres: data.nombres || '',
            apellidos: data.apellidos || '',
            rut: data.rut || '',
          };
        });

        setHijos(lista);
        const hijoPorRut = rutHijoPrevio
          ? lista.find((hijo) => hijo.rut === rutHijoPrevio)
          : undefined;
        const hijoPorDefecto =
          !hijoPorRut && !hijoSeleccionado && lista.length === 1 ? lista[0] : undefined;
        const hijoInicial = hijoPorRut || hijoPorDefecto;

        if (hijoInicial) {
          setHijoSeleccionado(hijoInicial.id);
          setRutHijoSeleccionado(hijoInicial.rut);
          AsyncStorage.setItem('rutHijoSeleccionado', hijoInicial.rut).catch((error) => {
            console.error('No se pudo guardar el RUT del hijo seleccionado:', error);
          });
        } else if (!rutHijoPrevio) {
          setRutHijoSeleccionado('');
        }
      } catch (error) {
        console.error('Error al cargar hijos:', error);
        Alert.alert('Error', 'No se pudieron cargar los hijos.');
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    const cargarFotoFurgon = async () => {
      if (!furgonIdParam && !patenteParam) {
        setFotoFurgon(null);
        return;
      }

      setCargandoFoto(true);
      try {
        let base64: string | null = null;
        let mimeType = 'image/jpeg';
        let rutReferencia = rutConductorParam;

        if (furgonIdParam) {
          const furgonRef = doc(db, 'Furgones', furgonIdParam);
          const snapshot = await getDoc(furgonRef);
          if (snapshot.exists()) {
            const data = snapshot.data() || {};
            rutReferencia = data.rutUsuario || rutConductorParam;
            if (data.fotoMimeType) mimeType = data.fotoMimeType;

            if (data.fotoCifrada && rutReferencia) {
              try {
                const clave = `${rutReferencia}-${ENCRYPTION_SALT}`;
                const bytes = CryptoJS.AES.decrypt(data.fotoCifrada, clave);
                const decoded = bytes.toString(CryptoJS.enc.Utf8);
                if (decoded) {
                  base64 = decoded;
                }
              } catch (error) {
                console.warn('No se pudo descifrar la foto del furgón desde Furgones:', error);
              }
            }
          }
        }

        if (!base64 && patenteParam) {
          const vehiculosRef = collection(db, 'Vehiculos');
          const vehiculoQuery = query(vehiculosRef, where('patente', '==', patenteParam), limit(1));
          const vehiculosSnapshot = await getDocs(vehiculoQuery);

          if (!vehiculosSnapshot.empty) {
            const data = vehiculosSnapshot.docs[0].data() || {};
            const rutVehiculo = data.rutUsuario || rutReferencia;
            if (data.fotoMimeType) mimeType = data.fotoMimeType;

            if (data.fotoCifrada && rutVehiculo) {
              try {
                const clave = `${rutVehiculo}-${ENCRYPTION_SALT}`;
                const bytes = CryptoJS.AES.decrypt(data.fotoCifrada, clave);
                const decoded = bytes.toString(CryptoJS.enc.Utf8);
                if (decoded) {
                  base64 = decoded;
                }
              } catch (error) {
                console.warn('No se pudo descifrar la foto del furgón desde Vehículos:', error);
              }
            }
          }
        }

        if (base64) {
          setFotoFurgon(`data:${mimeType};base64,${base64}`);
        } else {
          setFotoFurgon(null);
        }
      } catch (error) {
        console.error('Error al cargar la foto del furgón:', error);
        setFotoFurgon(null);
      } finally {
        setCargandoFoto(false);
      }
    };

    cargarFotoFurgon();
  }, [furgonIdParam, patenteParam, rutConductorParam]);

  const handleSeleccionHijo = (itemValue: string | number) => {
    const valorSeleccionado = String(itemValue);
    setHijoSeleccionado(valorSeleccionado);
    const hijo = hijos.find((item) => item.id === valorSeleccionado);
    const rut = hijo?.rut ?? '';
    setRutHijoSeleccionado(rut);
    if (rut) {
      AsyncStorage.setItem('rutHijoSeleccionado', rut).catch((error) => {
        console.error('No se pudo guardar el RUT del hijo seleccionado:', error);
      });
    } else {
      AsyncStorage.removeItem('rutHijoSeleccionado').catch((error) => {
        console.error('No se pudo eliminar el RUT del hijo seleccionado:', error);
      });
    }
  };

  const postular = async () => {
    if (!hijoSeleccionado) {
      Alert.alert('Error', 'Selecciona un hijo para postular.');
      return;
    }

    if (!rutHijoSeleccionado) {
      Alert.alert('Error', 'No se pudo obtener el RUT del hijo seleccionado.');
      return;
    }

    if (!rutUsuario) {
      Alert.alert('Error', 'No se pudo identificar al usuario.');
      return;
    }

    try {
      const { rutConductor, patenteFurgon } = await obtenerDatosFurgon();

      if (!rutConductor || !patenteFurgon) {
        Alert.alert('Error', 'No se pudo obtener la informacion del furgon.');
        return;
      }

      const timestamp = serverTimestamp();
      const postulacionDoc = await addDoc(collection(db, 'Postulaciones'), {
        rutUsuario,
        rutConductor,
        rutHijo: rutHijoSeleccionado,
        idHijo: hijoSeleccionado,
        idFurgon: furgonIdParam || '',
        patenteFurgon,
        colegio: (params.colegio as string) || '',
        nombreFurgon: (params.nombre as string) || '',
        comuna: (params.comuna as string) || '',
        estado: 'pendiente',
        creadoEn: timestamp,
      });

      const nombreApoderado = await obtenerNombreApoderado();
      await addDoc(collection(db, 'Alertas'), {
        tipoAlerta: 'Postulacion',
        descripcion: (nombreApoderado || 'Un apoderado') + ' esta postulando a tu furgon',
        rutDestinatario: rutConductor,
        rutaDestino: '/chat-validacion',
        parametros: {
          idPostulacion: postulacionDoc.id,
          rutPadre: rutUsuario,
          rutConductor,
          rutHijo: rutHijoSeleccionado,
          patenteFurgon,
        },
        creadoEn: serverTimestamp(),
        leida: false,
        patenteFurgon,
      });

      router.push({
        pathname: '/chat-validacion',
        params: { idPostulacion: postulacionDoc.id },
      });
    } catch (error) {
      console.error('Error al postular:', error);
      Alert.alert('Error', 'No se pudo enviar la solicitud.');
    }
  };

  const obtenerDatosFurgon = async (): Promise<{ rutConductor: string; patenteFurgon: string }> => {
    let rutConductor = rutConductorParam;
    let patenteFurgon = patenteParam;

    if (rutConductor && patenteFurgon) {
      return { rutConductor, patenteFurgon };
    }

    if (rutConductorParam && patenteParam) {
      return { rutConductor: rutConductorParam, patenteFurgon: patenteParam };
    }

    try {
      const postulacionesRef = collection(db, 'Furgones');
      const snapshot = await getDocs(postulacionesRef);

      let rut = rutConductorParam;
      let patente = patenteParam;

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (!rut && data?.rutUsuario) {
          rut = data.rutUsuario;
        }
        if (!patente && data?.patente) {
          patente = data.patente;
        }
      });

      if (!rut || !patente) {
        throw new Error('No se encontraron datos suficientes del furgón');
      }

      return { rutConductor: rut, patenteFurgon: patente };
    } catch (error) {
      console.error('Error al obtener datos del furgón:', error);
      throw error;
    }
  };

  const obtenerNombreApoderado = async (): Promise<string> => {
    if (!rutUsuario) {
      return '';
    }

    try {
      const usuariosRef = collection(db, 'usuarios');
      const q = query(usuariosRef, where('rut', '==', rutUsuario));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const data = snapshot.docs[0].data() as any;
        const nombres = data?.nombres?.toString() || '';
        const apellidos = data?.apellidos?.toString() || '';
        return `${nombres} ${apellidos}`.trim();
      }
    } catch (error) {
      console.error('No se pudo obtener el nombre del apoderado:', error);
    }

    return '';
  };

  const handleVolver = () => {
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/apoderado/pagina-principal-apoderado');
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.backButton} onPress={handleVolver}>
        <Ionicons name="arrow-back" size={28} color="#127067" />
      </Pressable>

      <View style={styles.profileContainer}>
        <View style={styles.imageWrapper}>
          {cargandoFoto ? (
            <ActivityIndicator color="#127067" />
          ) : fotoFurgon ? (
            <Image source={{ uri: fotoFurgon }} style={styles.furgonImage} contentFit="cover" />
          ) : (
            <Ionicons name="image-outline" size={56} color="#127067" />
          )}
        </View>
        <Text style={styles.name}>{(params.nombre as string) || 'Furgón disponible'}</Text>
        <Text style={styles.school}>{(params.colegio as string) || 'Colegio no informado'}</Text>
        <View style={styles.detailsCard}>
          <Text style={styles.detailItem}>Comuna: {(params.comuna as string) || 'No registrada'}</Text>
          <Text style={styles.detailItem}>Patente: {patenteParam || 'Sin patente'}</Text>
          <Text style={styles.detailItem}>Precio: ${(params.precio as string) || 'N/D'} CLP</Text>
        </View>
        <Text style={styles.verified}>Verificado: Si</Text>
      </View>

      <Text style={styles.label}>Selecciona hijo</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={hijoSeleccionado}
          onValueChange={handleSeleccionHijo}
          style={styles.picker}
          enabled={hijos.length > 0}
        >
          <Picker.Item label="Selecciona un hijo..." value="" />
          {hijos.map((hijo) => (
            <Picker.Item
              key={hijo.id}
              label={`${hijo.nombres} ${hijo.apellidos}`}
              value={hijo.id}
            />
          ))}
        </Picker>
      </View>

      <TouchableHighlight style={styles.button} onPress={postular} underlayColor="#0c5c4e">
        <Text style={styles.buttonText}>Postular</Text>
      </TouchableHighlight>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F8',
    padding: 20,
    paddingTop: 80,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    zIndex: 10,
    padding: 6,
  },
  profileContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  imageWrapper: {
    width: 140,
    height: 100,
    borderRadius: 16,
    backgroundColor: '#E6EFEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    overflow: 'hidden',
  },
  furgonImage: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#127067',
    marginTop: 4,
  },
  school: {
    fontSize: 16,
    color: '#555',
    marginTop: 4,
  },
  detailsCard: {
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dce7e5',
    width: '100%',
  },
  detailItem: {
    fontSize: 15,
    color: '#444',
    marginBottom: 4,
  },
  verified: {
    fontSize: 16,
    color: '#127067',
    marginTop: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
    alignSelf: 'flex-start',
    marginBottom: 5,
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderColor: '#127067',
    borderWidth: 1,
    borderRadius: 10,
    width: '100%',
    marginBottom: 20,
  },
  picker: {
    height: 50,
    width: '100%',
    color: '#333',
  },
  button: {
    backgroundColor: '#127067',
    paddingVertical: 14,
    borderRadius: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});
