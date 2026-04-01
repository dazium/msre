import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string) => void;
  onLocationSelect: (location: { address: string; city: string; state: string; zipCode: string; latitude: string; longitude: string }) => void;
  placeholder?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Enter address",
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const autocompleteRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    // Initialize Google Maps services when component mounts
    const initializeGoogleMaps = async () => {
      if (window.google?.maps?.places) {
        autocompleteRef.current = new google.maps.places.AutocompleteService();
        geocoderRef.current = new google.maps.Geocoder();
      }
    };

    initializeGoogleMaps();
  }, []);

  const handlePlaceSelect = async (placeId: string) => {
    if (!geocoderRef.current) return;

    setIsLoading(true);
    try {
      const result = await geocoderRef.current.geocode({ placeId });
      
      if (result.results && result.results.length > 0) {
        const place = result.results[0];
        const address = place.formatted_address;
        
        // Extract address components
        let streetAddress = "";
        let city = "";
        let state = "";
        let zipCode = "";

        place.address_components.forEach((component) => {
          const types = component.types;
          if (types.includes("street_number")) {
            streetAddress = component.long_name + " " + streetAddress;
          }
          if (types.includes("route")) {
            streetAddress = streetAddress + component.long_name;
          }
          if (types.includes("locality")) {
            city = component.long_name;
          }
          if (types.includes("administrative_area_level_1")) {
            state = component.short_name;
          }
          if (types.includes("postal_code")) {
            zipCode = component.long_name;
          }
        });

        const latitude = place.geometry?.location?.lat().toString() || "";
        const longitude = place.geometry?.location?.lng().toString() || "";

        onChange(address);
        onLocationSelect({
          address: streetAddress || address,
          city,
          state,
          zipCode,
          latitude,
          longitude,
        });
      }
    } catch (error) {
      console.error("Geocoding error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);

    // Show autocomplete suggestions
    if (inputValue.length > 2 && autocompleteRef.current) {
      autocompleteRef.current.getPlacePredictions(
        {
          input: inputValue,
          componentRestrictions: { country: "ca" }, // Restrict to Canada for Ontario
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Display predictions in a dropdown (simplified - you could create a custom dropdown)
            const dropdown = document.getElementById("address-suggestions");
            if (dropdown) {
              dropdown.innerHTML = predictions
                .slice(0, 5)
                .map(
                  (prediction) =>
                    `<div class="p-2 cursor-pointer hover:bg-gray-100" onclick="window.selectAddress('${prediction.place_id}', '${prediction.description}')">${prediction.description}</div>`
                )
                .join("");
              dropdown.style.display = "block";
            }
          }
        }
      );
    }
  };

  // Store the handler globally for onclick
  useEffect(() => {
    (window as any).selectAddress = (placeId: string, mainText: string) => {
      onChange(mainText);
      const dropdown = document.getElementById("address-suggestions");
      if (dropdown) {
        dropdown.style.display = "none";
      }
      handlePlaceSelect(placeId);
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Address</Label>
      <div className="relative">
        <Input
          ref={inputRef}
          id="address"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={isLoading}
        />
        <div
          id="address-suggestions"
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md mt-1 shadow-lg z-10 hidden max-h-48 overflow-y-auto"
        />
      </div>
    </div>
  );
}
