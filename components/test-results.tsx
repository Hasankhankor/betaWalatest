import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Globe,
  Smartphone,
  Lightbulb,
  Target,
  TrendingUp,
} from "lucide-react"

interface TestResultsProps {
  results: any
}

export function TestResults({ results }: TestResultsProps) {
  console.log("TestResults component received:", results)

  if (!results) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Test Results</h3>
          <p className="text-muted-foreground">Run a performance test to see detailed results here</p>
        </CardContent>
      </Card>
    )
  }

  const generatePerformanceSuggestions = () => {
    const suggestions = []
    const loadTime = Number.parseFloat(results.loadTime) || 0
    const mobileScore = results.mobileScore || 0
    const totalRequests = results.totalRequests || 0
    const failedRequests = results.failedRequests || 0

    // Load Time Suggestions
    if (loadTime > 3) {
      suggestions.push({
        category: "Load Time",
        priority: "high",
        issue: `Slow load time: ${loadTime}s (target: <3s)`,
        fixes: [
          "Optimize images: Use WebP format and compress images",
          "Enable browser caching with proper cache headers",
          "Minify CSS, JavaScript, and HTML files",
          "Use a Content Delivery Network (CDN)",
          "Reduce server response time (TTFB)",
        ],
      })
    } else if (loadTime > 1.5) {
      suggestions.push({
        category: "Load Time",
        priority: "medium",
        issue: `Load time could be improved: ${loadTime}s (target: <1.5s)`,
        fixes: [
          "Implement lazy loading for images and videos",
          "Remove unused CSS and JavaScript",
          "Use resource hints (preload, prefetch, preconnect)",
        ],
      })
    }

    // Mobile Score Suggestions
    if (mobileScore < 70) {
      suggestions.push({
        category: "Mobile Score",
        priority: "high",
        issue: `Poor mobile performance: ${mobileScore}/100`,
        fixes: [
          "Implement responsive design with proper viewport meta tag",
          "Optimize touch targets (minimum 44px)",
          "Reduce mobile-specific JavaScript execution",
          "Use mobile-first CSS approach",
          "Optimize font loading for mobile devices",
        ],
      })
    } else if (mobileScore < 90) {
      suggestions.push({
        category: "Mobile Score",
        priority: "medium",
        issue: `Mobile score can be improved: ${mobileScore}/100`,
        fixes: [
          "Optimize images for different screen densities",
          "Reduce layout shifts on mobile",
          "Minimize third-party scripts on mobile",
        ],
      })
    }

    // Request Optimization Suggestions
    if (totalRequests > 100) {
      suggestions.push({
        category: "Requests",
        priority: "high",
        issue: `Too many HTTP requests: ${totalRequests} (target: <50)`,
        fixes: [
          "Combine CSS and JavaScript files",
          "Use CSS sprites for small images",
          "Implement HTTP/2 server push",
          "Remove unnecessary third-party scripts",
          "Use inline SVGs instead of icon fonts",
        ],
      })
    } else if (totalRequests > 50) {
      suggestions.push({
        category: "Requests",
        priority: "medium",
        issue: `High number of requests: ${totalRequests} (target: <50)`,
        fixes: ["Bundle similar resources together", "Use data URIs for small images", "Implement resource bundling"],
      })
    }

    // Failed Requests
    if (failedRequests > 0) {
      suggestions.push({
        category: "Requests",
        priority: "high",
        issue: `${failedRequests} failed requests detected`,
        fixes: [
          "Fix broken resource URLs",
          "Implement proper error handling",
          "Add fallback resources for critical assets",
          "Check CORS configuration for external resources",
        ],
      })
    }

    // General Performance Suggestions
    if (suggestions.length === 0) {
      suggestions.push({
        category: "General",
        priority: "low",
        issue: "Good performance! Consider these optimizations:",
        fixes: [
          "Implement Progressive Web App (PWA) features",
          "Add service worker for offline functionality",
          "Use advanced image formats (AVIF, WebP)",
          "Implement critical CSS inlining",
          "Consider using a performance monitoring tool",
        ],
      })
    }

    return suggestions
  }

  const performanceSuggestions = generatePerformanceSuggestions()

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getScoreBadge = (score: number) => {
    if (score >= 90)
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Excellent</Badge>
    if (score >= 70)
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">Good</Badge>
    return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">Needs Improvement</Badge>
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-red-200 dark:border-red-800"
      case "medium":
        return "border-yellow-200 dark:border-yellow-800"
      default:
        return "border-green-200 dark:border-green-800"
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High Priority</Badge>
      case "medium":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
            Medium Priority
          </Badge>
        )
      default:
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Low Priority</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Overall Performance Score
            </span>
            {getScoreBadge(results.overallScore || 0)}
          </CardTitle>
          <CardDescription>
            Tested: {results.url} • {results.timestamp ? new Date(results.timestamp).toLocaleString() : "Just now"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(results.overallScore || 0)}`}>
              {results.overallScore || 0}
            </div>
            <div className="flex-1">
              <Progress value={results.overallScore || 0} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Load Time</span>
            </div>
            <div className="text-2xl font-bold">{results.loadTime || "0"}s</div>
            <div className="text-xs text-muted-foreground">First Contentful Paint</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium">Speed Index</span>
            </div>
            <div className="text-2xl font-bold">{results.speedIndex || "0"}s</div>
            <div className="text-xs text-muted-foreground">Visual Progress</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Requests</span>
            </div>
            <div className="text-2xl font-bold">{results.totalRequests || 0}</div>
            <div className="text-xs text-muted-foreground">{results.failedRequests || 0} failed</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Mobile Score</span>
            </div>
            <div className="text-2xl font-bold">{results.mobileScore || 0}</div>
            <div className="text-xs text-muted-foreground">Responsiveness</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            Performance Improvement Suggestions
          </CardTitle>
          <CardDescription>Actionable recommendations to improve your website's performance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {performanceSuggestions.map((suggestion, index) => (
            <Alert key={index} className={getPriorityColor(suggestion.priority)}>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{suggestion.category}</Badge>
                      {getPriorityBadge(suggestion.priority)}
                    </div>
                  </div>
                  <div className="font-medium">{suggestion.issue}</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lightbulb className="h-3 w-3" />
                      Recommended Fixes:
                    </div>
                    <ul className="space-y-1 ml-5">
                      {suggestion.fixes.map((fix, fixIndex) => (
                        <li key={fixIndex} className="text-sm flex items-start gap-2">
                          <span className="text-green-600 mt-1">•</span>
                          <span>{fix}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues Found */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {results.issues && results.issues.length > 0 ? (
              results.issues.map((issue: any, index: number) => (
                <Alert
                  key={index}
                  className={
                    issue.severity === "high"
                      ? "border-red-200 dark:border-red-800"
                      : "border-yellow-200 dark:border-yellow-800"
                  }
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{issue.description}</span>
                      <Badge variant={issue.severity === "high" ? "destructive" : "secondary"}>{issue.severity}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No issues found</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Broken Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Broken Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            {results.brokenLinks && results.brokenLinks.length > 0 ? (
              <div className="space-y-2">
                {results.brokenLinks.map((link: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <XCircle className="h-3 w-3 text-red-500" />
                    <span className="font-mono text-xs bg-muted px-2 py-1 rounded">{link}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>No broken links found</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {results.recommendations && results.recommendations.length > 0 ? (
              results.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No specific recommendations at this time</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
