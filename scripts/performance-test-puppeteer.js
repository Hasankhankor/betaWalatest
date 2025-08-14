/**
 * Advanced Website Performance Testing with Puppeteer
 * Provides detailed performance metrics and cross-browser testing
 */

import puppeteer from "puppeteer"
import fs from "fs/promises"
import { performance } from "perf_hooks"

class PuppeteerPerformanceTester {
  constructor() {
    this.results = {}
    this.browsers = []
  }

  async setupBrowser(options = {}) {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
      ...options,
    })

    this.browsers.push(browser)
    return browser
  }

  async measurePageMetrics(url, options = {}) {
    const browser = await this.setupBrowser()
    const page = await browser.newPage()

    try {
      // Set viewport for mobile/desktop testing
      if (options.mobile) {
        await page.setViewport({ width: 375, height: 667 })
        await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15")
      } else {
        await page.setViewport({ width: 1920, height: 1080 })
      }

      // Enable performance monitoring
      await page.setCacheEnabled(false)

      // Start performance measurement
      const startTime = performance.now()

      // Navigate and wait for load
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })

      const endTime = performance.now()
      const totalLoadTime = (endTime - startTime) / 1000

      // Get detailed performance metrics
      const performanceMetrics = await page.evaluate(() => {
        const perfData = performance.getEntriesByType("navigation")[0]
        const paintEntries = performance.getEntriesByType("paint")

        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          loadComplete: perfData.loadEventEnd - perfData.navigationStart,
          firstPaint: paintEntries.find((entry) => entry.name === "first-paint")?.startTime || null,
          firstContentfulPaint:
            paintEntries.find((entry) => entry.name === "first-contentful-paint")?.startTime || null,
          domInteractive: perfData.domInteractive - perfData.navigationStart,
          domComplete: perfData.domComplete - perfData.navigationStart,
          transferSize: perfData.transferSize,
          encodedBodySize: perfData.encodedBodySize,
          decodedBodySize: perfData.decodedBodySize,
        }
      })

      // Get resource loading metrics
      const resourceMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType("resource")
        const resourceSummary = {
          totalResources: resources.length,
          images: resources.filter((r) => r.initiatorType === "img").length,
          scripts: resources.filter((r) => r.initiatorType === "script").length,
          stylesheets: resources.filter((r) => r.initiatorType === "link").length,
          totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
          slowestResource: resources.reduce(
            (slowest, current) => (current.duration > (slowest?.duration || 0) ? current : slowest),
            null,
          ),
        }

        return resourceSummary
      })

      // Get Core Web Vitals
      const webVitals = await this.getCoreWebVitals(page)

      // Check for JavaScript errors
      const jsErrors = []
      page.on("pageerror", (error) => {
        jsErrors.push({
          message: error.message,
          stack: error.stack,
        })
      })

      return {
        url,
        statusCode: response.status(),
        totalLoadTime,
        performanceMetrics: {
          ...performanceMetrics,
          domContentLoaded: performanceMetrics.domContentLoaded / 1000,
          loadComplete: performanceMetrics.loadComplete / 1000,
          firstPaint: performanceMetrics.firstPaint ? performanceMetrics.firstPaint / 1000 : null,
          firstContentfulPaint: performanceMetrics.firstContentfulPaint
            ? performanceMetrics.firstContentfulPaint / 1000
            : null,
          domInteractive: performanceMetrics.domInteractive / 1000,
          domComplete: performanceMetrics.domComplete / 1000,
        },
        resourceMetrics,
        webVitals,
        jsErrors,
        mobile: !!options.mobile,
      }
    } catch (error) {
      return {
        url,
        error: error.message,
        mobile: !!options.mobile,
      }
    } finally {
      await page.close()
      await browser.close()
    }
  }

  async getCoreWebVitals(page) {
    return await page.evaluate(() => {
      return new Promise((resolve) => {
        const vitals = {}

        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          vitals.lcp = lastEntry.startTime
        }).observe({ entryTypes: ["largest-contentful-paint"] })

        // First Input Delay
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            vitals.fid = entry.processingStart - entry.startTime
          })
        }).observe({ entryTypes: ["first-input"] })

        // Cumulative Layout Shift
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value
            }
          }
          vitals.cls = clsValue
        }).observe({ entryTypes: ["layout-shift"] })

        // Return vitals after a short delay
        setTimeout(() => resolve(vitals), 3000)
      })
    })
  }

  async checkAccessibility(url) {
    const browser = await this.setupBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(url, { waitUntil: "networkidle2" })

      // Basic accessibility checks
      const accessibilityIssues = await page.evaluate(() => {
        const issues = []

        // Check for images without alt text
        const imagesWithoutAlt = document.querySelectorAll("img:not([alt])")
        if (imagesWithoutAlt.length > 0) {
          issues.push({
            type: "missing_alt_text",
            count: imagesWithoutAlt.length,
            severity: "medium",
          })
        }

        // Check for form inputs without labels
        const inputsWithoutLabels = document.querySelectorAll("input:not([aria-label]):not([aria-labelledby])")
        const unlabeledInputs = Array.from(inputsWithoutLabels).filter((input) => {
          const id = input.id
          return !id || !document.querySelector(`label[for="${id}"]`)
        })

        if (unlabeledInputs.length > 0) {
          issues.push({
            type: "unlabeled_inputs",
            count: unlabeledInputs.length,
            severity: "high",
          })
        }

        // Check for missing page title
        if (!document.title || document.title.trim() === "") {
          issues.push({
            type: "missing_title",
            severity: "high",
          })
        }

        // Check for heading structure
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6")
        const h1Count = document.querySelectorAll("h1").length

        if (h1Count === 0) {
          issues.push({
            type: "missing_h1",
            severity: "medium",
          })
        } else if (h1Count > 1) {
          issues.push({
            type: "multiple_h1",
            count: h1Count,
            severity: "low",
          })
        }

        return issues
      })

      return accessibilityIssues
    } catch (error) {
      return { error: error.message }
    } finally {
      await page.close()
      await browser.close()
    }
  }

  async testFormInteractions(url) {
    const browser = await this.setupBrowser()
    const page = await browser.newPage()

    try {
      await page.goto(url, { waitUntil: "networkidle2" })

      const formTests = await page.evaluate(() => {
        const forms = document.querySelectorAll("form")
        const results = []

        forms.forEach((form, index) => {
          const formData = {
            formIndex: index,
            action: form.action,
            method: form.method,
            inputs: [],
            hasSubmitButton: false,
          }

          // Analyze form inputs
          const inputs = form.querySelectorAll("input, textarea, select")
          inputs.forEach((input) => {
            formData.inputs.push({
              type: input.type || input.tagName.toLowerCase(),
              name: input.name,
              required: input.required,
              placeholder: input.placeholder,
            })
          })

          // Check for submit button
          const submitButton = form.querySelector('input[type="submit"], button[type="submit"], button:not([type])')
          formData.hasSubmitButton = !!submitButton

          results.push(formData)
        })

        return results
      })

      // Test form interactions
      for (let i = 0; i < formTests.length && i < 3; i++) {
        const form = formTests[i]
        try {
          const formSelector = `form:nth-of-type(${i + 1})`

          // Try to fill out the form
          const inputs = await page.$$(formSelector + " input, " + formSelector + " textarea")

          for (const input of inputs) {
            const inputType = await input.evaluate((el) => el.type)

            if (inputType === "email") {
              await input.type("test@example.com")
            } else if (inputType === "text" || inputType === "search") {
              await input.type("Test input")
            } else if (inputType === "password") {
              await input.type("testpassword")
            }
          }

          form.interactionSuccess = true
        } catch (error) {
          form.interactionError = error.message
        }
      }

      return formTests
    } catch (error) {
      return { error: error.message }
    } finally {
      await page.close()
      await browser.close()
    }
  }

  async runLoadTest(url, options = {}) {
    const { concurrent = 10, duration = 30 } = options
    const results = []
    const startTime = Date.now()

    console.log(`Starting load test with ${concurrent} concurrent users for ${duration} seconds...`)

    while ((Date.now() - startTime) / 1000 < duration) {
      const promises = []

      for (let i = 0; i < concurrent; i++) {
        promises.push(this.singleUserLoadTest(url))
      }

      const batchResults = await Promise.allSettled(promises)
      results.push(
        ...batchResults.map((result) =>
          result.status === "fulfilled" ? result.value : { error: result.reason.message },
        ),
      )

      // Brief pause between batches
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    // Analyze results
    const successful = results.filter((r) => !r.error)
    const failed = results.filter((r) => r.error)
    const loadTimes = successful.map((r) => r.loadTime).filter((t) => t)

    return {
      totalRequests: results.length,
      successfulRequests: successful.length,
      failedRequests: failed.length,
      successRate: (successful.length / results.length) * 100,
      averageLoadTime: loadTimes.length > 0 ? loadTimes.reduce((a, b) => a + b) / loadTimes.length : null,
      minLoadTime: loadTimes.length > 0 ? Math.min(...loadTimes) : null,
      maxLoadTime: loadTimes.length > 0 ? Math.max(...loadTimes) : null,
      errors: failed.map((r) => r.error),
    }
  }

  async singleUserLoadTest(url) {
    const browser = await this.setupBrowser()
    const page = await browser.newPage()

    try {
      const startTime = performance.now()
      const response = await page.goto(url, {
        waitUntil: "networkidle2",
        timeout: 30000,
      })
      const endTime = performance.now()

      return {
        loadTime: (endTime - startTime) / 1000,
        statusCode: response.status(),
        success: response.status() < 400,
      }
    } catch (error) {
      return {
        error: error.message,
        success: false,
      }
    } finally {
      await page.close()
      await browser.close()
    }
  }

  async runComprehensiveTest(url, config = {}) {
    const defaultConfig = {
      desktop: true,
      mobile: true,
      accessibility: true,
      formTesting: true,
      loadTesting: true,
      concurrent: 10,
      duration: 30,
    }

    const testConfig = { ...defaultConfig, ...config }

    console.log(`Starting comprehensive test for: ${url}`)

    const results = {
      url,
      timestamp: new Date().toISOString(),
      config: testConfig,
    }

    // Desktop performance test
    if (testConfig.desktop) {
      console.log("Testing desktop performance...")
      results.desktop = await this.measurePageMetrics(url, { mobile: false })
    }

    // Mobile performance test
    if (testConfig.mobile) {
      console.log("Testing mobile performance...")
      results.mobile = await this.measurePageMetrics(url, { mobile: true })
    }

    // Accessibility test
    if (testConfig.accessibility) {
      console.log("Testing accessibility...")
      results.accessibility = await this.checkAccessibility(url)
    }

    // Form interaction test
    if (testConfig.formTesting) {
      console.log("Testing form interactions...")
      results.forms = await this.testFormInteractions(url)
    }

    // Load testing
    if (testConfig.loadTesting) {
      console.log("Running load test...")
      results.loadTest = await this.runLoadTest(url, {
        concurrent: testConfig.concurrent,
        duration: testConfig.duration,
      })
    }

    // Calculate overall score
    results.performanceScore = this.calculateOverallScore(results)

    console.log("Test completed!")
    return results
  }

  calculateOverallScore(results) {
    let score = 100

    // Desktop performance scoring
    if (results.desktop && !results.desktop.error) {
      const loadTime = results.desktop.totalLoadTime
      if (loadTime > 5) score -= 25
      else if (loadTime > 3) score -= 15
      else if (loadTime > 2) score -= 10
      else if (loadTime > 1) score -= 5

      // Core Web Vitals scoring
      const vitals = results.desktop.webVitals
      if (vitals.lcp > 2500) score -= 10
      if (vitals.fid > 100) score -= 10
      if (vitals.cls > 0.1) score -= 10
    }

    // Mobile performance scoring
    if (results.mobile && !results.mobile.error) {
      const mobileLoadTime = results.mobile.totalLoadTime
      if (mobileLoadTime > results.desktop?.totalLoadTime * 1.5) {
        score -= 15 // Penalty for poor mobile performance
      }
    }

    // Accessibility scoring
    if (results.accessibility && Array.isArray(results.accessibility)) {
      const highSeverityIssues = results.accessibility.filter((issue) => issue.severity === "high").length
      const mediumSeverityIssues = results.accessibility.filter((issue) => issue.severity === "medium").length

      score -= highSeverityIssues * 10
      score -= mediumSeverityIssues * 5
    }

    // Load test scoring
    if (results.loadTest) {
      const successRate = results.loadTest.successRate
      if (successRate < 95) {
        score -= (95 - successRate) * 2
      }
    }

    return Math.max(0, Math.min(100, Math.round(score)))
  }

  async cleanup() {
    // Close all browsers
    for (const browser of this.browsers) {
      try {
        await browser.close()
      } catch (error) {
        console.error("Error closing browser:", error)
      }
    }
    this.browsers = []
  }
}

// Example usage
async function runTest() {
  const tester = new PuppeteerPerformanceTester()

  try {
    const url = "https://example.com" // Replace with actual URL
    const config = {
      desktop: true,
      mobile: true,
      accessibility: true,
      formTesting: true,
      loadTesting: true,
      concurrent: 25,
      duration: 60,
    }

    const results = await tester.runComprehensiveTest(url, config)

    // Save results
    const filename = `performance_test_${new Date().toISOString().replace(/[:.]/g, "-")}.json`
    await fs.writeFile(filename, JSON.stringify(results, null, 2))

    console.log(`\nPerformance Score: ${results.performanceScore}/100`)
    console.log(`Results saved to ${filename}`)
  } catch (error) {
    console.error("Test failed:", error)
  } finally {
    await tester.cleanup()
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTest()
}

export default PuppeteerPerformanceTester
