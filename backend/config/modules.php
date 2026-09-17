<?php

declare(strict_types=1);

/*
 * Enabled backend modules. Each entry maps to src/Modules/<Name>/routes.php.
 * Adding a module = create its folder + add one line here.
 * Removing a line disables every endpoint of that module without touching others.
 */
return [
    'Health',
    'Auth',
    'Projects',
    'Account',
    'Billing',
    'ProductContext',
    'CardSorting',
    'TreeTesting',
];
