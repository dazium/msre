import React, { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Calculator } from 'lucide-react'

interface RoofMeasurementProps {
  onCalculate?: (area: number, squares: number) => void
}

export function RoofMeasurement({ onCalculate }: RoofMeasurementProps) {
  const [measurementType, setMeasurementType] = useState<'simple' | 'advanced'>('simple')
  const [length, setLength] = useState<number>(0)
  const [width, setWidth] = useState<number>(0)
  const [pitch, setPitch] = useState<string>('6/12')
  const [roofArea, setRoofArea] = useState<number>(0)
  const [roofSquares, setRoofSquares] = useState<number>(0)

  // Calculate roof area from dimensions
  const calculateArea = useCallback(() => {
    if (length <= 0 || width <= 0) {
      alert('Please enter valid length and width')
      return
    }

    // Parse pitch (e.g., "6/12" -> 6/12 = 0.5)
    const [rise, run] = pitch.split('/').map(Number)
    const pitchFactor = rise / run

    // Calculate the diagonal length accounting for pitch
    // Using Pythagorean theorem: diagonal = sqrt(run^2 + rise^2) / run
    const diagonalFactor = Math.sqrt(run * run + rise * rise) / run

    // Calculate roof area accounting for pitch
    const calculatedArea = length * width * diagonalFactor

    // Calculate roofing squares (1 square = 100 sq ft)
    const squares = calculatedArea / 100

    setRoofArea(Math.round(calculatedArea * 100) / 100)
    setRoofSquares(Math.round(squares * 100) / 100)

    onCalculate?.(calculatedArea, squares)
  }, [length, width, pitch, onCalculate])

  const handleAdvancedCalculation = () => {
    calculateArea()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Roof Measurement Calculator
        </CardTitle>
        <CardDescription>
          Calculate roof area and squares from building dimensions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="simple" onValueChange={(v) => setMeasurementType(v as 'simple' | 'advanced')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple">Simple Measurement</TabsTrigger>
            <TabsTrigger value="advanced">Advanced Calculation</TabsTrigger>
          </TabsList>

          <TabsContent value="simple" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Enter the building footprint dimensions. The calculator will automatically account for roof pitch.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="length">Building Length (ft)</Label>
                <Input
                  id="length"
                  type="number"
                  value={length || ''}
                  onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 40"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">Length of the building</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="width">Building Width (ft)</Label>
                <Input
                  id="width"
                  type="number"
                  value={width || ''}
                  onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 30"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">Width of the building</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pitch">Roof Pitch</Label>
              <Select value={pitch} onValueChange={setPitch}>
                <SelectTrigger id="pitch">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2/12">2/12 (Flat/Low)</SelectItem>
                  <SelectItem value="4/12">4/12 (Low)</SelectItem>
                  <SelectItem value="6/12">6/12 (Standard)</SelectItem>
                  <SelectItem value="8/12">8/12 (Steep)</SelectItem>
                  <SelectItem value="10/12">10/12 (Very Steep)</SelectItem>
                  <SelectItem value="12/12">12/12 (Extreme)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Rise over run (e.g., 6/12 means 6 inches rise per 12 inches run)
              </p>
            </div>

            <Button onClick={calculateArea} className="w-full bg-blue-600 hover:bg-blue-700">
              Calculate Roof Area
            </Button>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For complex roofs with multiple sections, calculate each section separately and add the totals.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="adv-length">Building Length (ft)</Label>
                  <Input
                    id="adv-length"
                    type="number"
                    value={length || ''}
                    onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 40"
                    min="0"
                    step="0.1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adv-width">Building Width (ft)</Label>
                  <Input
                    id="adv-width"
                    type="number"
                    value={width || ''}
                    onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 30"
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adv-pitch">Roof Pitch</Label>
                <Select value={pitch} onValueChange={setPitch}>
                  <SelectTrigger id="adv-pitch">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2/12">2/12 (Flat/Low)</SelectItem>
                    <SelectItem value="4/12">4/12 (Low)</SelectItem>
                    <SelectItem value="6/12">6/12 (Standard)</SelectItem>
                    <SelectItem value="8/12">8/12 (Steep)</SelectItem>
                    <SelectItem value="10/12">10/12 (Very Steep)</SelectItem>
                    <SelectItem value="12/12">12/12 (Extreme)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Calculation Formula:</strong> Area = Length × Width × Pitch Factor
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  The pitch factor accounts for the slope of the roof, making the actual roof area larger than the building footprint.
                </p>
              </div>

              <Button onClick={handleAdvancedCalculation} className="w-full bg-blue-600 hover:bg-blue-700">
                Calculate Roof Area
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {roofArea > 0 && (
          <div className="border-t pt-4 space-y-3">
            <h3 className="font-semibold text-lg">📐 Calculation Results</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400">Roof Area</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{roofArea.toLocaleString()} sq ft</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">Roofing Squares</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{roofSquares}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">(100 sq ft each)</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Building Footprint:</strong> {length} ft × {width} ft = {(length * width).toLocaleString()} sq ft
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                <strong>Roof Pitch:</strong> {pitch} (increases area by {(((roofArea / (length * width)) - 1) * 100).toFixed(1)}%)
              </p>
            </div>

            <Button variant="outline" onClick={() => {
              setRoofArea(0)
              setRoofSquares(0)
              setLength(0)
              setWidth(0)
            }} className="w-full">
              Clear Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
