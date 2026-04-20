import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Plus, Trash2, Calculator } from 'lucide-react'

interface RoofSection {
  id: string
  name: string
  length: number
  width: number
  pitch: string
  area: number
  squares: number
}

interface RoofMeasurementToolProps {
  onComplete?: (totalArea: number, totalSquares: number, sections: RoofSection[]) => void
}

const PITCH_OPTIONS = [
  { value: '2/12', label: '2/12 (Flat/Low)' },
  { value: '4/12', label: '4/12 (Low)' },
  { value: '6/12', label: '6/12 (Standard)' },
  { value: '8/12', label: '8/12 (Steep)' },
  { value: '10/12', label: '10/12 (Very Steep)' },
  { value: '12/12', label: '12/12 (Extreme)' },
]

export function RoofMeasurementTool({ onComplete }: RoofMeasurementToolProps) {
  const [sections, setSections] = useState<RoofSection[]>([])
  const [currentLength, setCurrentLength] = useState<string>('')
  const [currentWidth, setCurrentWidth] = useState<string>('')
  const [currentPitch, setCurrentPitch] = useState<string>('6/12')
  const [sectionName, setSectionName] = useState<string>('')

  const calculatePitchFactor = (pitch: string) => {
    const [rise, run] = pitch.split('/').map(Number)
    return Math.sqrt(run * run + rise * rise) / run
  }

  const calculateSection = useCallback(() => {
    const length = parseFloat(currentLength)
    const width = parseFloat(currentWidth)

    if (!length || !width || length <= 0 || width <= 0) {
      alert('Please enter valid length and width')
      return
    }

    const pitchFactor = calculatePitchFactor(currentPitch)
    const area = length * width * pitchFactor
    const squares = area / 100

    const newSection: RoofSection = {
      id: Date.now().toString(),
      name: sectionName || `Section ${sections.length + 1}`,
      length,
      width,
      pitch: currentPitch,
      area: Math.round(area * 100) / 100,
      squares: Math.round(squares * 100) / 100,
    }

    setSections([...sections, newSection])
    setCurrentLength('')
    setCurrentWidth('')
    setSectionName('')
    setCurrentPitch('6/12')
  }, [currentLength, currentWidth, currentPitch, sectionName, sections])

  const removeSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id))
  }

  const totalArea = sections.reduce((sum, s) => sum + s.area, 0)
  const totalSquares = sections.reduce((sum, s) => sum + s.squares, 0)

  const handleComplete = () => {
    if (sections.length === 0) {
      alert('Please add at least one roof section')
      return
    }
    onComplete?.(totalArea, totalSquares, sections)
  }

  return (
    <div className="w-full space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            On-Site Roof Measurement
          </CardTitle>
          <CardDescription>
            Input roof dimensions as you measure them. Add multiple sections for complex roofs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Measure the building footprint (length × width) and select the roof pitch. The calculator automatically accounts for slope.
            </AlertDescription>
          </Alert>

          <div className="space-y-4 bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold">Add Roof Section</h3>

            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name (Optional)</Label>
              <Input
                id="section-name"
                placeholder="e.g., Main Roof, Front Gable, Garage"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
              />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Give this section a name to organize complex roofs
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="length">Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  placeholder="e.g., 40"
                  value={currentLength}
                  onChange={(e) => setCurrentLength(e.target.value)}
                  min="0"
                  step="0.1"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  placeholder="e.g., 30"
                  value={currentWidth}
                  onChange={(e) => setCurrentWidth(e.target.value)}
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitch">Roof Pitch</Label>
              <Select value={currentPitch} onValueChange={setCurrentPitch}>
                <SelectTrigger id="pitch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PITCH_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Rise/run ratio (e.g., 6/12 = 6 inches up per 12 inches horizontal)
              </p>
            </div>

            <Button
              onClick={calculateSection}
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={!currentLength || !currentWidth}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add This Section
            </Button>
          </div>

          {sections.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Measured Sections ({sections.length})</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg flex justify-between items-start"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{section.name}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {section.length} ft × {section.width} ft | Pitch: {section.pitch}
                      </div>
                      <div className="flex gap-4 mt-2">
                        <div>
                          <p className="text-xs text-gray-500">Area</p>
                          <p className="font-semibold text-sm">{section.area.toLocaleString()} sq ft</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Squares</p>
                          <p className="font-semibold text-sm">{section.squares}</p>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(section.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {sections.length > 0 && (
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold text-lg">📊 Total Measurements</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400">Total Roof Area</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {totalArea.toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">square feet</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Total Squares</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {totalSquares}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">(100 sq ft each)</p>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Sections Measured:</strong> {sections.length}
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                  <strong>Average Pitch:</strong> {sections[0]?.pitch || 'N/A'}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleComplete}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Use These Measurements
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSections([])}
                  className="flex-1"
                >
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
