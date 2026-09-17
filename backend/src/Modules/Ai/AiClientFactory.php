<?php

declare(strict_types=1);

namespace Soraq\Modules\Ai;

use Soraq\Core\Config\Config;
use Soraq\Core\Logging\Logger;

final class AiClientFactory
{
    /** Null when no provider is configured (e.g. missing API key): callers report "not configured". */
    public static function fromConfig(Config $config, Logger $logger): ?AiClient
    {
        if ($config->get('ai.provider') !== 'groq') {
            return null;
        }

        $apiKey = (string) $config->get('ai.groq.api_key', '');
        if ($apiKey === '') {
            return null;
        }

        return new GroqClient(
            $apiKey,
            (string) $config->get('ai.groq.model'),
            (string) $config->get('ai.groq.base_url'),
            (int) $config->get('ai.timeout_seconds', 30),
            $logger,
        );
    }
}
