<?php

declare(strict_types=1);

namespace Soraq\Modules\Ai;

/**
 * Provider-agnostic text completion. Features depend on this interface, never on a vendor,
 * so Groq can be replaced or complemented by another model without touching them.
 * This module has no routes: it is a library used by other modules.
 */
interface AiClient
{
    /**
     * @throws AiUnavailableException when the provider fails, times out or returns nothing usable
     */
    public function complete(string $systemPrompt, string $userPrompt, int $maxTokens = 1500, float $temperature = 0.2): AiCompletion;
}
