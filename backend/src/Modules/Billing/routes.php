<?php

declare(strict_types=1);

use Soraq\Core\Http\Request;
use Soraq\Core\Http\Response;
use Soraq\Core\Http\Router;
use Soraq\Core\Services;
use Soraq\Modules\Auth\AuthModule;
use Soraq\Modules\Auth\CurrentUser;
use Soraq\Modules\Billing\BillingRepository;

/*
 * Billing module — READ-ONLY until a payment provider is integrated (docs/decisions/0011).
 * No plan changes, checkout or card data are handled here.
 *
 * GET /billing/overview   auth   current user's subscription, next payment, payment history, available plans
 */
return static function (Router $router, Services $services): void {
    $router->group([AuthModule::requireAuth($services)], static function (Router $router) use ($services): void {
        $router->get('/billing/overview', static function (Request $request) use ($services): Response {
            $user = CurrentUser::from($request);
            $billing = new BillingRepository($services->db());

            return Response::json([
                'subscription' => $billing->subscriptionFor($user->id),
                'payments' => $billing->paymentsFor($user->id),
                'plans' => $billing->activePlans(),
                'checkoutAvailable' => false,
            ]);
        });
    });
};
