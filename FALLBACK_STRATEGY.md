# Fallback & Quality Recovery Strategy

## Overview
This document outlines the strategy for handling LLM failures, rate limits, and low-confidence outputs within the Jarvis ecosystem. The goal is to ensure system resilience and high-quality user experience even when primary AI providers are unstable.

## Core Concepts

### 1. Resilience Manager
A centralized `ResilienceManager` handles the execution of AI tasks. It wraps standard API calls with:
-   **Retry Logic:** Exponential backoff for transient errors (Network, 5xx).
-   **Circuit Breaker:** Temporarily disables a provider if it fails consistently, preventing cascading failures.
-   **Rate Limiting:** Client-side throttling to respect provider quotas (Token buckets).
-   **Fallback Chain:** A defined hierarchy of providers or models to attempt if the primary fails.

### 2. Fallback Chains
Fallback chains are context-aware.

**Example: Translation (JA Target)**
1.  **Primary:** `Gemini Pro` (High quality, context aware).
2.  **Fallback 1:** `Claude Sonnet` (Good quality, fast).
3.  **Fallback 2:** `GPT-3.5-Turbo` (Reliable, lower cost).
4.  **Emergency:** Return Source Text (with "Translation Failed" flag) or English placeholder.

**Example: Code Generation**
1.  **Primary:** `Claude 3.5 Sonnet`
2.  **Fallback:** `GPT-4o`

### 3. Human-in-the-Loop (HITL) Flagging
We introduce a `QualityMetadata` object attached to responses.

```typescript
interface QualityMetadata {
  confidence: number;      // 0.0 - 1.0 (Estimated or Provider supplied)
  provider: string;        // 'gemini', 'claude', etc.
  fallbackLevel: number;   // 0 = Primary, 1 = Fallback 1, etc.
  flaggedForReview: boolean; // True if confidence < threshold
  originalSource: string;
}
```

**Thresholds:**
-   **Confidence < 0.7:** Flag for review (Yellow UI indicator).
-   **Fallback Level > 1:** Flag for review (Warn user output might be degraded).

## Implementation Architecture

### Directory Structure
```
web/
└── lib/
    ├── llm/
    │   ├── resilience.ts       // Generic Retry/Fallback/CircuitBreaker
    │   └── providers.ts        // Abstraction over Gemini/Claude/etc.
    └── i18n/
        └── translationService.ts // Specific implementation of Translation Strategy
```

### Database Schema (Proposed)
Add `qualityFlags` to the `Message` or `Task` model.

```prisma
model TranslationTask {
  id          String   @id @default(uuid())
  sourceText  String
  targetLang  String
  translatedText String?
  status      String   // PENDING, COMPLETED, FAILED, FLAGGED
  confidence  Float?
  provider    String?
}
```

## UI UX
-   **Translations:** Show a dashed underline for "Flagged" translations. Hovering shows "Low Confidence - Click to Edit".
-   **System Status:** Dashboard shows "Degraded Mode" if Circuit Breaker is open for Primary Provider.
