import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Keyboard,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import axios from 'axios';
import { useFonts, Inter_400Regular, Inter_700Bold } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../src/firebase';
import LottieView from 'lottie-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { Image } from 'expo-image';import * as Haptics from 'expo-haptics';

import sunnyAnimation from '../../assets/animations/sunny.json';
import cloudyAnimation from '../../assets/animations/cloudy.json';
import rainAnimation from '../../assets/animations/rain.json';
import thunderAnimation from '../../assets/animations/thunder.json';
import snowAnimation from '../../assets/animations/snow.json';
import nightAnimation from '../../assets/animations/night.json';

const { width } = Dimensions.get('window');

const getWeatherAnimation = (condition: string, isNightTime: boolean = false) => {
  if (isNightTime && condition === 'Clear') {
    return nightAnimation;
  }
  switch (condition) {
    case 'Clear':
      return sunnyAnimation;

    case 'Clouds':
      return cloudyAnimation;

    case 'Rain':
    case 'Drizzle':
      return rainAnimation;

    case 'Thunderstorm':
      return thunderAnimation;

    case 'Snow':
      return snowAnimation;
      
    default:
      return cloudyAnimation;
  }
};

type ForecastItem = {
  day: string;
  min: number;
  max: number;
  icon: string;
};

const isNight = (sunrise: number, sunset: number): boolean => {
  const now = Date.now() / 1000;
  return now < sunrise || now > sunset;
};

const getGradientForWeather = (
  condition: string,
  isNight: boolean
): readonly [string, string] => {
  if (isNight) {
    return ['#000428', '#004e92'] as const;
  }

  switch (condition) {
    case 'Clear':
      return ['#FFD200', '#FF8C00'] as const;

    case 'Clouds':
      return ['#d7d2cc', '#304352'] as const;

    case 'Rain':
    case 'Drizzle':
      return ['#4facfe', '#00f2fe'] as const;

    case 'Thunderstorm':
      return ['#f7b733', '#4b1248'] as const;

    case 'Snow':
      return ['#e0eafc', '#cfdef3'] as const;

    case 'Mist':
    case 'Fog':
      return ['#bdc3c7', '#2c3e50'] as const;

    default:
      return ['#83a4d4', '#b6fbff'] as const;
  }
};


