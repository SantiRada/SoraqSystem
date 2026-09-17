import { useState } from 'react';
import { useNavigate } from 'react-router';
import { paths } from '@/config/paths';
import { useAuth } from '@/features/auth';
import { projectsApi, type Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { toUserMessage } from '@/shared/api/ApiError';

/** "Salir del proyecto" for editors/viewers: removes the own membership and returns to the projects list. */
export function useLeaveProject(project: Project) {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function leave() {
    if (!user) return;
    setLeaving(true);
    setError(null);
    try {
      await projectsApi.removeMember(project.id, user.id);
      navigate(paths.projects, { replace: true, state: { leftProject: project.name } });
    } catch (err) {
      setError(toUserMessage(err, t));
      setLeaving(false);
    }
  }

  return { leave, leaving, error };
}
