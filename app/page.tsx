"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { TestConfiguration } from "@/components/test-configuration"
import { TestResults } from "@/components/test-results"
import { TestHistory } from "@/components/test-history"
import { Globe, Zap, CheckCircle, Clock, Users, Eye, Monitor, AlertTriangle } from "lucide-react"

export default function BetaWalaTest() {
  const [url, setUrl] = useState("")
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<any>(null)
  const [testHistory, setTestHistory] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [realtimeMetrics, setRealtimeMetrics] = useState<any>({})
  const [previewError, setPreviewError] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const previewRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (isRunning && url) {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
      const wsUrl = `${protocol}//${window.location.host}/api/websocket`

      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === "metrics") {
            setRealtimeMetrics(data.metrics)
          } else if (data.type === "progress") {
            setProgress(data.progress)
            setCurrentTest(data.status)
          }
        } catch (e) {
          console.error("WebSocket message error:", e)
        }
      }

      return () => {
        wsRef.current?.close()
      }
    }
  }, [isRunning, url])

  const isValidUrl = (urlString: string) => {
    try {
      const url = new URL(urlString)
      return url.protocol === "http:" || url.protocol === "https:"
    } catch {
      // Check for localhost patterns
      const localhostPatterns = [
        /^localhost:\d+$/,
        /^127\.0\.0\.1:\d+$/,
        /^192\.168\.\d+\.\d+:\d+$/,
        /^10\.\d+\.\d+\.\d+:\d+$/,
      ]

      return localhostPatterns.some((pattern) => pattern.test(urlString))
    }
  }

  const formatUrl = (inputUrl: string) => {
    if (!inputUrl) return ""

    // If it's already a full URL, return as is
    if (inputUrl.startsWith("http://") || inputUrl.startsWith("https://")) {
      return inputUrl
    }

    // For localhost patterns, add http://
    const localhostPatterns = [
      /^localhost:\d+/,
      /^127\.0\.0\.1:\d+/,
      /^192\.168\.\d+\.\d+:\d+/,
      /^10\.\d+\.\d+\.\d+:\d+/,
    ]

    if (localhostPatterns.some((pattern) => pattern.test(inputUrl))) {
      return `http://${inputUrl}`
    }

    // For other URLs, add https://
    return `https://${inputUrl}`
  }

  const handlePreviewLoad = () => {
    setPreviewLoading(false)
    setPreviewError(false)
  }

  const handlePreviewError = () => {
    setPreviewLoading(false)
    setPreviewError(true)
  }

  const showWebsitePreview = () => {
    setShowPreview(true)
    setPreviewLoading(true)
    setPreviewError(false)
  }

  const runPerformanceTest = async () => {
    const formattedUrl = formatUrl(url)
    if (!isValidUrl(formattedUrl)) return

    setIsRunning(true)
    setProgress(0)
    setCurrentTest("Initializing test...")
    setTestResults(null)
    setShowPreview(true)
    setPreviewLoading(true)
    setPreviewError(false)

    try {
      const response = await fetch("/api/performance-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formattedUrl, testConfig: getTestConfig() }),
      })

      if (!response.ok) throw new Error("Test failed")

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response stream")

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split("\n").filter((line) => line.trim())

        for (const line of lines) {
          try {
            const data = JSON.parse(line)
            if (data.progress !== undefined) setProgress(data.progress)
            if (data.status) setCurrentTest(data.status)
            if (data.metrics) setRealtimeMetrics(data.metrics)
            if (data.results) {
              console.log("Received test results:", data.results)
              setTestResults(data.results)
              setTestHistory((prev) => [data.results, ...prev.slice(0, 9)])
            }
          } catch (e) {
            console.error("Failed to parse JSON:", line, e)
          }
        }
      }
    } catch (error) {
      console.error("Test failed:", error)
      setCurrentTest("Test failed")
    } finally {
      setIsRunning(false)
      setProgress(100)
    }
  }

  const getTestConfig = () => ({
    loadTest: true,
    linkCheck: true,
    formTest: false,
    mobileTest: true,
    browsers: ["chrome", "firefox"],
    concurrent: 10,
    duration: 30,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-600 to-blue-600 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              BetaWala Test
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time performance testing for production and localhost websites with live preview and instant metrics
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Globe className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">1,247</div>
              <div className="text-sm text-muted-foreground">Sites Tested</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{realtimeMetrics.loadTime || "2.3s"}</div>
              <div className="text-sm text-muted-foreground">Current Load Time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{realtimeMetrics.successRate || "94%"}</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{realtimeMetrics.concurrent || "50"}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Test Interface */}
          <div className="space-y-6">
            <Tabs defaultValue="test" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="test">Run Test</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="test" className="space-y-6">
                {/* URL Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Website URL
                    </CardTitle>
                    <CardDescription>Test any website including localhost for development</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="url">Website URL</Label>
                        <Input
                          id="url"
                          placeholder="https://example.com or localhost:3000"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          disabled={isRunning}
                          className="font-mono"
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          Supports: https://example.com, localhost:3000, 127.0.0.1:8080, 192.168.1.100:3000
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={runPerformanceTest}
                          disabled={!url || isRunning}
                          className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 flex-1"
                        >
                          {isRunning ? "Testing..." : "Start Test"}
                        </Button>

                        {url && !isRunning && (
                          <Button
                            variant="outline"
                            onClick={() => showWebsitePreview()}
                            className="flex items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                        )}
                      </div>
                    </div>

                    {isRunning && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{currentTest}</span>
                          <span className="font-medium">{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />

                        {/* Real-time metrics during testing */}
                        {Object.keys(realtimeMetrics).length > 0 && (
                          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-emerald-600">
                                {realtimeMetrics.currentLoadTime || "--"}
                              </div>
                              <div className="text-xs text-muted-foreground">Load Time</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-blue-600">
                                {realtimeMetrics.requestsProcessed || "--"}
                              </div>
                              <div className="text-xs text-muted-foreground">Requests</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <TestConfiguration />
              </TabsContent>

              <TabsContent value="results">
                <TestResults results={testResults} />
              </TabsContent>

              <TabsContent value="history">
                <TestHistory history={testHistory} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Website Preview */}
          {showPreview && url && (
            <div className="space-y-4">
              <Card className="h-[600px]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="h-4 w-4" />
                    Live Preview
                    {isRunning && (
                      <div className="ml-auto flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-muted-foreground">Testing</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(false)}
                      className="ml-auto h-6 w-6 p-0"
                    >
                      ×
                    </Button>
                  </CardTitle>
                  <div className="text-xs text-muted-foreground font-mono truncate">{formatUrl(url)}</div>
                </CardHeader>
                <CardContent className="p-0 h-[calc(100%-80px)]">
                  {previewLoading && (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-b-lg">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading preview...</p>
                      </div>
                    </div>
                  )}

                  {previewError && (
                    <div className="w-full h-full flex items-center justify-center bg-muted/50 rounded-b-lg">
                      <div className="text-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground mb-2">Preview unavailable</p>
                        <p className="text-xs text-muted-foreground">
                          This may be due to CORS restrictions or the site blocking iframes
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(formatUrl(url), "_blank")}
                          className="mt-2"
                        >
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  )}

                  <iframe
                    ref={previewRef}
                    src={formatUrl(url)}
                    className={`w-full h-full border-0 rounded-b-lg ${previewLoading || previewError ? "hidden" : ""}`}
                    title="Website Preview"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                    onLoad={handlePreviewLoad}
                    onError={handlePreviewError}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
