import { db } from '@/firebaseConfig';
import { useSyncRutActivo } from '@/hooks/use-sync-rut-activo';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, useRouter } from 'expo-router';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

export default function PaginaPrincipalConductor() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [alertasVisible, setAlertasVisible] = useState(false);
  const [alertas, setAlertas] = useState<any[]>([]);
  const [patentesConductor, setPatentesConductor] = useState<string[]>([]);
  useSyncRutActivo();
  const router = useRouter();

  useEffect(() => {
    const cargarAlertas = async () => {
      try {
        const rutConductor = await AsyncStorage.getItem('rutUsuario');
        if (!rutConductor) {
          setAlertas([]);
          return;
        }

        const patentesSet = new Set<string>();
        try {
          const furgonesRef = collection(db, 'Furgones');
          const furgonesSnapshot = await getDocs(query(furgonesRef, where('rutUsuario', '==', rutConductor)));
          furgonesSnapshot.forEach((docSnap) => {
            const data = docSnap.data() || {};
            const patente = (data.patente || '').toString().trim();
            if (patente) {
              patentesSet.add(patente);
            }
          });
        } catch (errorPatentes) {
          console.error('No se pudieron obtener los furgones del conductor:', errorPatentes);
        }
        setPatentesConductor(Array.from(patentesSet));

        const alertasRef = collection(db, 'Alertas');
        const qAlertas = query(
          alertasRef,
          where('tipoAlerta', '==', 'Postulacion'),
          where('rutDestinatario', '==', rutConductor)
        );
        const snapshot = await getDocs(qAlertas);
        const lista = snapshot.docs
          .map((docSnap) => {
            const data = docSnap.data() as any;
            const fecha =
              data.creadoEn && typeof data.creadoEn.toDate === 'function'
                ? data.creadoEn.toDate()
                : data.fecha
                ? new Date(data.fecha)
                : null;
            const idPostulacion = data.parametros?.idPostulacion || data.idPostulacion || null;
            return {
              id: docSnap.id,
              descripcion: data.descripcion || 'Sin descripcion',
              idPostulacion,
              rutaDestino: data.rutaDestino || '/chat-validacion',
              parametros: data.parametros || {},
              fecha,
              patenteFurgon: (data.patenteFurgon || '').toString().trim(),
            };
          })
          .filter((alerta) => {
            if (!alerta.idPostulacion) return false;
            if (!alerta.patenteFurgon) return false;
            return patentesSet.has(alerta.patenteFurgon);
          })
          .sort((a, b) => {
            const fechaA = a.fecha ? a.fecha.getTime() : 0;
            const fechaB = b.fecha ? b.fecha.getTime() : 0;
            return fechaB - fechaA;
          })
          .slice(0, 10);
        setAlertas(lista);
      } catch (error) {
        console.error('Error al cargar alertas:', error);
        Alert.alert('Error', 'No se pudieron cargar las alertas.');
      }
    };
    cargarAlertas();
  }, []);

  return (
    <View style={styles.container}>
      {/* Barra superior */}
      <View style={styles.greenHeader}>
        <Pressable onPress={() => setMenuVisible(!menuVisible)} style={styles.iconButton}>
          <Ionicons name="menu" size={28} color="#fff" />
        </Pressable>
        <View style={styles.headerCenter} />
        <Pressable
          onPress={() => setAlertasVisible(!alertasVisible)}
          style={[
            styles.iconButton,
            alertasVisible ? styles.iconButtonActive : null,
          ]}
        >
          <Ionicons
            name="notifications-outline"
            size={28}
            color={alertasVisible ? '#1dbb7f' : '#fff'}
          />
        </Pressable>
      </View>

      {/* Menú lateral */}
      {menuVisible && (
        <View style={styles.menu}>
          <Link href="/conductor/perfil-conductor" asChild>
            <TouchableHighlight style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Editar perfil</Text>
            </TouchableHighlight>
          </Link>
          <Link href="/historial-viajes" asChild>
            <TouchableHighlight style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Historial de viajes</Text>
            </TouchableHighlight>
          </Link>
          <Link href="/conductor/Lista_vehiculos_2" asChild>
            <TouchableHighlight style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Lista de niños</Text>
            </TouchableHighlight>
          </Link>
          <Link href="/conductor/promocionar-furgon" asChild>
            <TouchableHighlight style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Promocionar Furgón</Text>
            </TouchableHighlight>
          </Link>
          <Link href="/chat-furgon" asChild>
            <TouchableHighlight style={styles.menuButton}>
              <Text style={styles.menuButtonText}>Chat Apoderados</Text>
            </TouchableHighlight>
          </Link>
        </View>
      )}

      {/* Panel de alertas */}
      {alertasVisible && (
        <View style={styles.alertasWrapper}>
          <View style={styles.alertasCard}>
            {alertas.length === 0 ? (
              <Text style={styles.noAlertasText}>No hay alertas nuevas</Text>
            ) : (
              alertas.map((alerta, idx) => (
                <View key={idx} style={styles.alertaItem}>
                  <Text style={styles.alertaBullet}>•</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.alertaDescripcion}>{alerta.descripcion}</Text>
                    <TouchableHighlight
                      style={styles.alertaBoton}
                      underlayColor="#0c5c4e"
                      onPress={() => {
                        if (!alerta.idPostulacion) return;
                        const params = {
                          ...alerta.parametros,
                          idPostulacion: alerta.idPostulacion,
                        };
                        router.push({
                          pathname: alerta.rutaDestino || '/chat-validacion',
                          params,
                        });
                      }}
                    >
                      <Text style={styles.alertaBotonTexto}>Ver información</Text>
                    </TouchableHighlight>
                  </View>
                </View>
              ))
            )}
            <Pressable style={styles.crearAlertaButton} onPress={() => router.push('/conductor/generar_alertas')}>
              <Ionicons name="add-circle-outline" size={18} color="#127067" />
              <Text style={styles.crearAlertaTexto}>Generar alerta</Text>
            </Pressable>
          </View>
          <View style={styles.alertasPointer} />
        </View>
      )}

      {/* Imagen del mapa */}
      <View style={styles.mapaContainer}>
        <Image
          source={require('@/assets/images/mapa-img.jpg')}
          style={styles.mapaImage}
          resizeMode="cover"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7F8' },
  greenHeader: {
    backgroundColor: '#127067',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 15,
    height: 80,
  },
  iconButton: { padding: 8 },
  iconButtonActive: {
    borderRadius: 20,
    backgroundColor: '#ffffff22',
  },
  headerCenter: { flex: 1 },
  menu: {
    position: 'absolute',
    top: 90,
    left: 16,
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    width: 200,
    zIndex: 10,
  },
  menuButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 6,
    backgroundColor: '#127067',
    borderRadius: 20,
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
  alertasWrapper: {
    position: 'absolute',
    top: 100,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 400,
  },
  alertasCard: {
    width: 240,
    backgroundColor: '#fff',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#127067',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 8,
  },
  alertasPointer: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#127067',
  },
  crearAlertaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#127067',
    backgroundColor: '#e6f3f2',
  },
  crearAlertaTexto: {
    fontSize: 13,
    color: '#127067',
    fontWeight: '600',
  },
  noAlertasText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  alertaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  alertaBullet: {
    fontSize: 22,
    color: '#127067',
    marginTop: -2,
  },
  alertaDescripcion: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  alertaBoton: {
    alignSelf: 'flex-start',
    backgroundColor: '#127067',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  alertaBotonTexto: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  mapaContainer: {
    flex: 1,
    margin: 20,
    marginTop: 20,
    borderRadius: 15,
    overflow: 'hidden',
  },
  mapaImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
});
