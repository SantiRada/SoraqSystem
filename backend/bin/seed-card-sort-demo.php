<?php

declare(strict_types=1);

/*
 * LOCAL demo data for Card Sorting (development only).
 *
 *   php bin/seed-card-sort-demo.php
 *
 * Creates, in the debug account's first project (debug@debug.com, run seed-debug-user.php first):
 *   - a published hybrid card sorting "Demo · Menú del sitio" with screening and post-study questions,
 *   - 12 synthetic participants (10 completed, 2 screened out) so the report, matrix and dendrogram have data.
 * Running it again replaces the previous demo study. Refuses to run unless APP_ENV=development.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit(1);
}

require dirname(__DIR__) . '/src/autoload.php';

use Soraq\Core\Config\Config;
use Soraq\Core\Database\Database;
use Soraq\Core\I18n\Translator;
use Soraq\Core\Support\Ulid;
use Soraq\Modules\CardSorting\CardSortContent;
use Soraq\Modules\CardSorting\CardSortService;
use Soraq\Modules\CardSorting\RichText;

const DEMO_NAME = 'Demo · Menú del sitio';

$root = dirname(__DIR__);
$config = Config::load($root);
if ($config->get('app.env') !== 'development') {
    fwrite(STDERR, "Refusing to run: APP_ENV must be 'development'.\n");
    exit(1);
}

$db = new Database($config->get('database'));
$user = $db->fetchOne("SELECT id FROM users WHERE email = 'debug@debug.com'");
if ($user === null) {
    fwrite(STDERR, "Run php bin/seed-debug-user.php first.\n");
    exit(1);
}
$userId = (int) $user['id'];

$project = $db->fetchOne('SELECT id, name FROM projects WHERE owner_user_id = :user ORDER BY id LIMIT 1', ['user' => $userId]);
if ($project === null) {
    $projectId = $db->insert(
        "INSERT INTO projects (public_id, owner_user_id, name, description) VALUES (:public_id, :user, 'Proyecto demo', 'Datos de ejemplo locales')",
        ['public_id' => Ulid::generate(), 'user' => $userId],
    );
    $project = ['id' => $projectId, 'name' => 'Proyecto demo'];
}

$db->execute('DELETE FROM card_sorts WHERE project_id = :project AND name = :name', ['project' => $project['id'], 'name' => DEMO_NAME]);

$defaults = CardSortContent::defaults(new Translator($root . '/lang', 'es', 'es'));
$content = $defaults['content'];

$labels = ['Inicio', 'Precios', 'Planes para empresas', 'Blog', 'Guías', 'Casos de éxito', 'Sobre nosotros', 'Equipo', 'Trabaja con nosotros', 'Contacto', 'Ayuda', 'Estado del servicio'];
$cardIds = [];
foreach ($labels as $i => $label) {
    $cardIds[$label] = 'card' . ($i + 1);
    $content['cards'][] = ['id' => 'card' . ($i + 1), 'label' => $label, 'description' => ['type' => 'doc', 'content' => []]];
}
$content['categories'] = [['id' => 'cat1', 'label' => 'Empresa'], ['id' => 'cat2', 'label' => 'Recursos']];
$content['purpose'] = RichText::paragraph('Validar cómo agrupan las personas las secciones del menú principal antes del rediseño.');
$content['participantRequirements'] = RichText::paragraph('Personas que usaron el sitio al menos una vez en los últimos 3 meses.');
$content['flow']['context']['enabled'] = true;
$content['flow']['screening'] = [
    'enabled' => true,
    'questions' => [[
        'id' => 'q1',
        'prompt' => '¿Usaste nuestro sitio en los últimos 3 meses?',
        'options' => [['id' => 'yes', 'label' => 'Sí', 'qualifies' => true], ['id' => 'no', 'label' => 'No', 'qualifies' => false]],
    ]],
    'rejection' => $content['flow']['screening']['rejection'],
];
$content['flow']['postStudy'] = [
    'enabled' => true,
    'questions' => [
        ['id' => 'p1', 'type' => 'stars', 'prompt' => '¿Qué tan fácil fue ordenar las cards?', 'required' => true, 'options' => [], 'scaleMax' => 5],
        ['id' => 'p2', 'type' => 'radio', 'prompt' => '¿Con qué frecuencia visitas el sitio?', 'required' => false, 'options' => [['id' => 'w', 'label' => 'Cada semana'], ['id' => 'm', 'label' => 'Cada mes'], ['id' => 'r', 'label' => 'Rara vez']], 'scaleMax' => null],
        ['id' => 'p3', 'type' => 'text', 'prompt' => '¿Algo que te haya costado ubicar?', 'required' => false, 'options' => [], 'scaleMax' => null],
    ],
];

$publicId = Ulid::generate();
$code = 'demo' . substr(bin2hex(random_bytes(3)), 0, 4);
$studyId = $db->insert(
    "INSERT INTO card_sorts (public_id, project_id, created_by_user_id, name, status, sort_type, content, settings, share_code, project_slug, published_at)
     VALUES (:public_id, :project, :user, :name, 'active', 'hybrid', :content, :settings, :code, :slug, UTC_TIMESTAMP())",
    [
        'public_id' => $publicId,
        'project' => $project['id'],
        'user' => $userId,
        'name' => DEMO_NAME,
        'content' => json_encode($content, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        'settings' => json_encode(['socialLinks' => ['github' => 'https://github.com', 'instagram' => 'https://instagram.com']] + $defaults['settings'], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR),
        'code' => $code,
        'slug' => CardSortService::slug((string) $project['name']),
    ],
);

$snapshot = CardSortContent::snapshot('hybrid', $content);
$ids = static fn (array $names): array => array_map(static fn (string $n): string => $cardIds[$n], $names);
$groupings = [
    [['Empresa', 'cat1', ['Sobre nosotros', 'Equipo', 'Trabaja con nosotros', 'Casos de éxito']], ['Recursos', 'cat2', ['Blog', 'Guías']], ['Planes', null, ['Precios', 'Planes para empresas']], ['Soporte', null, ['Ayuda', 'Contacto', 'Estado del servicio']], ['Principal', null, ['Inicio']]],
    [['Empresa', 'cat1', ['Sobre nosotros', 'Equipo', 'Trabaja con nosotros']], ['Recursos', 'cat2', ['Blog', 'Guías', 'Casos de éxito']], ['Precios', null, ['Precios', 'Planes para empresas', 'Inicio']], ['Ayuda', null, ['Ayuda', 'Contacto', 'Estado del servicio']]],
    [['Empresa', 'cat1', ['Sobre nosotros', 'Equipo', 'Contacto']], ['Recursos', 'cat2', ['Blog', 'Guías', 'Ayuda']], ['precios', null, ['Precios', 'Planes para empresas']], ['Carreras', null, ['Trabaja con nosotros']], ['Otros', null, ['Inicio', 'Casos de éxito', 'Estado del servicio']]],
    [['Empresa', 'cat1', ['Sobre nosotros', 'Equipo', 'Trabaja con nosotros', 'Contacto']], ['Recursos', 'cat2', ['Blog', 'Guías', 'Casos de éxito']], ['Planes y precios', null, ['Precios', 'Planes para empresas']], ['Soporte', null, ['Ayuda', 'Estado del servicio', 'Inicio']]],
];

$db->transaction(function (Database $db) use ($studyId, $snapshot, $groupings, $ids): void {
    for ($n = 1; $n <= 12; $n++) {
        $screened = $n % 6 === 0;
        $categories = null;
        $post = null;
        if (!$screened) {
            $categories = array_map(static fn (array $g): array => ['label' => $g[0], 'predefinedId' => $g[1], 'cardIds' => $ids($g[2])], $groupings[$n % count($groupings)]);
            $post = ['p1' => 3 + ($n % 3), 'p2' => ['w', 'm', 'r'][$n % 3]] + ($n % 4 === 0 ? ['p3' => 'No encontré dónde ver el estado del servicio.'] : []);
        }
        $db->insert(
            "INSERT INTO card_sort_responses (card_sort_id, token_hash, participant_number, status, screening_passed, snapshot, screening_answers, post_answers, sort_result, started_at, finished_at, duration_seconds)
             VALUES (:study, :token, :number, :status, :passed, :snapshot, :screening, :post, :result, UTC_TIMESTAMP() - INTERVAL :ago MINUTE, UTC_TIMESTAMP() - INTERVAL :ago2 MINUTE, :duration)",
            [
                'study' => $studyId,
                'token' => hash('sha256', random_bytes(16)),
                'number' => $n,
                'status' => $screened ? 'screened_out' : 'completed',
                'passed' => $screened ? 0 : 1,
                'snapshot' => json_encode($snapshot, JSON_UNESCAPED_UNICODE),
                'screening' => json_encode(['q1' => $screened ? 'no' : 'yes']),
                'post' => $post === null ? null : json_encode($post, JSON_UNESCAPED_UNICODE),
                'result' => $categories === null ? null : json_encode($categories, JSON_UNESCAPED_UNICODE),
                'ago' => 600 - $n * 30,
                'ago2' => 590 - $n * 30,
                'duration' => $screened ? 40 : 240 + $n * 17,
            ],
        );
    }
});

fwrite(STDOUT, "Demo card sorting created in project \"{$project['name']}\".\n");
fwrite(STDOUT, 'Participant link: http://localhost:5173/cardsorting/' . CardSortService::slug((string) $project['name']) . "/$code\n");
