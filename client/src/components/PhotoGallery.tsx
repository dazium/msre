import { useState } from "react";
import { X, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Photo {
  id: number;
  fileName: string;
  fileUrl: string;
  caption?: string | null;
  createdAt: Date;
}

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: number) => void;
  onUpdateCaption?: (photoId: number, caption: string) => void;
  isLoading?: boolean;
}

export function PhotoGallery({
  photos,
  onDelete,
  onUpdateCaption,
  isLoading = false,
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editCaption, setEditCaption] = useState("");

  const handleEditCaption = (photo: Photo) => {
    setEditCaption(photo.caption || "");
    setIsEditingCaption(true);
  };

  const handleSaveCaption = async () => {
    if (selectedPhoto && onUpdateCaption) {
      onUpdateCaption(selectedPhoto.id, editCaption);
      setIsEditingCaption(false);
      toast.success("Caption updated");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading photos...</div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">No photos yet</div>
        <p className="text-sm text-muted-foreground">Upload photos to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative overflow-hidden rounded-lg border border-border bg-card"
          >
            <img
              src={photo.fileUrl}
              alt={photo.fileName}
              className="aspect-square w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/40" />

            {/* Overlay actions */}
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => setSelectedPhoto(photo)}
                className="gap-2"
              >
                View
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => handleEditCaption(photo)}
                className="gap-2"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              {onDelete && (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this photo?")) {
                      onDelete(photo.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Caption */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                <p className="text-xs text-white line-clamp-2">{photo.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Photo viewer dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.fileName}</DialogTitle>
          </DialogHeader>
          {selectedPhoto && (
            <div className="space-y-4">
              <img
                src={selectedPhoto.fileUrl}
                alt={selectedPhoto.fileName}
                className="w-full rounded-lg"
              />
              {selectedPhoto.caption && (
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-sm">{selectedPhoto.caption}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleEditCaption(selectedPhoto)}
                  className="gap-2"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit Caption
                </Button>
                {onDelete && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Delete this photo?")) {
                        onDelete(selectedPhoto.id);
                        setSelectedPhoto(null);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit caption dialog */}
      <Dialog open={isEditingCaption} onOpenChange={setIsEditingCaption}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Photo Caption</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter photo caption..."
              value={editCaption}
              onChange={(e) => setEditCaption(e.target.value)}
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingCaption(false)}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveCaption}>
                Save Caption
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
