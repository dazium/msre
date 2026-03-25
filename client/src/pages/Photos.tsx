import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { PhotoUpload } from "@/components/PhotoUpload";
import { PhotoGallery } from "@/components/PhotoGallery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Photos() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/photos/:projectId");
  const projectId = params?.projectId ? parseInt(params.projectId) : 0;

  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [showDamageLink, setShowDamageLink] = useState(false);
  const [selectedDamageId, setSelectedDamageId] = useState<string>("");

  // Queries
  const { data: project } = trpc.projects.getById.useQuery(
    { id: projectId },
    { enabled: projectId > 0 }
  );

  const { data: photos, refetch: refetchPhotos } = trpc.photos.listByProject.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const { data: damages } = trpc.damages.list.useQuery();

  // Mutations
  const createPhotoMutation = trpc.photos.create.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Photo added successfully");
    },
    onError: () => {
      toast.error("Failed to add photo");
    },
  });

  const deletePhotoMutation = trpc.photos.delete.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Photo deleted");
    },
    onError: () => {
      toast.error("Failed to delete photo");
    },
  });

  const updatePhotoMutation = trpc.photos.update.useMutation({
    onSuccess: () => {
      refetchPhotos();
      toast.success("Caption updated");
    },
    onError: () => {
      toast.error("Failed to update caption");
    },
  });

  const linkToDamageMutation = trpc.photos.linkToDamage.useMutation({
    onSuccess: () => {
      setShowDamageLink(false);
      setSelectedPhotoId(null);
      setSelectedDamageId("");
      toast.success("Photo linked to damage");
    },
    onError: () => {
      toast.error("Failed to link photo to damage");
    },
  });

  const handlePhotoUpload = (fileUrl: string, fileName: string, fileKey: string) => {
    createPhotoMutation.mutate({
      projectId,
      fileName,
      fileUrl,
      fileKey,
    });
  };

  const handleDeletePhoto = (photoId: number) => {
    deletePhotoMutation.mutate({ id: photoId });
  };

  const handleUpdateCaption = (photoId: number, caption: string) => {
    updatePhotoMutation.mutate({ id: photoId, caption });
  };

  const handleLinkToDamage = () => {
    if (!selectedPhotoId || !selectedDamageId) {
      toast.error("Please select both photo and damage");
      return;
    }
    linkToDamageMutation.mutate({
      photoId: selectedPhotoId,
      damageId: parseInt(selectedDamageId),
    });
  };

  const projectDamages = damages?.filter((d) => d.projectId === projectId) || [];

  if (!projectId) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">No project selected</p>
          <Button variant="outline" onClick={() => setLocation("/projects")} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/projects")}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Project Photos</h1>
          {project && (
            <p className="text-muted-foreground">{project.title}</p>
          )}
        </div>
      </div>

      {/* Upload section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Photos</CardTitle>
          <CardDescription>
            Add photos of the roof and problem areas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhotoUpload projectId={projectId} onUploadComplete={handlePhotoUpload} />
        </CardContent>
      </Card>

      {/* Photo gallery */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Photo Gallery</CardTitle>
            <CardDescription>
              {photos?.length || 0} photos uploaded
            </CardDescription>
          </div>
          {photos && photos.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDamageLink(true)}
            >
              Link to Damage
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <PhotoGallery
            photos={photos || []}
            onDelete={handleDeletePhoto}
            onUpdateCaption={handleUpdateCaption}
          />
        </CardContent>
      </Card>

      {/* Link to damage dialog */}
      <Dialog open={showDamageLink} onOpenChange={setShowDamageLink}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Photo to Damage</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Select Photo</label>
              <Select value={selectedPhotoId?.toString() || ""} onValueChange={(val) => setSelectedPhotoId(parseInt(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a photo..." />
                </SelectTrigger>
                <SelectContent>
                  {photos?.map((photo) => (
                    <SelectItem key={photo.id} value={photo.id.toString()}>
                      {photo.fileName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Select Damage</label>
              <Select value={selectedDamageId} onValueChange={setSelectedDamageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a damage..." />
                </SelectTrigger>
                <SelectContent>
                  {projectDamages.map((damage) => (
                    <SelectItem key={damage.id} value={damage.id.toString()}>
                      {damage.description} ({damage.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {projectDamages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No damages found for this project. Add damages first.
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDamageLink(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleLinkToDamage}
                disabled={!selectedPhotoId || !selectedDamageId || projectDamages.length === 0}
              >
                Link Photo
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
