import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Badge, Card } from '@/design-system';
import { paths } from '@/config/paths';
import { useI18n } from '@/i18n';
import { formatDateTime, formatRelativeTime } from '@/shared/i18n/format';
import type { Project } from '../model/types';

/** Whole card = one link target (single tab stop, large Fitts target). */
export function ProjectCard({ project }: { project: Project }) {
  const { t } = useI18n();

  return (
    <Card className="group relative h-full min-h-40 gap-3 rounded-3xl border border-border bg-surface p-6 transition-colors hover:border-border-tertiary hover:bg-surface-secondary focus-within:border-focus">
      <Card.Header className="flex-row items-start justify-between gap-4 p-0">
        <Card.Title className="text-base font-semibold [overflow-wrap:anywhere]">
          <Link
            to={paths.project(project.id)}
            className="text-foreground no-underline outline-none after:absolute after:inset-0 after:rounded-3xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus"
          >
            {project.name}
          </Link>
        </Card.Title>
        <ArrowUpRight aria-hidden="true" className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Card.Header>
      {project.description && (
        <Card.Description className="line-clamp-2 text-sm text-muted">{project.description}</Card.Description>
      )}
      {project.accessRole !== 'owner' && (
        <Badge className="self-start">{t('projects.list.shared', { role: t(`workspace.roles.${project.accessRole}`) })}</Badge>
      )}
      <Card.Footer className="mt-auto p-0 text-xs text-muted">
        {/* Whole sentence translated (word order differs between languages). */}
        <time dateTime={project.updatedAt} title={formatDateTime(project.updatedAt)}>
          {t('projects.list.updated', { time: formatRelativeTime(project.updatedAt) })}
        </time>
      </Card.Footer>
    </Card>
  );
}
