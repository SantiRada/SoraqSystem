import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Blocks,
  FileSearch,
  FileText,
  Layers,
  LayoutGrid,
  Map,
  MonitorSmartphone,
  PackageCheck,
  Palette,
  ScanEye,
  Sparkles,
  Stamp,
  StickyNote,
} from 'lucide-react';
import type { MessageKey } from '@/i18n';

/**
 * PROJECT WORKSPACE NAVIGATION — data mirror of /_SITEMAP.md (rules: docs/NAVIGATION.md).
 *
 *   Level 1  WorkspaceGroup    non-clickable label that divides the primary sidebar
 *   Level 2  WorkspaceSection  clickable item of the primary sidebar (has an icon)
 *   Level 3+ children          what can be created inside a section (secondary sidebar);
 *                              a WorkspaceSubgroup is a non-clickable label with its own items
 *
 * Reorganising navigation = editing this file (and _SITEMAP.md). IDs are URL slugs:
 * stable, English, lowercase — never translated, never reused for another meaning.
 */
export interface WorkspaceItem {
  id: string;
  labelKey: MessageKey;
  /**
   * Items whose module is available show this icon.
   * Items without an icon show "Sin empezar" until their module exists.
   */
  icon?: LucideIcon;
}

export interface WorkspaceSubgroup {
  id: string;
  labelKey: MessageKey;
  items: WorkspaceItem[];
}

export type WorkspaceChild = WorkspaceItem | WorkspaceSubgroup;

export interface WorkspaceSection {
  id: string;
  titleKey: MessageKey;
  descriptionKey: MessageKey;
  icon: LucideIcon;
  children: WorkspaceChild[];
}

export interface WorkspaceGroup {
  id: string;
  labelKey: MessageKey;
  sections: WorkspaceSection[];
}

const item = (id: string, labelKey: MessageKey, icon?: LucideIcon): WorkspaceItem => ({ id, labelKey, icon });

export const projectNavigation: WorkspaceGroup[] = [
  {
    id: 'plan',
    labelKey: 'workspace.groups.plan',
    sections: [
      {
        id: 'research',
        titleKey: 'workspace.sections.research.title',
        descriptionKey: 'workspace.sections.research.description',
        icon: FileSearch,
        children: [
          item('product', 'workspace.items.product', StickyNote),
          item('desktop-research', 'workspace.items.desktopResearch'),
          item('benchmarking', 'workspace.items.benchmarking'),
          item('surveys', 'workspace.items.surveys'),
          item('interviews', 'workspace.items.interviews'),
        ],
      },
      {
        id: 'synthesis',
        titleKey: 'workspace.sections.synthesis.title',
        descriptionKey: 'workspace.sections.synthesis.description',
        icon: Layers,
        children: [
          item('affinity-map', 'workspace.items.affinityMap'),
          item('empathy-map', 'workspace.items.empathyMap'),
          item('journey-map', 'workspace.items.journeyMap'),
        ],
      },
      {
        id: 'navigation',
        titleKey: 'workspace.sections.navigation.title',
        descriptionKey: 'workspace.sections.navigation.description',
        icon: Map,
        children: [
          {
            id: 'architecture',
            labelKey: 'workspace.subgroups.architecture',
            items: [
              item('card-sorting', 'workspace.items.cardSorting', LayoutGrid),
              item('tree-testing', 'workspace.items.treeTesting'),
              item('site-map', 'workspace.items.siteMap'),
            ],
          },
          {
            id: 'flows',
            labelKey: 'workspace.subgroups.flows',
            items: [
              item('task-flow', 'workspace.items.taskFlow'),
              item('user-flow', 'workspace.items.userFlow'),
              item('wire-flow', 'workspace.items.wireFlow'),
              item('flow-chart', 'workspace.items.flowChart'),
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'design',
    labelKey: 'workspace.groups.design',
    sections: [
      {
        id: 'brief',
        titleKey: 'workspace.sections.brief.title',
        descriptionKey: 'workspace.sections.brief.description',
        icon: FileText,
        children: [],
      },
      {
        id: 'brand',
        titleKey: 'workspace.sections.brand.title',
        descriptionKey: 'workspace.sections.brand.description',
        icon: Stamp,
        children: [item('brandbook', 'workspace.items.brandbook')],
      },
      {
        id: 'visual-aesthetics',
        titleKey: 'workspace.sections.visual.title',
        descriptionKey: 'workspace.sections.visual.description',
        icon: Palette,
        children: [item('moodboard', 'workspace.items.moodboard'), item('ui-kit', 'workspace.items.uiKit')],
      },
      {
        id: 'design-system',
        titleKey: 'workspace.sections.designSystem.title',
        descriptionKey: 'workspace.sections.designSystem.description',
        icon: Blocks,
        children: [
          item('foundations', 'workspace.items.foundations'),
          item('components', 'workspace.items.components'),
          item('variables', 'workspace.items.variables'),
        ],
      },
    ],
  },
  {
    id: 'testing',
    labelKey: 'workspace.groups.testing',
    sections: [
      {
        id: 'prototype',
        titleKey: 'workspace.sections.prototype.title',
        descriptionKey: 'workspace.sections.prototype.description',
        icon: MonitorSmartphone,
        children: [
          item('five-second-test', 'workspace.items.fiveSecondTest'),
          item('first-click-test', 'workspace.items.firstClickTest'),
          item('ab-test', 'workspace.items.abTest'),
          item('usability-test', 'workspace.items.usabilityTest'),
        ],
      },
      {
        id: 'tracking',
        titleKey: 'workspace.sections.tracking.title',
        descriptionKey: 'workspace.sections.tracking.description',
        icon: ScanEye,
        children: [
          item('eye', 'workspace.items.eyeTracking'),
          item('scroll', 'workspace.items.scrollTracking'),
          item('mouse', 'workspace.items.mouseTracking'),
          item('click', 'workspace.items.clickTracking'),
        ],
      },
    ],
  },
  {
    id: 'deliverables',
    labelKey: 'workspace.groups.deliverables',
    sections: [
      {
        id: 'handoff',
        titleKey: 'workspace.sections.handoff.title',
        descriptionKey: 'workspace.sections.handoff.description',
        icon: PackageCheck,
        children: [],
      },
      {
        id: 'documentation',
        titleKey: 'workspace.sections.documentation.title',
        descriptionKey: 'workspace.sections.documentation.description',
        icon: BookOpen,
        children: [
          item('md-files', 'workspace.items.mdFiles'),
          item('context-prompt', 'workspace.items.contextPrompt', Sparkles),
          item('resources', 'workspace.items.resources'),
        ],
      },
    ],
  },
];

export function isSubgroup(child: WorkspaceChild): child is WorkspaceSubgroup {
  return 'items' in child;
}

export function findSection(sectionId: string | undefined): { group: WorkspaceGroup; section: WorkspaceSection } | null {
  for (const group of projectNavigation) {
    const section = group.sections.find((s) => s.id === sectionId);
    if (section) return { group, section };
  }
  return null;
}

/** Every creatable item of a section, flattening subgroups. */
export function sectionItems(section: WorkspaceSection): WorkspaceItem[] {
  return section.children.flatMap((child) => (isSubgroup(child) ? child.items : [child]));
}

export function findItem(section: WorkspaceSection, itemId: string | undefined): WorkspaceItem | null {
  return sectionItems(section).find((i) => i.id === itemId) ?? null;
}
