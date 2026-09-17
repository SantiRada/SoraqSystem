<?php

declare(strict_types=1);

namespace Soraq\Modules\Projects;

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Modules\Auth\CurrentUser;

final class ProjectController
{
    public function __construct(
        private readonly ProjectService $service,
        private readonly ProjectMemberService $members,
    ) {
    }

    public function index(Request $request): Response
    {
        $projects = $this->service->listFor(CurrentUser::from($request));

        return Response::json(array_map(static fn (Project $p): array => $p->toPublicArray(), $projects));
    }

    /** @param array<string, string> $params */
    public function show(Request $request, array $params): Response
    {
        return Response::json($this->service->getFor(CurrentUser::from($request), $params['projectId'])->toPublicArray());
    }

    public function store(Request $request): Response
    {
        $project = $this->service->create(CurrentUser::from($request), $request->json(), $request);

        return Response::json($project->toPublicArray(), 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, array $params): Response
    {
        $project = $this->service->update(CurrentUser::from($request), $params['projectId'], $request->json(), $request);

        return Response::json($project->toPublicArray());
    }

    /** @param array<string, string> $params */
    public function destroy(Request $request, array $params): Response
    {
        $this->service->delete(CurrentUser::from($request), $params['projectId'], $request->json(), $request);

        return Response::noContent();
    }

    /** @param array<string, string> $params */
    public function members(Request $request, array $params): Response
    {
        return Response::json($this->members->list(CurrentUser::from($request), $params['projectId']));
    }

    /** @param array<string, string> $params */
    public function addMember(Request $request, array $params): Response
    {
        return Response::json($this->members->add(CurrentUser::from($request), $params['projectId'], $request->json(), $request), 201);
    }

    /** @param array<string, string> $params */
    public function updateMember(Request $request, array $params): Response
    {
        return Response::json(
            $this->members->updateRole(CurrentUser::from($request), $params['projectId'], $params['userId'], $request->json(), $request),
        );
    }

    /** @param array<string, string> $params */
    public function removeMember(Request $request, array $params): Response
    {
        $this->members->remove(CurrentUser::from($request), $params['projectId'], $params['userId'], $request);

        return Response::noContent();
    }
}
