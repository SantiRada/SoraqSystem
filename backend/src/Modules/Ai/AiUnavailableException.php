<?php

declare(strict_types=1);

namespace Soraq\Modules\Ai;

use RuntimeException;

/** Internal: the message is for logs only and never reaches the client. */
final class AiUnavailableException extends RuntimeException
{
}
