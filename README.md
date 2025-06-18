# Web Pulse - Multi-Region Website Performance Analysis

**Web Pulse** is a powerful Model Context Protocol (MCP) server that provides advanced web content analysis and multi-region screenshot capabilities using Cloudflare Browser Rendering. This server enables LLMs to access and analyze web content, take screenshots from multiple global locations, detect visual issues, and compare performance across regions.

## 🌟 Key Features

### 📸 Multi-Region Screenshots

- Take screenshots from multiple global locations simultaneously
- Compare visual consistency across different regions
- Detect regional performance variations
- Optimize for Cloudflare KV storage

### 🔍 Visual Issue Detection

- Automatically detect layout problems
- Identify missing resources (CSS, JS, images)
- Spot JavaScript rendering errors
- Flag performance bottlenecks

### 📊 Performance Analysis

- Compare load times across regions
- Analyze network request patterns
- Generate performance scores (0-100)
- Provide actionable optimization recommendations

### 🌐 Global Testing Regions

- **us-east**: North America East
- **us-west**: North America West
- **eu-west**: Europe West
- **ap-southeast**: Asia Pacific
- **au-east**: Australia

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Cloudflare Worker with Browser Rendering enabled
- Environment variable `BROWSER_RENDERING_API` set to your worker URL

### Installation

```bash
npm install
npm run build
```

### Configuration

```bash
export BROWSER_RENDERING_API="https://your-worker.your-subdomain.workers.dev"
```

## 🛠️ Available Tools

### 1. Multi-Region Screenshots

```typescript
{
  name: "multi_region_screenshots",
  arguments: {
    url: "https://example.com",
    regions: ["us-east", "eu-west", "ap-southeast"], // optional
    enableVisualComparison: true,
    enableIssueDetection: true,
    kvOptimized: false,
    width: 1280,
    height: 800,
    fullPage: false,
    timeout: 60000,
  },
}
```

**Output**: Comprehensive analysis including:

- Screenshots from each region
- Performance scores and metrics
- Visual consistency comparison
- Issue detection results
- Optimization recommendations

### 2. Visual Issue Analysis

```typescript
{
  name: "analyze_visual_issues",
  arguments: {
    url: "https://example.com",
    regions: ["us-east", "eu-west"], // optional
    issueTypes: ["layout", "missing_resource", "rendering", "performance"],
    severityFilter: "medium", // low, medium, high, critical
  },
}
```

**Detects**:

- **Layout Issues**: Broken layouts, misaligned elements
- **Missing Resources**: Failed CSS, JS, image loads (404, 500 errors)
- **Rendering Problems**: JavaScript errors, console warnings
- **Performance Issues**: Slow load times, poor LCP scores

### 3. Regional Performance Comparison

```typescript
{
  name: "compare_regional_performance",
  arguments: {
    url: "https://example.com",
    regions: ["us-east", "eu-west", "ap-southeast"],
    includeNetworkAnalysis: true,
    generateRecommendations: true,
  },
}
```

**Provides**:

- Performance ranking by region
- Load time comparisons
- Network request analysis
- Failed request details
- Optimization recommendations

### 4. Enhanced Screenshot Tools

```typescript
// Standard screenshot
{
  name: "take_screenshot",
  arguments: {
    url: "https://example.com",
    width: 1280,
    height: 800,
    fullPage: false,
  },
}

// Debug screenshot with detailed info
{
  name: "debug_screenshot",
  arguments: {
    url: "https://example.com",
    width: 1280,
    height: 800,
    fullPage: false,
    collectConsole: true,
    collectNetwork: true,
    collectPerformance: true,
  },
}
```

### 5. Content Analysis Tools

```typescript
// Fetch and process page content
{
  name: "fetch_page",
  arguments: {
    url: "https://example.com",
    maxContentLength: 10000,
  },
}

// Search PubMed for scientific articles
{
  name: "search_pubmed",
  arguments: {
    query: "machine learning healthcare",
    maxResults: 10,
    includeAbstracts: false,
  },
}
```

## 📋 Example Use Cases

### 1. Global Website Performance Audit

```typescript
// Test your site across all regions with Web Pulse
{
  name: "multi_region_screenshots",
  arguments: {
    url: "https://yoursite.com",
    enableVisualComparison: true,
    enableIssueDetection: true,
    kvOptimized: true,
  },
}
```

### 2. Critical Issue Detection

```typescript
// Focus on high-severity issues only
{
  name: "analyze_visual_issues",
  arguments: {
    url: "https://yoursite.com",
    severityFilter: "high",
    issueTypes: ["missing_resource", "performance"],
  },
}
```

### 3. CDN Performance Analysis

```typescript
// Compare performance with detailed network analysis
{
  name: "compare_regional_performance",
  arguments: {
    url: "https://yoursite.com",
    includeNetworkAnalysis: true,
    generateRecommendations: true,
    regions: ["us-east", "us-west", "eu-west"],
  },
}
```

### 4. E-commerce Site Monitoring

```typescript
// Monitor checkout process across regions
{
  name: "multi_region_screenshots",
  arguments: {
    url: "https://store.example.com/checkout",
    regions: ["us-east", "eu-west", "ap-southeast"],
    enableIssueDetection: true,
    timeout: 30000,
  },
}
```

