import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Settings, Monitor, Smartphone, Link, FileText } from "lucide-react"

export function TestConfiguration() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Test Configuration
        </CardTitle>
        <CardDescription>Customize your performance testing parameters</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Types */}
        <div className="space-y-4">
          <Label className="text-base font-medium">Test Types</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="load-test" defaultChecked />
              <Label htmlFor="load-test" className="flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                Load Performance Test
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="mobile-test" defaultChecked />
              <Label htmlFor="mobile-test" className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                Mobile Responsiveness
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="link-check" defaultChecked />
              <Label htmlFor="link-check" className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                Broken Link Detection
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="form-test" />
              <Label htmlFor="form-test" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Form Interaction Test
              </Label>
            </div>
          </div>
        </div>

        {/* Load Test Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="concurrent">Concurrent Users</Label>
            <Select defaultValue="10">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 User</SelectItem>
                <SelectItem value="5">5 Users</SelectItem>
                <SelectItem value="10">10 Users</SelectItem>
                <SelectItem value="25">25 Users</SelectItem>
                <SelectItem value="50">50 Users</SelectItem>
                <SelectItem value="100">100 Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="duration">Test Duration (seconds)</Label>
            <Input id="duration" type="number" defaultValue="30" min="10" max="300" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="browsers">Browser Testing</Label>
            <Select defaultValue="chrome">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chrome">Chrome Only</SelectItem>
                <SelectItem value="firefox">Firefox Only</SelectItem>
                <SelectItem value="safari">Safari Only</SelectItem>
                <SelectItem value="all">All Browsers</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
