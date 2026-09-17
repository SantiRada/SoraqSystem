<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Ai\AiClientFactory;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Auth\CurrentUser;
use Soraq\Modules\ProductContext\ContextPromptRepository;
use Soraq\Modules\ProductContext\ContextPromptService;
use Soraq\Modules\ProductContext\ProductNoteRepository;
use Soraq\Modules\ProductContext\ProductNoteService;
use Soraq\Modules\Projects\ProjectPolicy;
use Soraq\Modules\Projects\ProjectRepository;
use Soraq\Modules\Projects\ProjectService;

/*
 * ProductContext module (docs/modules/product-context.md).
 * Project access is resolved by ProjectService::getFor (404 if no access); permissions by ProjectPolicy.
 *
 * GET    /projects/{projectId}/notes              auth   any access · notes, newest first
 * POST   /projects/{projectId}/notes              auth   owner|editor · { title, body }
 * PATCH  /projects/{projectId}/notes/{noteId}     auth   owner|editor · { title, body }
 * DELETE /projects/{projectId}/notes/{noteId}     auth   owner|editor
 * GET    /projects/{projectId}/context-prompt     auth   any access · stored summary + staleness
 * POST   /projects/{projectId}/context-prompt     auth   owner|editor · regenerate the summary with AI
 */
return static function (Router $router, Services $services): void {
    $projects = static fn (): ProjectService => new ProjectService(
        new ProjectRepository($services->db()),
        new ProjectPolicy(),
        $services->audit(),
        $services->rateLimiter(),
        $services->rateLimit('project_create_per_user'),
    );

    $notes = static fn (): ProductNoteService => new ProductNoteService(
        $projects(),
        new ProjectPolicy(),
        new ProductNoteRepository($services->db()),
        $services->audit(),
        $services->rateLimiter(),
        $services->rateLimit('product_notes_write_per_user'),
    );

    $prompt = static fn (): ContextPromptService => new ContextPromptService(
        $projects(),
        new ProjectPolicy(),
        new ProductNoteRepository($services->db()),
        new ContextPromptRepository($services->db()),
        AiClientFactory::fromConfig($services->config, $services->logger()),
        $services->audit(),
        $services->rateLimiter(),
        $services->rateLimit('context_prompt_generate_per_user'),
        (int) $services->config->get('ai.max_input_chars', 24000),
    );

    $router->group([AuthModule::requireAuth($services)], static function (Router $router) use ($notes, $prompt): void {
        $router->get('/projects/{projectId}/notes', static fn (Request $r, array $p) => Response::json($notes()->list(CurrentUser::from($r), $p['projectId'])));
        $router->post('/projects/{projectId}/notes', static fn (Request $r, array $p) => Response::json($notes()->create(CurrentUser::from($r), $p['projectId'], $r->json(), $r), 201));
        $router->patch('/projects/{projectId}/notes/{noteId}', static fn (Request $r, array $p) => Response::json($notes()->update(CurrentUser::from($r), $p['projectId'], $p['noteId'], $r->json(), $r)));
        $router->delete('/projects/{projectId}/notes/{noteId}', static function (Request $r, array $p) use ($notes): Response {
            $notes()->delete(CurrentUser::from($r), $p['projectId'], $p['noteId'], $r);

            return Response::noContent();
        });
        $router->get('/projects/{projectId}/context-prompt', static fn (Request $r, array $p) => Response::json($prompt()->show(CurrentUser::from($r), $p['projectId'])));
        $router->post('/projects/{projectId}/context-prompt', static fn (Request $r, array $p) => Response::json($prompt()->generate(CurrentUser::from($r), $p['projectId'], $r)));
    });
};
