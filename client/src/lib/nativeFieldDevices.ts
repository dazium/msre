import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { isNativeMobileApp } from "@/lib/mobileRuntime";

export type FieldLocation = {
  latitude: number;
  longitude: number;
  source: "native" | "browser";
};

export const fieldLocationLabel = (source: FieldLocation["source"]) =>
  source === "native" ? "Android GPS location" : "Browser GPS location";

export async function captureNativeCameraFile(): Promise<File | null> {
  if (!isNativeMobileApp()) return null;

  const image = await Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
    source: CameraSource.Camera,
    correctOrientation: true,
  });

  if (!image.webPath) throw new Error("The camera did not return a usable image path.");

  const response = await fetch(image.webPath);
  if (!response.ok) throw new Error("Unable to read the captured image.");

  const blob = await response.blob();
  const format = image.format || "jpeg";
  const mimeType = blob.type || `image/${format === "jpg" ? "jpeg" : format}`;
  return new File([blob], `msre-camera-${Date.now()}.${format}`, { type: mimeType });
}

export async function getFieldLocation(): Promise<FieldLocation> {
  if (isNativeMobileApp()) {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      source: "native",
    };
  }

  if (!globalThis.navigator?.geolocation) {
    throw new Error("Location services are unavailable in this browser.");
  }

  const position = await new Promise<GeolocationPosition>((resolve, reject) => {
    globalThis.navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 0,
    });
  });

  return {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    source: "browser",
  };
}
