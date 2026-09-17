<?php

declare(strict_types=1);

namespace Soraq\Modules\Ai;

final class AiCompletion
{
    public function __construct(
        public readonly string $text,
        /** Model that actually answered, as reported by the provider. */
        public readonly string $model,
    ) {
    }
}