## 🏗️ Web Pulse Architecture

### Browser Client (`browser-client.ts`)

- Manages Cloudflare Worker API calls
- Handles multi-region coordination
- Implements issue detection algorithms
- Provides KV optimization utilities

### Content Processor (`content-processor.ts`)

- Formats results for LLM consumption
- Filters and categorizes issues
- Generates performance comparisons
- Creates actionable recommendations

### MCP Server (`server.ts`)

- Exposes tools via MCP protocol
- Handles request validation
- Manages error responses
- Coordinates tool execution

## 🔧 Advanced Configuration

### Regional Endpoints

Configure custom regional endpoints:

```typescript
const regions = [
  {
    name: "custom-region",
    endpoint: "https://custom.workers.dev",
    location: "Custom Location",
  },
  {
    name: "eu-central",
    endpoint: "https://eu-central.workers.dev",
    location: "Europe Central",
  },
];
```

### KV Optimization

Enable KV storage optimization for large-scale monitoring:

```typescript
{
  name: "multi_region_screenshots",
  arguments: {
    url: "https://example.com",
    kvOptimized: true,
    // Additional KV optimization options
    maxRegions: 3,
    compressionLevel: "high", // low, medium, high
  },
}

// Post-process optimization
const optimizedData = await browserClient.optimizeForKV(data, {
  keepFullDebugInfo: false,
  maxRegions: 5,
  compressionLevel: "high",
});
```

### Performance Scoring Algorithm

Performance scores (0-100) calculated based on:

- **Load Time**: -40 points max for load times > 3s
- **Failed Requests**: -5 points per failed request
- **LCP Score**: -20 points max for LCP > 2.5s
- **Console Errors**: Variable deductions based on error severity

**Scoring Formula**:

```typescript
score =
  100 -
  Math.min(40, (loadTime - 3000) / 100) - // Load time penalty
  failedRequests * 5 - // Failed request penalty
  Math.min(20, (LCP - 2500) / 100) - // LCP penalty
  consoleErrors * 2; // Console error penalty
```

## 📊 Output Formats

### Multi-Region Analysis Results

```markdown
# Multi-Region Screenshot Analysis for https://example.com

**Analysis Timestamp**: 2024-01-15T10:30:00.000Z
**Regions Tested**: 3
**Total Recommendations**: 2

---

## Regional Screenshots

### US-EAST Region

- **Screenshot**: ![us-east screenshot](https://screenshots.example.com/us-east.png)
- **Performance Score**: 85/100
- **Issues Detected**: 2
- **Load Time**: 1,250ms
- **Critical Issues**: 0
- **Network Failures**: 1

### EU-WEST Region

- **Screenshot**: ![eu-west screenshot](https://screenshots.example.com/eu-west.png)
- **Performance Score**: 78/100
- **Issues Detected**: 3
- **Load Time**: 1,890ms
- **Critical Issues**: 1
- **Network Failures**: 2

## Regional Comparison

### Performance Scores by Region

- **us-east**: 85/100
- **eu-west**: 78/100
- **ap-southeast**: 72/100

### Visual Differences

1. **us-east vs eu-west**

   - Similarity: 92%
   - Differences: Performance difference: 7.0 points

2. **us-east vs ap-southeast**
   - Similarity: 88%
   - Differences:
     - Performance difference: 13.0 points
     - Different number of issues: us-east has 2, ap-southeast has 4

## Recommendations

1. Multiple regions experiencing resource loading failures. Consider using a CDN or checking resource availability.
2. Performance issues detected across multiple regions. Consider optimizing page load times and resource sizes.
```

### Visual Issues Analysis Results

```markdown
# Visual Issues Analysis for https://example.com

**Filter Criteria**:

- Issue Types: missing_resource, performance
- Minimum Severity: high

---

## Summary

- **Total Issues Found**: 3
- **Critical Issues**: 1
- **Regions Analyzed**: 3

⚠️ Critical issues require immediate attention!

## Issues by Region

### US-EAST Region

1. **MISSING_RESOURCE** - CRITICAL
   - Failed to load stylesheet: https://cdn.example.com/css/main.css (404)
   - Evidence: Region: us-east, Status: 404, Duration: 120ms

### EU-WEST Region

1. **PERFORMANCE** - HIGH

   - Slow page load time: 5,230ms
   - Evidence: Region: eu-west, DOMContentLoaded: 3,100ms

2. **MISSING_RESOURCE** - HIGH
   - Failed to load script: https://analytics.example.com/tracker.js (503)
   - Evidence: Region: eu-west, Status: 503, Duration: 2,000ms

## Actionable Recommendations

1. Multiple regions experiencing resource loading failures. Consider using a CDN or checking resource availability.
2. Performance issues detected across multiple regions. Consider optimizing page load times and resource sizes.
```

### Performance Comparison Results

