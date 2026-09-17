import { ProductNotesPage } from '@/features/product-context';
import { useWorkspace } from '../../context/WorkspaceContext';
import { SectionBreadcrumb } from './SectionBreadcrumb';

/** Investigación → Producto: mounts the product-context module with the workspace project. */
export function ProductNotesRoute() {
  const { project } = useWorkspace();
  return <ProductNotesPage project={project} eyebrow={<SectionBreadcrumb sectionId="research" />} />;
}
