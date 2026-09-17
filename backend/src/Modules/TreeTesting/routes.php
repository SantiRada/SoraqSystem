<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Auth\CurrentUser;
use Soraq\Modules\Projects\ProjectPolicy;
use Soraq\Modules\Projects\ProjectRepository;
use Soraq\Modules\Projects\ProjectService;
use Soraq\Modules\TreeTesting\ParticipantService;
use Soraq\Modules\TreeTesting\TreeTestRepository;
use Soraq\Modules\TreeTesting\TreeTestService;
use Soraq\Modules\Users\UserRepository;

/*
 * TreeTesting module (docs/modules/tree-testing.md). Same permissions and lifecycle as CardSorting.
 *
 * Designer (auth)
 * GET    /projects/{projectId}/tree-tests           any project access · list
 * POST   /projects/{projectId}/tree-tests           owner|editor · { name }
 * GET    /tree-tests/shared                         studies shared read-only with me
 * GET    /tree-tests/{studyId}                      any access (incl. shared viewer)
 * PATCH  /tree-tests/{studyId}                      owner|editor · full document
 * DELETE /tree-tests/{studyId}                      owner|editor · { confirmName }
 * POST   /tree-tests/{studyId}/status               owner|editor · { action }
 * GET    /tree-tests/{studyId}/report               any access
 * DELETE /tree-tests/{studyId}/responses            owner|editor · { confirmName }
 * GET/POST/DELETE /tree-tests/{studyId}/viewers[/{userId}]   owner|editor
 *
 * Participant (public, anonymous; rate limited per IP)
 * GET    /public/tree-tests/{code}                  status + welcome / closed message
 * POST   /public/tree-tests/{code}/responses        start → { token, tree, tasks, flow }
 * POST   /public/tree-tests/{code}/screening        { token, answers }
 * POST   /public/tree-tests/{code}/complete         { token, tasks, postAnswers }
 */
return static function (Router $router, Services $services): void {
    $designer = static fn (): TreeTestService => new TreeTestService(
        new TreeTestRepository($services->db()),
        new ProjectService(new ProjectRepository($services->db()), new ProjectPolicy(), $services->audit(), $services->rateLimiter(), $services->rateLimit('project_create_per_user')),
        new ProjectPolicy(),
        new UserRepository($services->db()),
        $services->translator(),
        $services->audit(),
        $services->rateLimiter(),
        $services->rateLimit('tree_test_write_per_user'),
        $services->rateLimit('tree_test_share_per_user'),
    );

    $participant = static fn (): ParticipantService => new ParticipantService(
        new TreeTestRepository($services->db()),
        $services->rateLimiter(),
        $services->rateLimit('tree_test_start_per_ip'),
        $services->rateLimit('tree_test_submit_per_ip'),
    );

    $router->group([AuthModule::requireAuth($services)], static function (Router $router) use ($designer): void {
        $user = static fn (Request $r) => CurrentUser::from($r);

        $router->get('/projects/{projectId}/tree-tests', static fn (Request $r, array $p) => Response::json($designer()->listForProject($user($r), $p['projectId'])));
        $router->post('/projects/{projectId}/tree-tests', static fn (Request $r, array $p) => Response::json($designer()->create($user($r), $p['projectId'], $r->json(), $r), 201));
        $router->get('/tree-tests/shared', static fn (Request $r) => Response::json($designer()->listShared($user($r))));
        $router->get('/tree-tests/{studyId}', static fn (Request $r, array $p) => Response::json($designer()->show($user($r), $p['studyId'])));
        $router->patch('/tree-tests/{studyId}', static fn (Request $r, array $p) => Response::json($designer()->update($user($r), $p['studyId'], $r->json(), $r)));
        $router->delete('/tree-tests/{studyId}', static function (Request $r, array $p) use ($designer, $user): Response {
            $designer()->delete($user($r), $p['studyId'], $r->json(), $r);

            return Response::noContent();
        });
        $router->post('/tree-tests/{studyId}/status', static fn (Request $r, array $p) => Response::json($designer()->changeStatus($user($r), $p['studyId'], $r->json(), $r)));
        $router->get('/tree-tests/{studyId}/report', static fn (Request $r, array $p) => Response::json($designer()->report($user($r), $p['studyId'])));
        $router->delete('/tree-tests/{studyId}/responses', static function (Request $r, array $p) use ($designer, $user): Response {
            $designer()->deleteResponses($user($r), $p['studyId'], $r->json(), $r);

            return Response::noContent();
        });
        $router->get('/tree-tests/{studyId}/viewers', static fn (Request $r, array $p) => Response::json($designer()->viewers($user($r), $p['studyId'])));
        $router->post('/tree-tests/{studyId}/viewers', static fn (Request $r, array $p) => Response::json($designer()->addViewer($user($r), $p['studyId'], $r->json(), $r), 201));
        $router->delete('/tree-tests/{studyId}/viewers/{userId}', static function (Request $r, array $p) use ($designer, $user): Response {
            $designer()->removeViewer($user($r), $p['studyId'], $p['userId'], $r);

            return Response::noContent();
        });
    });

    $router->get('/public/tree-tests/{code}', static fn (Request $r, array $p) => Response::json($participant()->landing($p['code'])));
    $router->post('/public/tree-tests/{code}/responses', static fn (Request $r, array $p) => Response::json($participant()->start($p['code'], $r), 201));
    $router->post('/public/tree-tests/{code}/screening', static fn (Request $r, array $p) => Response::json($participant()->screening($p['code'], $r->json(), $r)));
    $router->post('/public/tree-tests/{code}/complete', static fn (Request $r, array $p) => Response::json($participant()->complete($p['code'], $r->json(), $r)));
};
