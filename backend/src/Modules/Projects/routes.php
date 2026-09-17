<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Projects\ProjectController;
use Soraq\Modules\Projects\ProjectMemberRepository;
use Soraq\Modules\Projects\ProjectMemberService;
use Soraq\Modules\Projects\ProjectPolicy;
use Soraq\Modules\Projects\ProjectRepository;
use Soraq\Modules\Projects\ProjectService;
use Soraq\Modules\Users\UserRepository;

/*
 * Projects module — REFERENCE IMPLEMENTATION of authenticated, scoped resources.
 * Access = owner OR member (editor/viewer). Permissions: ProjectPolicy.
 *
 * GET    /projects                               auth   projects the user can access
 * POST   /projects                               auth   create (caller becomes owner)
 * GET    /projects/{projectId}                   auth   404 if no access
 * PATCH  /projects/{projectId}                   auth   owner|editor · name, description
 * DELETE /projects/{projectId}                   auth   owner · body { confirmName }
 * GET    /projects/{projectId}/members           auth   any access · owner + members
 * POST   /projects/{projectId}/members           auth   owner · { email, role }
 * PATCH  /projects/{projectId}/members/{userId}  auth   owner · { role }
 * DELETE /projects/{projectId}/members/{userId}  auth   owner, or the member themselves (leave)
 */
return static function (Router $router, Services $services): void {
    $controller = static function () use ($services): ProjectController {
        $policy = new ProjectPolicy();
        $projects = new ProjectService(
            new ProjectRepository($services->db()),
            $policy,
            $services->audit(),
            $services->rateLimiter(),
            $services->rateLimit('project_create_per_user'),
        );

        return new ProjectController(
            $projects,
            new ProjectMemberService(
                $projects,
                new ProjectMemberRepository($services->db()),
                new UserRepository($services->db()),
                $policy,
                $services->audit(),
                $services->rateLimiter(),
                $services->rateLimit('project_members_per_user'),
            ),
        );
    };

    $router->group([AuthModule::requireAuth($services)], static function (Router $router) use ($controller): void {
        $router->get('/projects', static fn (Request $r) => $controller()->index($r));
        $router->post('/projects', static fn (Request $r) => $controller()->store($r));
        $router->get('/projects/{projectId}', static fn (Request $r, array $p) => $controller()->show($r, $p));
        $router->patch('/projects/{projectId}', static fn (Request $r, array $p) => $controller()->update($r, $p));
        $router->delete('/projects/{projectId}', static fn (Request $r, array $p) => $controller()->destroy($r, $p));
        $router->get('/projects/{projectId}/members', static fn (Request $r, array $p) => $controller()->members($r, $p));
        $router->post('/projects/{projectId}/members', static fn (Request $r, array $p) => $controller()->addMember($r, $p));
        $router->patch('/projects/{projectId}/members/{userId}', static fn (Request $r, array $p) => $controller()->updateMember($r, $p));
        $router->delete('/projects/{projectId}/members/{userId}', static fn (Request $r, array $p) => $controller()->removeMember($r, $p));
    });
};
