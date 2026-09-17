<?php

declare(strict_types=1);

namespace Soraq\Core\Errors;

use Soraq\Core\Http\HttpException;
use Soraq\Core\Http\Response;
use Soraq\Core\I18n\Translator;
use Soraq\Core\Logging\Logger;
use Throwable;

/**
 * Converts any Throwable into a safe, localised JSON response.
 *
 * - HttpException → its status/code + translated message and field errors.
 * - Anything else → generic 500. SQL, stack traces, paths and secrets go to the
 *   log only. In local debug mode a short class/message hint is added.
 */
final class ErrorHandler
{
    public function __construct(
        private readonly Logger $logger,
        private readonly Translator $translator,
        private readonly bool $debug,
    ) {
    }

    public function render(Throwable $error, string $requestId): Response
    {
        if ($error instanceof HttpException) {
            $payload = [
                'code' => $error->errorCode,
                'message' => $this->translator->get($error->messageKey, $error->params),
                'requestId' => $requestId,
            ];

            if ($error->fields !== []) {
                $payload['fields'] = array_map(
                    fn (array $field): string => $this->translator->get($field[0], $field[1] ?? []),
                    $error->fields,
                );
            }

            $response = Response::error($error->status, $payload);
            foreach ($error->headers as $name => $value) {
                $response = $response->withHeader($name, $value);
            }

            return $response;
        }

        $this->logger->error('Unhandled exception', [
            'requestId' => $requestId,
            'exception' => $error::class,
            'message' => $error->getMessage(),
            'file' => $error->getFile() . ':' . $error->getLine(),
            'trace' => $error->getTraceAsString(),
        ]);

        $payload = [
            'code' => 'internal_error',
            'message' => $this->translator->get('errors.internal_error'),
            'requestId' => $requestId,
        ];

        if ($this->debug) {
            $payload['debug'] = $error::class . ': ' . $error->getMessage();
        }

        return Response::error(500, $payload);
    }
}
