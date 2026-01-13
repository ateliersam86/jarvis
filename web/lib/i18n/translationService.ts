import { ResilienceManager, ExecutionResult } from '../llm/resilience';

export interface TranslationRequest {
    text: string;
    targetLang: string; // 'ja', 'fr', 'es', etc.
    sourceLang?: string; // 'en' default
}

export interface TranslationResponse {
    translatedText: string;
    confidence: number;
    needsReview: boolean;
    provider: string;
    usedFallback: boolean;
}

// Mock Provider Interface (Replace with real LLM calls)
const mockGeminiTranslate = async (req: TranslationRequest): Promise<string> => {
    // Simulate network call
    await new Promise(r => setTimeout(r, 500));
    
    // Simulate occasional failure
    if (Math.random() < 0.1) throw new Error("Gemini overloaded");
    
    return `[Gemini] Translated "${req.text}" to ${req.targetLang}`;
};

const mockClaudeTranslate = async (req: TranslationRequest): Promise<string> => {
    await new Promise(r => setTimeout(r, 600));
    return `[Claude] Translated "${req.text}" to ${req.targetLang}`;
};

const mockSimpleFallback = async (req: TranslationRequest): Promise<string> => {
    // Very basic fallback (maybe dictionary based or just source)
    return `[Fallback] ${req.text}`;
};

export class TranslationService {
    private resilience: ResilienceManager;

    constructor() {
        this.resilience = new ResilienceManager({
            timeoutMs: 5000, // Fast timeout for translations
            maxRetries: 2
        });
    }

    /**
     * Translates text with a robust fallback chain:
     * 1. Gemini (Primary)
     * 2. Claude (Secondary)
     * 3. Simple Fallback (Last Resort)
     */
    async translate(req: TranslationRequest): Promise<TranslationResponse> {
        // Define the chain
        const providers = [
            { 
                name: 'Gemini-Pro', 
                fn: () => mockGeminiTranslate(req) 
            },
            { 
                name: 'Claude-Sonnet', 
                fn: () => mockClaudeTranslate(req) 
            },
            { 
                name: 'Local-Fallback', 
                fn: () => mockSimpleFallback(req) 
            }
        ];

        // Execute
        const result = await this.resilience.executeWithFallback(providers, 'translation');

        if (result.success) {
            return this.processResult(result, req);
        } else {
            // Absolute emergency fallback if even Local-Fallback failed (unlikely)
            return {
                translatedText: req.text, // Return source
                confidence: 0,
                needsReview: true,
                provider: 'System-Emergency',
                usedFallback: true
            };
        }
    }

    private processResult(result: ExecutionResult<string>, req: TranslationRequest): TranslationResponse {
        // success is guaranteed true here due to guard clause in translate()
        // but TypeScript might need help or we just access data directly
        const data = (result as any).data as string; 
        const meta = (result as any).metadata;

        let confidence = 0.95;
        let needsReview = false;

        // Logic for "Human-in-the-loop" flags
        if (meta.fallbackUsed) {
            confidence = 0.8; // Lower confidence if fallback used
        }

        if (meta.provider === 'Local-Fallback') {
            confidence = 0.4;
            needsReview = true;
        }

        // Japanese specific logic (as requested: "if JA fails...")
        if (req.targetLang === 'ja' && meta.provider !== 'Gemini-Pro') {
            // If we didn't use our best model for Japanese, flag it
            needsReview = true;
            confidence -= 0.1;
        }

        return {
            translatedText: data,
            confidence,
            needsReview,
            provider: meta.provider,
            usedFallback: meta.fallbackUsed
        };
    }
}

export const translationService = new TranslationService();
