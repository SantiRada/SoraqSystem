<?php

declare(strict_types=1);

namespace Soraq\Core\Http;

/**
 * Small regex router with per-route and group middleware.
 *
 * Route params: '/projects/{projectId}' → handler receives ['projectId' => '...'].
 * Params only match [A-Za-z0-9_-]; anything else is a 404 before reaching the handler.
 */
final class Router
{
    /** @var list<array{method: string, regex: string, handler: callable, middleware: list<Middleware>}> */
    private array $routes = [];

    /** @var list<Middleware> */
    private array $groupStack = [];

    /** @param list<Middleware> $globalMiddleware applied to every matched route */
    public function __construct(private readonly array $globalMiddleware = [])
    {
    }

    /** @param list<Middleware> $middleware */
    public function get(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('GET', $pattern, $handler, $middleware);
    }

    /** @param list<Middleware> $middleware */
    public function post(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('POST', $pattern, $handler, $middleware);
    }

    /** @param list<Middleware> $middleware */
    public function patch(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('PATCH', $pattern, $handler, $middleware);
    }

    /** @param list<Middleware> $middleware */
    public function delete(string $pattern, callable $handler, array $middleware = []): void
    {
        $this->add('DELETE', $pattern, $handler, $middleware);
    }

    /**
     * @param list<Middleware>       $middleware
     * @param callable(Router): void $routes
     */
    public function group(array $middleware, callable $routes): void
    {
        $previous = $this->groupStack;
        $this->groupStack = [...$this->groupStack, ...$middleware];
        $routes($this);
        $this->groupStack = $previous;
    }

    public function dispatch(Request $request): Response
    {
        $allowed = [];

        foreach ($this->routes as $route) {
            if (!preg_match($route['regex'], $request->path, $matches)) {
                continue;
            }

            if ($route['method'] !== $request->method) {
                $allowed[] = $route['method'];
                continue;
            }

            $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
            $core = static fn (Request $r): Response => ($route['handler'])($r, $params);

            return $this->pipeline([...$this->globalMiddleware, ...$route['middleware']], $core)($request);
        }

        if ($allowed !== []) {
            throw HttpException::methodNotAllowed(array_values(array_unique($allowed)));
        }

        throw HttpException::notFound('errors.endpoint_not_found');
    }

    /** @param list<Middleware> $middleware */
    private function add(string $method, string $pattern, callable $handler, array $middleware): void
    {
        $regex = preg_replace('#\{([a-zA-Z][a-zA-Z0-9]*)\}#', '(?P<$1>[A-Za-z0-9_-]{1,64})', $pattern);

        $this->routes[] = [
            'method' => $method,
            'regex' => '#^' . $regex . '$#',
            'handler' => $handler,
            'middleware' => [...$this->groupStack, ...$middleware],
        ];
    }

    /**
     * @param list<Middleware>           $middleware
     * @param callable(Request): Response $core
     * @return callable(Request): Response
     */
    private function pipeline(array $middleware, callable $core): callable
    {
        $next = $core;

        foreach (array_reverse($middleware) as $layer) {
            $next = static fn (Request $r): Response => $layer->handle($r, $next);
        }

        return $next;
    }
}
