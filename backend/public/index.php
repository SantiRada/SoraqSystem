<?php

declare(strict_types=1);

/*
 * Soraq API front controller.
 *
 * Locally this file lives in backend/public/. In production it is copied to
 * public_html/api/ while the rest of the backend lives OUTSIDE the web root
 * (see docs/DEPLOYMENT.md). SORAQ_BACKEND_ROOT can point to that location.
 */

$backendRoot = getenv('SORAQ_BACKEND_ROOT') ?: dirname(__DIR__);

try {
    /** @var Soraq\Core\Application $app */
    $app = require $backendRoot . '/bootstrap/app.php';
    $app->run();
} catch (Throwable $bootError) {
    // Bootstrap failed before the error handler existed: never leak details.
    error_log('[soraq] bootstrap failure: ' . $bootError->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo '{"error":{"code":"internal_error","message":"Something went wrong on our side. Please try again."}}';
}
