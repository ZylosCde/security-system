import * as Location from 'expo-location';

export type GpsCoords = { lat: number; lng: number };

export async function getCurrentGps(): Promise<GpsCoords | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return null;
  }
}
