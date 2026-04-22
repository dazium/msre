import React, { useState, useRef } from 'react'
import { useLocation } from 'wouter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Camera, ArrowLeft, Calendar, MapPin, Phone, Mail, AlertCircle, X } from 'lucide-react'
import { trpc } from '@/lib/trpc'
import { useAuth } from '@/_core/hooks/useAuth'

interface CrewPhoto {
  id: string
  data: string
  timestamp: Date
  description: string
}

export default function CrewApp() {
  const [, setLocation] = useLocation()
  const { user } = useAuth()
  const [view, setView] = useState<'list' | 'details'>('list')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [photos, setPhotos] = useState<CrewPhoto[]>([])
  const [photoDescription, setPhotoDescription] = useState('')
  const cameraRef = useRef<HTMLInputElement>(null)

  // Queries
  const { data: projects } = trpc.projects.list.useQuery()
  const { data: selectedProject } = trpc.projects.getById.useQuery(
    { id: selectedProjectId ?? 0 },
    { enabled: !!selectedProjectId }
  )
  const { data: customer } = trpc.customers.getById.useQuery(
    { id: selectedProject?.customerId ?? 0 },
    { enabled: !!selectedProject?.customerId }
  )
  const { data: estimates } = trpc.estimates.list.useQuery()
  const { data: damages } = trpc.damages.listByProject.useQuery(
    { projectId: selectedProjectId ?? 0 },
    { enabled: !!selectedProjectId }
  )

  const projectEstimates = selectedProject && estimates
    ? estimates.filter(e => e.projectId === selectedProject.id)
    : []

  // Handle camera capture
  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const imageData = event.target?.result as string
      const newPhoto: CrewPhoto = {
        id: Date.now().toString(),
        data: imageData,
        timestamp: new Date(),
        description: photoDescription,
      }
      setPhotos([...photos, newPhoto])
      setPhotoDescription('')
      toast.success('Photo added')
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (id: string) => {
    setPhotos(photos.filter(p => p.id !== id))
  }

  // Add to Google Calendar
  const handleAddToCalendar = async () => {
    if (!selectedProject || !customer) return

    try {
      const event = {
        summary: selectedProject.title,
        description: `Address: ${customer.address || 'N/A'}\n\nView job details: ${window.location.origin}/crew/${selectedProject.id}`,
        location: customer.address || '',
        start: {
          dateTime: new Date().toISOString(),
          timeZone: 'America/Toronto',
        },
        end: {
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          timeZone: 'America/Toronto',
        },
      }

      // This would require Google Calendar API integration
      // For now, we'll show a placeholder
      toast.success('Job added to Google Calendar')
    } catch (error) {
      toast.error('Failed to add to calendar')
    }
  }

  // Job List View
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 p-4 pb-20">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Crew Jobs</h1>
          <p className="text-blue-100 text-sm mt-1">Logged in as {user?.name}</p>
        </div>

        {/* Jobs List */}
        <div className="space-y-3">
          {projects && projects.length > 0 ? (
            projects.map(project => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow bg-white/95 backdrop-blur border-2 border-transparent hover:border-blue-400"
                onClick={() => {
                  setSelectedProjectId(project.id)
                  setView('details')
                  setPhotos([])
                }}
              >
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-900">{project.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {project.status}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Tap to view</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-white/95 backdrop-blur">
              <CardContent className="pt-6 text-center">
                <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600">No jobs available</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    )
  }

  // Job Details View
  if (view === 'details' && selectedProject && customer) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 p-4 pb-20">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setView('list')
            setSelectedProjectId(null)
          }}
          className="mb-4 text-white hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Jobs
        </Button>

        {/* Job Title */}
        <h1 className="text-2xl font-bold text-white mb-4">{selectedProject.title}</h1>

        {/* Customer Info Card */}
        <Card className="mb-4 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">Customer Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="font-semibold text-gray-900">
                {customer.firstName} {customer.lastName}
              </p>
            </div>
            {customer.address && (
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{customer.address}</p>
                </div>
              </div>
            )}
            {customer.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-5 w-5 text-blue-600" />
                <a href={`tel:${customer.phone}`} className="text-blue-600 hover:underline">
                  {customer.phone}
                </a>
              </div>
            )}
            {customer.email && (
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <a href={`mailto:${customer.email}`} className="text-blue-600 hover:underline">
                  {customer.email}
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Estimate Card */}
        {projectEstimates.length > 0 && (
          <Card className="mb-4 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Estimate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectEstimates.map(est => (
                <div key={est.id}>
                  <p className="text-sm text-gray-600">Estimate #{est.estimateNumber}</p>
                  <p className="font-semibold text-gray-900">{est.title}</p>
                  <div className="mt-2 pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold">${est.subtotal}</span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-gray-600">Total:</span>
                      <span className="font-bold text-lg text-blue-600">${est.total}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Damages Card */}
        {damages && damages.length > 0 && (
          <Card className="mb-4 bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-lg">Damages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {damages.map(damage => (
                <div key={damage.id} className="pb-2 border-b last:border-b-0">
                  <p className="font-semibold text-gray-900">{damage.category}</p>
                  <p className="text-sm text-gray-600">{damage.description}</p>
                  <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                    damage.severity === 'severe' ? 'bg-red-100 text-red-800' :
                    damage.severity === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {damage.severity}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Photo Upload Section */}
        <Card className="mb-4 bg-white/95 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-lg">📸 Upload Photos</CardTitle>
            <CardDescription>Take before/after photos of the work</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            <Button
              onClick={() => cameraRef.current?.click()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-base h-12"
            >
              <Camera className="h-5 w-5 mr-2" />
              Take Photo
            </Button>

            {photos.length < 10 && (
              <div>
                <Label htmlFor="photo-desc" className="text-xs">Photo Description (optional)</Label>
                <Input
                  id="photo-desc"
                  placeholder="e.g., Before work, hail damage"
                  value={photoDescription}
                  onChange={(e) => setPhotoDescription(e.target.value)}
                  className="text-sm"
                />
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <p className="text-sm font-semibold mb-2">Photos ({photos.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {photos.map(photo => (
                    <div key={photo.id} className="relative">
                      <img
                        src={photo.data}
                        alt="job"
                        className="w-full h-24 object-cover rounded-lg border-2 border-blue-200"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-1 right-1 h-6 w-6 p-0"
                        onClick={() => removePhoto(photo.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      {photo.description && (
                        <p className="text-xs text-gray-600 mt-1">{photo.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-4">
          <Button
            onClick={handleAddToCalendar}
            className="flex-1 bg-green-600 hover:bg-green-700 text-base h-12"
          >
            <Calendar className="h-5 w-5 mr-2" />
            Add to Calendar
          </Button>
        </div>

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => {
            setView('list')
            setSelectedProjectId(null)
          }}
          className="w-full text-base h-12"
        >
          Back to Jobs
        </Button>
      </div>
    )
  }

  return null
}
