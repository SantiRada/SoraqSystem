<?php

declare(strict_types=1);

namespace Soraq\Modules\TreeTesting;

use Soraq\Core\I18n\Translator;
use Soraq\Core\Validation\Payload;
use Soraq\Core\Validation\RichText;
use Soraq\Modules\Studies\StudyFlow;

/**
 * The Tree Testing document (docs/modules/tree-testing.md → "Documento").
 *
 *  content  = purpose, participantRequirements, tree (nested nodes), tasks (prompt + expected paths), flow
 *  settings = continueLabel, finishLabel, accentColor, socialLinks (shared with every study)
 *
 * A task's paths are lists of node ids from the root to the answer. The first one is the primary
 * (expected) path; the rest are acceptable alternatives.
 */
final class TreeTestContent
{
    public const MAX_NODES = 1000;
    public const MAX_DEPTH = 10;
    public const MAX_TASKS = 200;
    public const MAX_PATHS = 10;
    public const LABEL_MAX = 120;

    private const INSTRUCTIONS = [
        ['instruction1_title', ['instruction1_intro', 'instruction1_item1', 'instruction1_item2', 'instruction1_item3']],
        ['instruction2_title', ['instruction2_intro', 'instruction2_item1', 'instruction2_item2']],
    ];

    /** @return array{content: array<string, mixed>, settings: array<string, mixed>} */
    public static function defaults(Translator $t): array
    {
        return [
            'content' => [
                'purpose' => ['type' => 'doc', 'content' => []],
                'participantRequirements' => ['type' => 'doc', 'content' => []],
                'tree' => [],
                'tasks' => [],
                'flow' => StudyFlow::defaultFlow($t, 'tree_testing', self::INSTRUCTIONS),
            ],
            'settings' => StudyFlow::defaultSettings($t, 'tree_testing'),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function normalizeContent(array $input, Payload $p): array
    {
        $nodes = 0;
        $tree = self::nodes($input['tree'] ?? [], $p, 'tree', 1, $nodes);
        $ids = self::nodeIds($tree);

        $tasks = [];
        foreach ($p->objects($input['tasks'] ?? [], 'tasks', self::MAX_TASKS) as $i => $task) {
            $paths = [];
            foreach ($p->objects($task['paths'] ?? [], "tasks.$i.paths", self::MAX_PATHS) as $j => $path) {
                $nodeIds = [];
                foreach (is_array($path['nodeIds'] ?? null) ? $path['nodeIds'] : [] as $nodeId) {
                    if (!is_string($nodeId) || !in_array($nodeId, $ids, true)) {
                        $p->fail("tasks.$i.paths.$j.nodeIds", 'validation.invalid');
                        continue;
                    }
                    $nodeIds[] = $nodeId;
                }
                if ($nodeIds === []) {
                    $p->fail("tasks.$i.paths.$j.nodeIds", 'validation.required');
                    continue;
                }
                $paths[] = [
                    'id' => $p->id($path['id'] ?? null, "tasks.$i.paths.$j.id"),
                    'nodeIds' => $nodeIds,
                    'isPrimary' => $p->bool($path['isPrimary'] ?? false),
                ];
            }
            $p->uniqueIds($paths, "tasks.$i.paths");
            // Exactly one primary path: the first one marked, or the first path.
            $primaryFound = false;
            foreach ($paths as $k => $path) {
                $isPrimary = $path['isPrimary'] && !$primaryFound;
                $primaryFound = $primaryFound || $isPrimary;
                $paths[$k]['isPrimary'] = $isPrimary;
            }
            if (!$primaryFound && $paths !== []) {
                $paths[0]['isPrimary'] = true;
            }

            $tasks[] = [
                'id' => $p->id($task['id'] ?? null, "tasks.$i.id"),
                'prompt' => $p->string($task['prompt'] ?? null, "tasks.$i.prompt", StudyFlow::TITLE_MAX),
                'paths' => $paths,
            ];
        }
        $p->uniqueIds($tasks, 'tasks');

        return [
            'purpose' => RichText::normalize($input['purpose'] ?? null, $p, 'purpose'),
            'participantRequirements' => RichText::normalize($input['participantRequirements'] ?? null, $p, 'participantRequirements'),
            'tree' => $tree,
            'tasks' => $tasks,
            'flow' => StudyFlow::normalizeFlow($p->object($input['flow'] ?? null, 'flow'), $p),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function normalizeSettings(array $input, Payload $p): array
    {
        return StudyFlow::normalizeSettings($input, $p);
    }

    /** @param array<string, mixed> $content */
    public static function assertPublishable(array $content, Payload $p): void
    {
        if (count(self::nodeIds($content['tree'])) < 2) {
            $p->fail('tree', 'errors.tree_test_min_nodes');
        }
        if ($content['tasks'] === []) {
            $p->fail('tasks', 'errors.tree_test_min_tasks');
        }
        foreach ($content['tasks'] as $i => $task) {
            if ($task['prompt'] === '') {
                $p->fail("tasks.$i.prompt", 'validation.required');
            }
            if ($task['paths'] === []) {
                $p->fail("tasks.$i.paths", 'errors.tree_test_task_without_path');
            }
        }
        if ($content['flow']['screening']['enabled'] && $content['flow']['screening']['questions'] === []) {
            $p->fail('flow.screening', 'errors.card_sort_screening_empty');
        }
        if ($content['flow']['postStudy']['enabled'] && $content['flow']['postStudy']['questions'] === []) {
            $p->fail('flow.postStudy', 'errors.card_sort_post_empty');
        }
        $p->throwIfInvalid();
    }

    /**
     * What a participant receives: the tree without any hint of the answers, and the task prompts in order.
     *
     * @param array<string, mixed> $content
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
     */
    public static function participantView(array $content, array $settings): array
    {
        return [
            'tree' => $content['tree'],
            'tasks' => array_map(static fn (array $task): array => ['id' => $task['id'], 'prompt' => $task['prompt']], $content['tasks']),
            'flow' => StudyFlow::participantFlow($content['flow']),
            'settings' => $settings,
        ];
    }

    /**
     * Frozen with each response: tree, tasks WITH their expected paths (the report needs them) and questions.
     *
     * @param array<string, mixed> $content
     * @return array<string, mixed>
     */
    public static function snapshot(array $content): array
    {
        return ['tree' => $content['tree'], 'tasks' => $content['tasks']] + StudyFlow::snapshotQuestions($content['flow']);
    }

    /**
     * @param array<string, mixed> $tree
     * @return list<string>
     */
    public static function nodeIds(array $tree): array
    {
        $ids = [];
        foreach ($tree as $node) {
            $ids[] = $node['id'];
            $ids = [...$ids, ...self::nodeIds($node['children'])];
        }

        return $ids;
    }

    /**
     * @return list<array{id: string, label: string, children: list<array<string, mixed>>}>
     */
    private static function nodes(mixed $input, Payload $p, string $field, int $depth, int &$count): array
    {
        if ($depth > self::MAX_DEPTH) {
            $p->fail($field, 'errors.tree_test_too_deep');

            return [];
        }

        $out = [];
        foreach ($p->objects($input, $field, self::MAX_NODES) as $i => $node) {
            if (++$count > self::MAX_NODES) {
                $p->fail('tree', 'validation.too_many', ['max' => self::MAX_NODES]);
                break;
            }
            $out[] = [
                'id' => $p->id($node['id'] ?? null, "$field.$i.id"),
                'label' => $p->string($node['label'] ?? null, "$field.$i.label", self::LABEL_MAX),
                'children' => self::nodes($node['children'] ?? [], $p, "$field.$i.children", $depth + 1, $count),
            ];
        }

        return $out;
    }
}
