<?php

declare(strict_types=1);

namespace Soraq\Modules\Ai;

use JsonException;
use Soraq\Core\Logging\Logger;

/**
 * Groq (OpenAI-compatible chat completions API): fast inference for summaries.
 * TLS verification stays ON. The API key only travels in the Authorization header and is never logged.
 */
final class GroqClient implements AiClient
{
    public function __construct(
        private readonly string $apiKey,
        private readonly string $model,
        private readonly string $baseUrl,
        private readonly int $timeoutSeconds,
        private readonly Logger $logger,
    ) {
    }

    public function complete(string $systemPrompt, string $userPrompt, int $maxTokens = 1500, float $temperature = 0.2): AiCompletion
    {
        try {
            $payload = json_encode([
                'model' => $this->model,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt],
                ],
                'max_tokens' => $maxTokens,
                'temperature' => $temperature,
            ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
        } catch (JsonException) {
            throw new AiUnavailableException('Could not encode the AI request.');
        }

        $curl = curl_init(rtrim($this->baseUrl, '/') . '/chat/completions');
        curl_setopt_array($curl, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $payload,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $this->apiKey],
            CURLOPT_CONNECTTIMEOUT => 10,
            CURLOPT_TIMEOUT => $this->timeoutSeconds,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_PROTOCOLS => CURLPROTO_HTTPS,
        ]);

        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
        $curlError = curl_errno($curl);
        curl_close($curl);

        if (!is_string($body) || $curlError !== 0 || $status !== 200) {
            // Status and curl error number only: the response body may echo request data.
            $this->logger->warning('ai.groq_request_failed', ['status' => $status, 'curl_error' => $curlError]);
            throw new AiUnavailableException('Groq request failed.');
        }

        $data = json_decode($body, true);
        $text = is_array($data) ? ($data['choices'][0]['message']['content'] ?? null) : null;

        if (!is_string($text) || trim($text) === '') {
            $this->logger->warning('ai.groq_empty_response', ['status' => $status]);
            throw new AiUnavailableException('Groq returned no content.');
        }

        return new AiCompletion(trim($text), is_string($data['model'] ?? null) ? $data['model'] : $this->model);
    }
}
