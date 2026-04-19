import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapView } from "@/components/Map";
import { useEffect, useRef } from "react";

interface AddressMapModalProps {
  address: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AddressMapModal({ address, isOpen, onClose }: AddressMapModalProps) {
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (isOpen && address && mapRef.current && window.google?.maps?.Geocoder) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          const location = results[0].geometry.location;
          mapRef.current?.setCenter(location);
          mapRef.current?.setZoom(15);
          new google.maps.Marker({
            map: mapRef.current,
            position: location,
            title: address,
          });
        }
      });
    }
  }, [isOpen, address]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{address}</DialogTitle>
        </DialogHeader>
        <div className="h-96 rounded-lg overflow-hidden">
          <MapView
            onMapReady={(map) => {
              mapRef.current = map;
              if (address && window.google?.maps?.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ address }, (results, status) => {
                  if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
                    const location = results[0].geometry.location;
                    map.setCenter(location);
                    map.setZoom(15);
                    new google.maps.Marker({
                      map,
                      position: location,
                      title: address,
                    });
                  }
                });
              }
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
