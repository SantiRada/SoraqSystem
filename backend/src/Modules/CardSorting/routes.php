<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Auth\CurrentUser;
use Soraq\Modules\CardSorting\CardSortRepository;
use Soraq\Modules\CardSorting\CardSortService;
use Soraq\Modules\CardSorting\ParticipantService;
use Soraq\Modules\Projects\ProjectPolicy;
use Soraq\Modules\Projects\ProjectRepository;
use Soraq\Modules\Projects\ProjectService;
use Soraq\Modules\Users\UserRepository;

/*
 * CardSorting module (docs/modules/card-sorting.md). Permissions: CardSortService docblock.
 *
 * Designer (auth)
 * GET    /projects/{projectId}/card-sorts           any project access · list
 * POST   /projects/{projectId}/card-sorts           owner|editor · { name } → study with default content
 * GET    /card-sorts/shared                         studies shared read-only with me
 * GET    /card-sorts/{studyId}                      any access (incl. shared viewer)
 * PATCH  /card-sorts/{studyId}                      owner|editor · full document
 * DELETE /card-sorts/{studyId}                      owner|editor · { confirmName }
 * POST   /card-sorts/{studyId}/status               owner|editor · { action: publish|pause|resume|close }
 * GET    /card-sorts/{studyId}/report               any access
 * DELETE /card-sorts/{studyId}/responses            owner|editor · { confirmName }
 * GET    /card-sorts/{studyId}/viewers              owner|editor
 * POST   /card-sorts/{studyId}/viewers              owner|editor · { email }
 * DELETE /card-sorts/{studyId}/viewers/{userId}     owner|editor
 *
 * Participant (public, anonymous; rate limited per IP)
 * GET    /public/card-sorts/{code}                  status + welcome / closed message
 * POST   /public/card-sorts/{code}/responses        start → { token, flow }
 * POST   /public/card-sorts/{code}/screening        { token, answers }
 * POST   /public/card-sorts/{code}/complete         { token, categories, postAnswers }
 */
return static function (Router $router, Services $services): void {
    $designer = static fn (): CardSortService => new CardSortService(
        new CardSortRepository($services->db()),
        new ProjectService(new ProjectRepository($services->db()), new ProjectPolicy(), $services->audit(), $services->rateLimiter(), $services->rateLimit('project_create_per_user')),
        new ProjectPolicy(),
        new UserRepository($services->db()),
        $services->translator(),
        $services->audit(),
        $services->rateLimiter(),
        $services->rateLimit('card_sort_write_per_user'),
        $services->rateLimit('card_sort_share_per_user'),
    );

    $participant = static fn (): ParticipantService => new ParticipantService(
        new CardSortRepository($services->db()),
        $services->rateLimiter(),
        $services->rateLimit('card_sort_start_per_ip'),
        $services->rateLimit('card_sort_submit_per_ip'),
    );

    $router->group([AuthModule::requireAuth($services)], static function (Router $router) use ($designer): void {
        $user = static fn (Request $r) => CurrentUser::from($r);

        $router->get('/projects/{projectId}/card-sorts', static fn (Request $r, array $p) => Response::json($designer()->listForProject($user($r), $p['projectId'])));
        $router->post('/projects/{projectId}/card-sorts', static fn (Request $r, array $p) => Response::json($designer()->create($user($r), $p['projectId'], $r->json(), $r), 201));
        $router->get('/card-sorts/shared', static fn (Request $r) => Response::json($designer()->listShared($user($r))));
        $router->get('/card-sorts/{studyId}', static fn (Request $r, array $p) => Response::json($designer()->show($user($r), $p['studyId'])));
        $router->patch('/card-sorts/{studyId}', static fn (Request $r, array $p) => Response::json($designer()->update($user($r), $p['studyId'], $r->json(), $r)));
        $router->delete('/card-sorts/{studyId}', static function (Request $r, array $p) use ($designer, $user): Response {
            $designer()->delete($user($r), $p['studyId'], $r->json(), $r);

            return Response::noContent();
        });
        $router->post('/card-sorts/{studyId}/status', static fn (Request $r, array $p) => Response::json($designer()->changeStatus($user($r), $p['studyId'], $r->json(), $r)));
        $router->get('/card-sorts/{studyId}/report', static fn (Request $r, array $p) => Response::json($designer()->report($user($r), $p['studyId'])));
        $router->delete('/card-sorts/{studyId}/responses', static function (Request $r, array $p) use ($designer, $user): Response {
            $designer()->deleteResponses($user($r), $p['studyId'], $r->json(), $r);

            return Response::noContent();
        });
        $router->get('/card-sorts/{studyId}/viewers', static fn (Request $r, array $p) => Response::json($designer()->viewers($user($r), $p['studyId'])));
        $router->post('/card-sorts/{studyId}/viewers', static fn (Request $r, array $p) => Response::json($designer()->addViewer($user($r), $p['studyId'], $r->json(), $r), 201));
        $router->delete('/card-sorts/{studyId}/viewers/{userId}', static function (Request $r, array $p) use ($designer, $user): Response {
            $designer()->removeViewer($user($r), $p['studyId'], $p['userId'], $r);

            return Response::noContent();
        });
    });

    $router->get('/public/card-sorts/{code}', static fn (Request $r, array $p) => Response::json($participant()->landing($p['code'])));
    $router->post('/public/card-sorts/{code}/responses', static fn (Request $r, array $p) => Response::json($participant()->start($p['code'], $r), 201));
    $router->post('/public/card-sorts/{code}/screening', static fn (Request $r, array $p) => Response::json($participant()->screening($p['code'], $r->json(), $r)));
    $router->post('/public/card-sorts/{code}/complete', static fn (Request $r, array $p) => Response::json($participant()->complete($p['code'], $r->json(), $r)));
};
