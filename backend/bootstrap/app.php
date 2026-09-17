<?php

declare(strict_types=1);

use Soraq\Core\Application;
use Soraq\Core\Config\Config;

require dirname(__DIR__) . '/src/autoload.php';

$root = dirname(__DIR__);

return new Application(Config::load($root), $root);