```markdown
# Regional Performance Comparison for https://example.com

**Analysis Options**:

- Network Analysis: Enabled
- Recommendations: Enabled

---

## Performance Overview

| Region       | Performance Score | Load Time | Issues |
| ------------ | ----------------- | --------- | ------ |
| US-EAST      | 85/100            | 1250ms    | 2      |
| EU-WEST      | 78/100            | 1890ms    | 3      |
| AP-SOUTHEAST | 72/100            | 2150ms    | 4      |

**Best Performing Region**: US-EAST (85/100)
**Worst Performing Region**: AP-SOUTHEAST (72/100)  
**Performance Gap**: 13 points

## Network Analysis

### US-EAST Network Requests

- **Total Requests**: 45
- **Failed Requests**: 1
- **Average Duration**: 89.3ms

### EU-WEST Network Requests

- **Total Requests**: 47
- **Failed Requests**: 2
- **Average Duration**: 156.7ms
- **Failed Request Details**:
  - GET https://cdn.example.com/fonts/font.woff2 (404)
  - POST https://api.example.com/analytics (503)

## Performance Optimization Recommendations

1. 🚨 **Critical**: AP-SOUTHEAST region shows poor performance (72/100). Investigate server infrastructure and CDN coverage.
2. ⚡ **High Priority**: Significant load time variation (900ms) between regions. Consider implementing regional CDN optimization.
3. 🔧 **Medium Priority**: 9 total issues detected across regions. Review resource loading and error handling.
```

## 🚨 Error Handling & Resilience

### Regional Failure Handling

```typescript
// Graceful degradation when regions fail
const results = await browserClient.takeMultiRegionScreenshots(url, {
  regions: ["us-east", "eu-west", "ap-southeast"],
  enableIssueDetection: true,
});

// Results will include successful regions only
// Failed regions are logged but don't prevent analysis
```

### Timeout Management

```typescript
{
  name: "multi_region_screenshots",
  arguments: {
    url: "https://slow-site.com",
    timeout: 120000, // 2 minutes per region
    regions: ["us-east", "eu-west"],
  },
}
```

### Input Validation

- **URL Validation**: Ensures valid HTTP/HTTPS URLs
- **Region Validation**: Checks against available regions
- **Parameter Validation**: Type checking and range validation
- **Timeout Limits**: Prevents excessive wait times

## 🔍 Monitoring & Debugging

### Debug Mode

Enable detailed logging:

```bash
DEBUG=1 npm start
```

### Health Checks

Test regional connectivity:

```typescript
// Test if all regions are responding
const healthCheck = await browserClient.takeMultiRegionScreenshots(
  "https://httpbin.org/get",
  {
    regions: ["us-east", "eu-west"],
    enableIssueDetection: false,
    timeout: 10000,
  }
);
```

### Performance Monitoring

```typescript
// Monitor your own site's performance with Web Pulse
{
  name: "compare_regional_performance",
  arguments: {
    url: "https://yoursite.com",
    generateRecommendations: true,
    includeNetworkAnalysis: true,
  },
}
```

## 🔌 Integration Examples

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "web-pulse": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "BROWSER_RENDERING_API": "https://your-worker.workers.dev"
      }
    }
  }
}
```

### Cline/VSCode Configuration

```json
{
  "mcpServers": {
    "web-pulse": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "BROWSER_RENDERING_API": "https://your-worker.workers.dev"
      }
    }
  }
}
```

### Programmatic Usage

```typescript
import { BrowserRenderingServer } from "./src/server.js";

const server = new BrowserRenderingServer();
await server.run();
```

## 🚀 Performance Tips

### Optimization Strategies

1. **Use KV Optimization**: Enable `kvOptimized: true` for high-volume monitoring
2. **Limit Regions**: Test only relevant regions with `regions` parameter
3. **Adjust Timeouts**: Set appropriate timeouts based on site complexity
4. **Filter Issues**: Use `severityFilter` to focus on critical problems

### Best Practices

- **Regular Monitoring**: Set up periodic checks for critical pages
- **Regional Focus**: Test regions where your users are located
- **Issue Prioritization**: Address critical and high-severity issues first
- **Performance Baselines**: Establish baseline metrics for comparison

## 🤝 Contributing to Web Pulse

### Development Setup

```bash
git clone <repository>
cd web-pulse
npm install
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Test specific functionality
npm run test:puppeteer
```

### Pull Request Guidelines

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Submit a pull request with clear description

## 📄 License

MIT License - see LICENSE file for details.

## 🙋‍♂️ Support & Community

### Getting Help

1. 📚 Check the [troubleshooting section](#error-handling--resilience)
2. 🔍 Search [existing GitHub issues](https://github.com/your-repo/issues)
3. 💬 Join our [Discord community](https://discord.gg/your-server)
4. 🐛 Create a [new issue](https://github.com/your-repo/issues/new) with detailed information

### Reporting Issues

When reporting issues, please include:

- Node.js version
- Operating system
- Error messages and logs
- Steps to reproduce
- Expected vs actual behavior

### Feature Requests

We welcome feature requests! Please:

- Check existing feature requests first
- Provide clear use cases
- Explain the expected benefits
- Consider implementation complexity

---

**Web Pulse - Made with ❤️ for global web performance analysis**

_Empowering developers to build faster, more reliable web experiences across the globe._
