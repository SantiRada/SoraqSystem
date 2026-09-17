import { paths } from '@/config/paths';
import { ContextPromptPage } from '@/features/product-context';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SectionBreadcrumb } from './SectionBreadcrumb';

/** Documentación → Context Prompt: mounts the product-context module with the workspace project. */
export function ContextPromptRoute() {
  const { project } = useWorkspace();
  return (
    <ContextPromptPage
      project={project}
      eyebrow={<SectionBreadcrumb sectionId="documentation" />}
      notesHref={paths.projectItem(project.id, 'research', 'product')}
    />
  );
}
