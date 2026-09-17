<?php

declare(strict_types=1);

namespace Soraq\Core\Audit;

use Soraq\Core\Database\Database;
use Soraq\Core\Http\Request;
use Soraq\Core\Logging\Logger;
use Throwable;

/**
 * Append-only audit trail of security-relevant actions (docs/SECURITY_AUDIT.md → Audit log).
 *
 * Action naming: "<module>.<event>" in snake_case, e.g. "auth.login", "project.created".
 * NEVER put passwords, tokens, full request bodies or private content in $metadata.
 * Failures are logged but never break the user action.
 */
final class AuditLogger
{
    public function __construct(
        private readonly Database $db,
        private readonly Logger $logger,
    ) {
    }

    /** @param array<string, scalar|null> $metadata */
    public function record(
        string $action,
        Request $request,
        ?int $actorUserId = null,
        ?string $targetType = null,
        ?string $targetId = null,
        array $metadata = [],
    ): void {
        try {
            $this->db->execute(
                'INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, ip_address, user_agent, request_id, metadata)
                 VALUES (:actor, :action, :target_type, :target_id, :ip, :user_agent, :request_id, :metadata)',
                [
                    'actor' => $actorUserId,
                    'action' => $action,
                    'target_type' => $targetType,
                    'target_id' => $targetId,
                    'ip' => $request->ip,
                    'user_agent' => $request->userAgent(),
                    'request_id' => $request->id,
                    'metadata' => $metadata === [] ? null : json_encode($metadata, JSON_THROW_ON_ERROR),
                ],
            );
        } catch (Throwable $error) {
            $this->logger->error('Audit log write failed', ['action' => $action, 'message' => $error->getMessage()]);
        }
    }
}
