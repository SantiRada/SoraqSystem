<?php

declare(strict_types=1);

namespace Soraq\Core\Validation;

/**
 * Rich text documents written with the designer's editor (Tiptap JSON), e.g. descriptions.
 *
 * Stored as a JSON tree — never HTML — and rebuilt here from an allowlist:
 * nodes, marks and attribute VALUES are all enumerated, so a crafted document cannot inject
 * markup, arbitrary CSS or links. The frontend renders the same allowlist with React elements.
 */
final class RichText
{
    private const BLOCKS = ['paragraph', 'heading', 'bulletList', 'orderedList', 'listItem', 'horizontalRule'];
    private const INLINE = ['text', 'hardBreak'];
    public const FONTS = ['sans', 'serif', 'mono'];
    public const SIZES = ['sm', 'lg', 'xl'];
    public const WEIGHTS = ['medium', 'semibold'];

    private const MAX_DEPTH = 8;
    private const MAX_NODES = 3000;

    private int $nodes = 0;
    private int $chars = 0;

    private function __construct(
        private readonly Payload $payload,
        private readonly string $field,
        private readonly int $maxChars,
    ) {
    }

    /**
     * @return array<string, mixed> a normalised document ({type: doc, content: [...]}); empty doc when missing
     */
    public static function normalize(mixed $doc, Payload $payload, string $field, int $maxChars = 10000): array
    {
        $reader = new self($payload, $field, $maxChars);
        if ($doc === null) {
            return ['type' => 'doc', 'content' => []];
        }
        if (!is_array($doc) || ($doc['type'] ?? null) !== 'doc') {
            $payload->fail($field, 'validation.invalid');

            return ['type' => 'doc', 'content' => []];
        }

        $doc = ['type' => 'doc', 'content' => $reader->children($doc['content'] ?? [], 1, self::BLOCKS)];
        if ($reader->chars > $maxChars) {
            $payload->fail($field, 'validation.max', ['max' => $maxChars]);
        }

        return $doc;
    }

    /** A plain-paragraph document (used for default texts). */
    public static function paragraph(string $text): array
    {
        return ['type' => 'doc', 'content' => [['type' => 'paragraph', 'content' => [['type' => 'text', 'text' => $text]]]]];
    }

    /**
     * Inline text with **bold** and *italic* markers (used to build default texts from language files).
     *
     * @return list<array<string, mixed>>
     */
    public static function inline(string $text): array
    {
        $nodes = [];
        foreach (preg_split('/(\*\*[^*]+\*\*|\*[^*]+\*)/u', $text, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY) ?: [] as $part) {
            if (str_starts_with($part, '**') && str_ends_with($part, '**') && mb_strlen($part) > 4) {
                $nodes[] = ['type' => 'text', 'text' => mb_substr($part, 2, -2), 'marks' => [['type' => 'bold']]];
            } elseif (str_starts_with($part, '*') && str_ends_with($part, '*') && mb_strlen($part) > 2) {
                $nodes[] = ['type' => 'text', 'text' => mb_substr($part, 1, -1), 'marks' => [['type' => 'italic']]];
            } else {
                $nodes[] = ['type' => 'text', 'text' => $part];
            }
        }

        return $nodes;
    }

    /**
     * @param list<string> $allowed
     * @return list<array<string, mixed>>
     */
    private function children(mixed $nodes, int $depth, array $allowed): array
    {
        if (!is_array($nodes) || !array_is_list($nodes)) {
            $this->payload->fail($this->field, 'validation.invalid');

            return [];
        }
        if ($depth > self::MAX_DEPTH) {
            $this->payload->fail($this->field, 'validation.invalid');

            return [];
        }

        $out = [];
        foreach ($nodes as $node) {
            if (++$this->nodes > self::MAX_NODES) {
                $this->payload->fail($this->field, 'validation.max', ['max' => $this->maxChars]);
                break;
            }
            $clean = is_array($node) ? $this->node($node, $depth, $allowed) : null;
            if ($clean !== null) {
                $out[] = $clean;
            }
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $node
     * @param list<string>         $allowed
     * @return array<string, mixed>|null
     */
    private function node(array $node, int $depth, array $allowed): ?array
    {
        $type = $node['type'] ?? null;
        if (!is_string($type) || !in_array($type, $allowed, true)) {
            $this->payload->fail($this->field, 'validation.invalid');

            return null;
        }

        return match ($type) {
            'text' => $this->text($node),
            'hardBreak', 'horizontalRule' => ['type' => $type],
            'heading' => [
                'type' => 'heading',
                'attrs' => ['level' => in_array($node['attrs']['level'] ?? null, [2, 3], true) ? $node['attrs']['level'] : 2],
                'content' => $this->children($node['content'] ?? [], $depth + 1, self::INLINE),
            ],
            'paragraph' => ['type' => 'paragraph', 'content' => $this->children($node['content'] ?? [], $depth + 1, self::INLINE)],
            'bulletList' => ['type' => 'bulletList', 'content' => $this->children($node['content'] ?? [], $depth + 1, ['listItem'])],
            'orderedList' => [
                'type' => 'orderedList',
                'attrs' => ['start' => is_int($node['attrs']['start'] ?? null) ? max(1, min(999, $node['attrs']['start'])) : 1],
                'content' => $this->children($node['content'] ?? [], $depth + 1, ['listItem']),
            ],
            'listItem' => ['type' => 'listItem', 'content' => $this->children($node['content'] ?? [], $depth + 1, ['paragraph', 'heading', 'bulletList', 'orderedList', 'horizontalRule'])],
        };
    }

    /**
     * @param array<string, mixed> $node
     * @return array<string, mixed>|null
     */
    private function text(array $node): ?array
    {
        $text = $node['text'] ?? null;
        if (!is_string($text) || $text === '') {
            return null;
        }
        $this->chars += mb_strlen($text);

        $marks = [];
        foreach (is_array($node['marks'] ?? null) ? $node['marks'] : [] as $mark) {
            $type = is_array($mark) ? ($mark['type'] ?? null) : null;
            if ($type === 'bold' || $type === 'italic') {
                $marks[$type] = ['type' => $type];
            } elseif ($type === 'typography') {
                $attrs = [];
                foreach (['font' => self::FONTS, 'size' => self::SIZES, 'weight' => self::WEIGHTS] as $key => $values) {
                    $value = $mark['attrs'][$key] ?? null;
                    if (is_string($value) && in_array($value, $values, true)) {
                        $attrs[$key] = $value;
                    }
                }
                if ($attrs !== []) {
                    $marks['typography'] = ['type' => 'typography', 'attrs' => $attrs];
                }
            }
        }

        $clean = ['type' => 'text', 'text' => $text];
        if ($marks !== []) {
            $clean['marks'] = array_values($marks);
        }

        return $clean;
    }
}
