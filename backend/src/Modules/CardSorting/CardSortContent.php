<?php

declare(strict_types=1);

namespace Soraq\Modules\CardSorting;

use Soraq\Core\I18n\Translator;
use Soraq\Core\Validation\Payload;
use Soraq\Core\Validation\RichText;
use Soraq\Modules\Studies\StudyFlow;

/**
 * The Card Sorting document: everything the designer configures (docs/modules/card-sorting.md → "Documento").
 *
 *  content  = purpose, participantRequirements, cardsHaveDescriptions, randomize*, cards, categories, flow
 *  settings = continueLabel, finishLabel, accentColor, socialLinks
 *
 * The flow and the settings are shared with every study ({@see StudyFlow}); this class only owns the activity
 * (cards and categories). normalize*() rebuild both documents from an allowlist with hard limits, so the
 * database only ever holds known keys and bounded sizes.
 */
final class CardSortContent
{
    public const SORT_TYPES = ['open', 'hybrid', 'closed'];
    public const QUESTION_TYPES = StudyFlow::QUESTION_TYPES;
    public const SOCIAL_NETWORKS = StudyFlow::SOCIAL_NETWORKS;

    // Safety bounds only (no product limit is shown to the designer).
    public const MAX_CARDS = 1000;
    public const MAX_CATEGORIES = 300;
    public const LABEL_MAX = StudyFlow::LABEL_MAX;
    public const CATEGORY_LABEL_MAX = 80;

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
                'cardsHaveDescriptions' => false,
                'randomizeCards' => false,
                'randomizeCategories' => false,
                'cards' => [],
                'categories' => [],
                'flow' => StudyFlow::defaultFlow($t, 'card_sorting', self::INSTRUCTIONS),
            ],
            'settings' => StudyFlow::defaultSettings($t, 'card_sorting'),
        ];
    }

    /**
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public static function normalizeContent(array $input, Payload $p): array
    {
        $cards = [];
        foreach ($p->objects($input['cards'] ?? [], 'cards', self::MAX_CARDS) as $i => $card) {
            $cards[] = [
                'id' => $p->id($card['id'] ?? null, "cards.$i.id"),
                'label' => $p->string($card['label'] ?? null, "cards.$i.label", self::LABEL_MAX),
                'description' => RichText::normalize($card['description'] ?? null, $p, "cards.$i.description", 2000),
            ];
        }
        $p->uniqueIds($cards, 'cards');

        $categories = [];
        foreach ($p->objects($input['categories'] ?? [], 'categories', self::MAX_CATEGORIES) as $i => $category) {
            $categories[] = [
                'id' => $p->id($category['id'] ?? null, "categories.$i.id"),
                'label' => $p->string($category['label'] ?? null, "categories.$i.label", self::CATEGORY_LABEL_MAX),
            ];
        }
        $p->uniqueIds($categories, 'categories');

        return [
            'purpose' => RichText::normalize($input['purpose'] ?? null, $p, 'purpose'),
            'participantRequirements' => RichText::normalize($input['participantRequirements'] ?? null, $p, 'participantRequirements'),
            'cardsHaveDescriptions' => $p->bool($input['cardsHaveDescriptions'] ?? false),
            'randomizeCards' => $p->bool($input['randomizeCards'] ?? false),
            'randomizeCategories' => $p->bool($input['randomizeCategories'] ?? false),
            'cards' => $cards,
            'categories' => $categories,
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

    /**
     * Requirements to publish (the draft may be incomplete while it is being written).
     *
     * @param array<string, mixed> $content
     */
    public static function assertPublishable(string $sortType, array $content, Payload $p): void
    {
        if (count($content['cards']) < 2) {
            $p->fail('cards', 'errors.card_sort_min_cards');
        }
        if ($sortType === 'hybrid' && count($content['categories']) < 1) {
            $p->fail('categories', 'errors.card_sort_min_categories_hybrid');
        }
        if ($sortType === 'closed' && count($content['categories']) < 2) {
            $p->fail('categories', 'errors.card_sort_min_categories_closed');
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
     * What a participant needs to go through the study. Random order is decided per participant here.
     *
     * @param array<string, mixed> $content
     * @param array<string, mixed> $settings
     * @return array<string, mixed>
     */
    public static function participantView(string $sortType, array $content, array $settings): array
    {
        $cards = $content['cards'];
        $categories = $content['categories'];
        if ($content['randomizeCards'] ?? false) {
            shuffle($cards);
        }
        if ($content['randomizeCategories'] ?? false) {
            shuffle($categories);
        }

        return [
            'sortType' => $sortType,
            'cards' => array_map(static fn (array $card): array => [
                'id' => $card['id'],
                'label' => $card['label'],
                'description' => $content['cardsHaveDescriptions'] ? $card['description'] : null,
            ], $cards),
            'categories' => $sortType === 'open' ? [] : $categories,
            'flow' => StudyFlow::participantFlow($content['flow']),
            'settings' => $settings,
        ];
    }

    /**
     * Frozen copy stored with each response: the version of cards and questions the participant answered.
     *
     * @param array<string, mixed> $content
     * @return array<string, mixed>
     */
    public static function snapshot(string $sortType, array $content): array
    {
        return [
            'sortType' => $sortType,
            'cards' => array_map(static fn (array $c): array => ['id' => $c['id'], 'label' => $c['label']], $content['cards']),
            'categories' => $sortType === 'open' ? [] : $content['categories'],
        ] + StudyFlow::snapshotQuestions($content['flow']);
    }
}
