export function hasValidMapCoordinates(latitude: string, longitude: string) {
  if (!latitude.trim() || !longitude.trim()) return false;

  const lat = Number(latitude);
  const lng = Number(longitude);

  return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

export function canSaveAddress(address: string, isValidated: boolean) {
  return !address.trim() || isValidated;
}