export default function Home() {
  const [weather, setWeather] = useState<any>(null);
  const [forecast, setForecast] = useState<ForecastItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string>('Paris');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState<boolean>(false);
  const [fontsLoaded] = useFonts({ Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    loadFavorites();
    fetchWeather(city);
  }, []);

  useEffect(() => {
    if (fontsLoaded && weather) {
    }
  }, [fontsLoaded, weather]);

  const loadFavorites = async () => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const docRef = doc(db, 'favorites', uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setFavorites(snap.data().cities || []);
      }
    } catch (err) {
      console.error('Erreur Firestore favoris :', err);
    }
  };

  const saveFavorites = async (updated: string[]) => {
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      await setDoc(doc(db, 'favorites', uid), { cities: updated });
    } catch (err) {
      console.error('Erreur sauvegarde Firestore :', err);
    }
  };

  const toggleFavorite = async () => {
    let updated: string[];
    if (favorites.includes(city)) {
      updated = favorites.filter(fav => fav !== city);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else {
      updated = [...favorites, city];
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setFavorites(updated);
    await saveFavorites(updated);
  };

  const fetchWeather = async (cityName: string): Promise<void> => {
    setLoading(true);
    try {
      const apiKey = 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
      const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${apiKey}`;
      const geoRes = await axios.get(geoUrl);
      if (geoRes.data.length === 0) throw new Error('Ville introuvable');
      const { lat, lon } = geoRes.data[0];

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;
      const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=fr`;

      const [weatherRes, forecastRes] = await Promise.all([
        axios.get(weatherUrl),
        axios.get(forecastUrl),
      ]);

      setWeather(weatherRes.data);

      type DailyMap = Record<string, {
        min: number;
        max: number;
        icon: string;
      }>;

      const daily: DailyMap = {};
      forecastRes.data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000);
        const day = date.toLocaleDateString('fr-FR', { weekday: 'short' });
        if (!daily[day]) {
          daily[day] = {
            min: item.main.temp_min,
            max: item.main.temp_max,
            icon: item.weather[0].icon,
          };
        } else {
          daily[day].min = Math.min(daily[day].min, item.main.temp_min);
          daily[day].max = Math.max(daily[day].max, item.main.temp_max);
        }
      });

      const forecastArray: ForecastItem[] = Object.entries(daily).slice(0, 3).map(([day, data]) => ({
        day,
        min: data.min,
        max: data.max,
        icon: data.icon,
      }));

      setForecast(forecastArray);
    } catch (error) {
      console.error('Erreur API météo :', error);
    } finally {
      setLoading(false);
      Keyboard.dismiss();
    }
  };

  const night = weather ? isNight(weather.sys.sunrise, weather.sys.sunset) : false;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientForWeather(
          weather?.weather[0]?.main || 'Clear',
          night
        )}
        style={styles.background}
      >
        <View style={styles.center}>
          {loading ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : (
            <>
              <BlurView intensity={20} tint="light" style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Rechercher une ville..."
                  placeholderTextColor="rgba(255,255,255,0.8)"
                  value={city}
                  onChangeText={setCity}
                  onSubmitEditing={() => {
                    fetchWeather(city);
                    Keyboard.dismiss();
                  }}
                />
              </BlurView>

              <View style={styles.header}>
                <TouchableOpacity onPress={toggleFavorite}>
                  <Ionicons
                    name={favorites.includes(city) ? 'heart' : 'heart-outline'}
                    size={32}
                    color="#fff"
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowFavorites(true)}>
                  <Ionicons name="menu" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
              <BlurView intensity={30} tint="light" style={styles.blurContainer}>
                <Text style={styles.title}>{weather.name}</Text>
                <LottieView
                  source={getWeatherAnimation(
                    weather.weather[0].main,
                    isNight(weather.sys.sunrise, weather.sys.sunset)
                  )}
                  autoPlay
                  loop
                  style={styles.icon}
                />
                <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
                <Text style={styles.desc}>{weather.weather[0].description}</Text>

                <View style={styles.forecastRow}>
                  {forecast.map((item: ForecastItem, index: number) => (
                    <View 
                      key={index} 
                      style={styles.forecastItem}
                    >
                      <Text style={styles.forecastDay}>
                        {item.day}
                      </Text>
                      <Image 
                        source={`https://openweathermap.org/img/wn/${item.icon}@2x.png`}
                        style={styles.forecastIcon}
                        contentFit="contain"
                      />
                      <Text style={styles.forecastTemp}>
                        {Math.round(item.min)}° / {Math.round(item.max)}°
                      </Text>
                    </View>
                  ))}
                </View>
              </BlurView>

              <Modal 
                visible={showFavorites} 
                transparent 
                animationType="slide"
              >
                <View style={styles.modalContainer}>
                  <BlurView 
                    intensity={50} 
                    tint="light" 
                    style={styles.modalContent}
                  >
                    <Text style={styles.title}>
                      Mes destinations
                    </Text>

                    {favorites.length === 0 ? (
                      <Text style={styles.desc}>
                        Aucune ville sauvegardée
                      </Text>
                    ) : (
                      favorites.map((fav, i) => (
                        <TouchableOpacity 
                          key={i} 
                          onPress={() => {
                            setCity(fav);
                            setShowFavorites(false);
                            fetchWeather(fav);
                          }}
                        >
                          <Text style={styles.input}>
                            {fav}
                          </Text>
                        </TouchableOpacity>
                      ))
                    )}

                    <TouchableOpacity 
                      onPress={() => setShowFavorites(false)}
                    >
                      <Text style={styles.desc}>
                        Fermer
                      </Text>
                    </TouchableOpacity>
                  </BlurView>
                </View>
              </Modal>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: { 
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  inputContainer: {
    width: width * 0.8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  input: {
    fontSize: 18,
    fontFamily: 'Inter_400Regular',
    color: '#fff',
    textAlign: 'center',
  },
  blurContainer: {
    width: width * 0.8,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    overflow: 'hidden',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    marginBottom: 12,
    color: '#fff',
    fontWeight: '800',
  },
  temp: {
    fontFamily: 'Inter_700Bold',
    fontSize: 72,
    marginBottom: 12,
    color: '#fff',
    fontWeight: '800',
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 12,
  },
  desc: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    color: '#fff',
    textTransform: 'capitalize',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  } as const,
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  forecastItem: {
    alignItems: 'center',
    flex: 1,
  },
  forecastDay: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  forecastTemp: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  forecastIcon: {
    width: 50,
    height: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: width * 0.8,
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: width * 0.8,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
});