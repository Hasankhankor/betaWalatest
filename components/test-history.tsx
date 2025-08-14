import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, ExternalLink, Download } from "lucide-react"

interface TestHistoryProps {
  history: any[]
}

export function TestHistory({ history }: TestHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Test History</h3>
          <p className="text-muted-foreground">Your completed tests will appear here</p>
        </CardContent>
      </Card>
    )
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (score >= 70) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Poor</Badge>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Test History
        </CardTitle>
        <CardDescription>View and compare your previous performance tests</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {history.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium">{test.url}</span>
                  {getScoreBadge(test.overallScore)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Score: {test.overallScore}</span>
                  <span>Load: {test.loadTime}s</span>
                  <span>Requests: {test.totalRequests}</span>
                  <span>{new Date(test.timestamp).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
