<?php

declare(strict_types=1);

use Soraq\Core\Config\Env;

/*
 * AI providers (docs/decisions/0013). Keys live ONLY in backend/.env or the server environment —
 * never in code, git or VITE_* variables. Without a key, AI features report "not configured".
 */
return [
    // Provider for fast text tasks (summaries). Only 'groq' is implemented today.
    'provider' => Env::get('AI_PROVIDER', 'groq'),
    'timeout_seconds' => Env::int('AI_TIMEOUT_SECONDS', 30),
    // Upper bound of note text sent in one request (keeps latency and token usage predictable).
    'max_input_chars' => Env::int('AI_MAX_INPUT_CHARS', 24000),
    'groq' => [
        'api_key' => Env::get('GROQ_API_KEY', ''),
        'model' => Env::get('GROQ_MODEL', 'llama-3.3-70b-versatile'),
        'base_url' => 'https://api.groq.com/openai/v1',
    ],
];
