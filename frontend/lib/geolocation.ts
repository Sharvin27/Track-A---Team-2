import { haversineDistanceMeters } from "@/lib/distance";
import type { RoutePoint } from "@/types/tracker";

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10000,
};

const MAX_ACCEPTED_ACCURACY_METERS = 80;
const MIN_MOVEMENT_METERS = 4;

export function createRoutePoint(position: GeolocationPosition): RoutePoint {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    timestamp: new Date(position.timestamp).toISOString(),
    accuracy: position.coords.accuracy,
  };
}

export function getGeolocationErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied. Enable it in your browser to track a session.";
    case error.POSITION_UNAVAILABLE:
      return "Your location is unavailable right now. Try moving to an area with better signal.";
    case error.TIMEOUT:
      return "Location lookup timed out. Try again in a few seconds.";
    default:
      return "Unable to access your location right now.";
  }
}

export function shouldAppendRoutePoint(points: RoutePoint[], nextPoint: RoutePoint) {
  if (
    typeof nextPoint.accuracy === "number" &&
    nextPoint.accuracy > MAX_ACCEPTED_ACCURACY_METERS
  ) {
    return false;
  }

  const previousPoint = points[points.length - 1];

  if (!previousPoint) {
    return true;
  }

  if (
    previousPoint.lat === nextPoint.lat &&
    previousPoint.lng === nextPoint.lng &&
    previousPoint.timestamp === nextPoint.timestamp
  ) {
    return false;
  }

  return haversineDistanceMeters(previousPoint, nextPoint) >= MIN_MOVEMENT_METERS;
}

export function startLocationWatch(
  onSuccess: PositionCallback,
  onError: PositionErrorCallback,
  options?: PositionOptions,
) {
  if (!("geolocation" in navigator)) {
    throw new Error("Geolocation is not supported by this browser.");
  }

  return navigator.geolocation.watchPosition(onSuccess, onError, {
    ...DEFAULT_OPTIONS,
    ...options,
  });
}

export function stopLocationWatch(watchId: number | null) {
  if (watchId !== null && "geolocation" in navigator) {
    navigator.geolocation.clearWatch(watchId);
  }
}
