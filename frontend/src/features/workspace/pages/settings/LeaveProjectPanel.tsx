import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Alert, Button, Dialog } from '@/design-system';
import type { Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { SettingsPanel } from './SettingsPanel';
import { useLeaveProject } from './useLeaveProject';

/** Shown to editors/viewers: leave a project that was shared with them (confirmation required). */
export function LeaveProjectPanel({ project }: { project: Project }) {
  const { t } = useI18n();
  const { leave, leaving, error } = useLeaveProject(project);
  const [confirming, setConfirming] = useState(false);

  return (
    <SettingsPanel headingId="leave-project-title" tone="danger" title={t('workspace.settings.leave.title')} description={t('workspace.settings.leave.description')}>
      {error && (
        <Alert tone="danger" title={t('workspace.settings.access.actionErrorTitle')}>
          {error}
        </Alert>
      )}
      <div>
        <Button variant="danger" leadingIcon={<LogOut />} onPress={() => setConfirming(true)}>
          {t('workspace.settings.leave.submit')}
        </Button>
      </div>

      <Dialog
        isOpen={confirming}
        onClose={() => !leaving && setConfirming(false)}
        title={t('workspace.settings.leave.confirmTitle', { project: project.name })}
        description={t('workspace.settings.leave.description')}
        footer={
          <>
            <Button variant="ghost" onPress={() => setConfirming(false)} isDisabled={leaving}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="danger" isLoading={leaving} onPress={leave}>
              {leaving ? t('workspace.settings.leave.leaving') : t('workspace.settings.leave.submit')}
            </Button>
          </>
        }
      />
    </SettingsPanel>
  );
}
