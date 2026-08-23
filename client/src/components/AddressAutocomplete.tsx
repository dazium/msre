import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadGoogleMaps } from "@/components/Map";
import { hasValidMapCoordinates } from "@/lib/addressValidation";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect: (location: { address: string; city: string; state: string; zipCode: string; latitude: string; longitude: string }) => void;
  onValidationChange?: (isValidated: boolean) => void;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  onValidationChange,
  placeholder = "Enter address",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const suggestionId = `${inputId}-suggestions`;
  const validationId = `${inputId}-validation`;
  const [isLoading, setIsLoading] = useState(false);
  const [isMapsReady, setIsMapsReady] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [isValidated, setIsValidated] = useState(false);
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    let isMounted = true;

    loadGoogleMaps()
      .then(() => {
        if (!isMounted) return;
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        geocoderRef.current = new google.maps.Geocoder();
        setIsMapsReady(true);
      })
      .catch(() => {
        if (!isMounted) return;
        setValidationMessage("Google address lookup could not load. Retry before saving an address.");
        onValidationChange?.(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const updateValidation = (validated: boolean, message: string | null) => {
    setIsValidated(validated);
    setValidationMessage(message);
    onValidationChange?.(validated);
  };

  const handlePlaceSelect = async (placeId: string) => {
    if (!geocoderRef.current) {
      updateValidation(false, "Google address lookup is still loading. Please try again.");
      return;
    }

    setIsLoading(true);
    setPredictions([]);
    try {
      const result = await geocoderRef.current.geocode({ placeId });
      const place = result.results?.[0];

      if (!place) {
        updateValidation(false, "That address could not be validated. Choose another Google suggestion.");
        return;
      }

      let streetAddress = "";
      let city = "";
      let state = "";
      let zipCode = "";

      place.address_components.forEach((component) => {
        const types = component.types;
        if (types.includes("street_number")) streetAddress = `${component.long_name} ${streetAddress}`;
        if (types.includes("route")) streetAddress = `${streetAddress}${component.long_name}`;
        if (types.includes("locality")) city = component.long_name;
        if (types.includes("administrative_area_level_1")) state = component.short_name;
        if (types.includes("postal_code")) zipCode = component.long_name;
      });

      const latitude = place.geometry?.location?.lat().toString() || "";
      const longitude = place.geometry?.location?.lng().toString() || "";
      if (!hasValidMapCoordinates(latitude, longitude)) {
        updateValidation(false, "Google returned an address without a usable map location. Choose another suggestion.");
        return;
      }

      const address = place.formatted_address;
      onChange(address);
      onLocationSelect({
        address: streetAddress.trim() || address,
        city,
        state,
        zipCode,
        latitude,
        longitude,
      });
      updateValidation(true, "Validated by Google Maps. The verified address and map location are ready to save.");
    } catch (error) {
      console.error("Geocoding error:", error);
      updateValidation(false, "That address could not be validated. Check the connection and choose a suggestion again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    onChange(inputValue);
    setPredictions([]);

    if (!inputValue.trim()) {
      updateValidation(false, null);
      return;
    }

    updateValidation(false, isMapsReady ? "Select a Google address suggestion to validate this location." : "Loading Google address lookup…");
    if (inputValue.length < 3 || !autocompleteRef.current) return;

    autocompleteRef.current.getPlacePredictions(
      { input: inputValue, componentRestrictions: { country: "ca" } },
      (nextPredictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && nextPredictions) {
          setPredictions(nextPredictions.slice(0, 5));
          return;
        }

        setPredictions([]);
        if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          setValidationMessage("No validated Canadian addresses matched. Refine the address or try another search.");
        }
      },
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>Address</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isLoading}
          autoComplete="off"
          aria-describedby={validationMessage ? validationId : undefined}
          aria-invalid={value.trim().length > 0 && !isValidated}
        />
        {predictions.length > 0 && (
          <div id={suggestionId} className="absolute top-full left-0 right-0 z-20 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
            {predictions.map((prediction) => (
              <button
                key={prediction.place_id}
                type="button"
                onClick={() => handlePlaceSelect(prediction.place_id)}
                className="block min-h-11 w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
              >
                {prediction.description}
              </button>
            ))}
          </div>
        )}
      </div>
      {validationMessage && (
        <p id={validationId} role={isValidated ? "status" : "alert"} className={isValidated ? "text-sm text-emerald-600 dark:text-emerald-400" : "text-sm text-amber-700 dark:text-amber-300"}>
          {validationMessage}
        </p>
      )}
    </div>
  );
}
