import { useState, type ReactNode } from 'react';
import { Pencil, Plus, RefreshCw, StickyNote, Trash2 } from 'lucide-react';
import { Alert, Button, Card, Dialog, EmptyState, IconButton, LoadingState, PageHeader } from '@/design-system';
import { projectPermissions, type Project } from '@/features/projects';
import { useI18n } from '@/i18n';
import { toUserMessage } from '@/shared/api/ApiError';
import { useApiQuery } from '@/shared/api/useApiQuery';
import { formatDate } from '@/shared/i18n/format';
import { usePageMeta } from '@/shared/seo/usePageMeta';
import { productContextApi } from '../api/productContextApi';
import type { ProductNote, ProductNoteInput } from '../model/types';
import { NoteFormDialog } from './NoteFormDialog';

const SUGGESTIONS = ['problem', 'goals', 'solutions', 'pov', 'mvp', 'context'] as const;

type Editing = { mode: 'create'; initial: ProductNoteInput } | { mode: 'edit'; note: ProductNote };

/**
 * Investigación → Producto: free-form notes that define the product, shown as a masonry board.
 * Notes are stored in full; Documentación → Context Prompt summarises them.
 */
export function ProductNotesPage({ project, eyebrow }: { project: Project; eyebrow?: ReactNode }) {
  const { t } = useI18n();
  usePageMeta({ title: `${t('productContext.notes.title')} · ${project.name}`, noindex: true });

  const canEdit = projectPermissions.canUpdate(project.accessRole);
  const notes = useApiQuery((signal) => productContextApi.notes(project.id, signal), [project.id]);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [deleting, setDeleting] = useState<ProductNote | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const openCreate = (title = '') => {
    setStatus(null);
    setEditing({ mode: 'create', initial: { title, body: '' } });
  };

  async function save(input: ProductNoteInput) {
    if (!editing) return;
    if (editing.mode === 'create') {
      const created = await productContextApi.createNote(project.id, input);
      notes.setData((list) => [created, ...list]);
      setStatus(t('productContext.notes.created'));
    } else {
      const updated = await productContextApi.updateNote(project.id, editing.note.id, input);
      notes.setData((list) => list.map((note) => (note.id === updated.id ? updated : note)));
      setStatus(t('productContext.notes.updated'));
    }
    setActionError(null);
    setEditing(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await productContextApi.deleteNote(project.id, deleting.id);
      notes.setData((list) => list.filter((note) => note.id !== deleting.id));
      setStatus(t('productContext.notes.deleted'));
      setActionError(null);
    } catch (error) {
      setActionError(toUserMessage(error, t));
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  }

  const count = notes.status === 'success' ? notes.data.length : 0;

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={t('productContext.notes.title')}
        description={t('productContext.notes.description')}
        actions={
          canEdit && count > 0 ? (
            <Button variant="contrast" leadingIcon={<Plus />} onPress={() => openCreate()}>
              {t('productContext.notes.newNote')}
            </Button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6">
        {!canEdit && (
          <Alert tone="info" title={t('productContext.notes.readOnlyTitle')}>
            {t('productContext.notes.readOnly')}
          </Alert>
        )}
        <p role="status" className="sr-only">
          {status}
        </p>
        {actionError && (
          <Alert tone="danger" title={t('productContext.notes.actionErrorTitle')}>
            {actionError}
          </Alert>
        )}

        {notes.status === 'loading' && <LoadingState label={t('productContext.notes.loading')} />}

        {notes.status === 'error' && (
          <Alert
            tone="danger"
            title={t('productContext.notes.loadErrorTitle')}
            action={
              <Button variant="secondary" size="sm" leadingIcon={<RefreshCw />} onPress={notes.reload}>
                {t('common.actions.tryAgain')}
              </Button>
            }
          >
            {toUserMessage(notes.error, t)}
          </Alert>
        )}

        {notes.status === 'success' && count === 0 && (
          <EmptyState
            className="min-h-[50dvh] justify-center"
            icon={<StickyNote />}
            title={t('productContext.notes.emptyTitle')}
            description={canEdit ? t('productContext.notes.emptyDescription') : undefined}
            action={
              canEdit ? (
                <div className="grid justify-items-center gap-4">
                  <ul aria-label={t('productContext.notes.suggestionsLabel')} className="flex list-none flex-wrap justify-center gap-2 p-0">
                    {SUGGESTIONS.map((key) => (
                      <li key={key}>
                        <Button variant="secondary" size="sm" onPress={() => openCreate(t(`productContext.notes.suggestions.${key}`))}>
                          {t(`productContext.notes.suggestions.${key}`)}
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Button variant="contrast" leadingIcon={<Plus />} onPress={() => openCreate()}>
                    {t('productContext.notes.newNote')}
                  </Button>
                </div>
              ) : undefined
            }
          />
        )}

        {notes.status === 'success' && count > 0 && (
          <section aria-labelledby="product-notes-heading">
            <h2 id="product-notes-heading" className="mb-4 text-sm text-muted">
              {t('productContext.notes.count', { count })}
            </h2>
            {/* Masonry: 3 columns on desktop (2 tablet, 1 mobile); each card is as tall as its text. DOM order stays the reading/tab order. */}
            <ul aria-label={t('productContext.notes.listLabel')} className="list-none columns-1 gap-4 p-0 sm:columns-2 lg:columns-3">
              {notes.data.map((note) => (
                <li key={note.id} className="mb-4 break-inside-avoid">
                  <NoteCard
                    note={note}
                    canEdit={canEdit}
                    onEdit={() => {
                      setStatus(null);
                      setEditing({ mode: 'edit', note });
                    }}
                    onDelete={() => setDeleting(note)}
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {editing && (
        <NoteFormDialog
          mode={editing.mode}
          initial={editing.mode === 'create' ? editing.initial : { title: editing.note.title, body: editing.note.body }}
          onSubmit={save}
          onClose={() => setEditing(null)}
        />
      )}

      <Dialog
        isOpen={deleting !== null}
        onClose={() => !busy && setDeleting(null)}
        title={deleting ? t('productContext.notes.deleteDialog.title', { title: deleting.title }) : ''}
        description={t('productContext.notes.deleteDialog.description')}
        footer={
          <>
            <Button variant="ghost" onPress={() => setDeleting(null)} isDisabled={busy}>
              {t('common.actions.cancel')}
            </Button>
            <Button variant="danger" leadingIcon={<Trash2 />} isLoading={busy} onPress={confirmDelete}>
              {t('productContext.notes.deleteDialog.confirm')}
            </Button>
          </>
        }
      />
    </>
  );
}

function NoteCard({ note, canEdit, onEdit, onDelete }: { note: ProductNote; canEdit: boolean; onEdit: () => void; onDelete: () => void }) {
  const { t } = useI18n();
  const wasEdited = note.updatedAt !== note.createdAt;

  return (
    <Card className="gap-3 rounded-3xl border border-border bg-surface p-5">
      <article className="grid gap-3">
        <header className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 pt-1.5 text-base font-semibold [overflow-wrap:anywhere]">{note.title}</h3>
          {canEdit && (
            <div className="-me-2 -mt-1 flex shrink-0">
              <IconButton size="sm" label={t('productContext.notes.edit', { title: note.title })} icon={<Pencil />} onPress={onEdit} />
              <IconButton size="sm" label={t('productContext.notes.delete', { title: note.title })} icon={<Trash2 />} onPress={onDelete} />
            </div>
          )}
        </header>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/90 [overflow-wrap:anywhere]">{note.body}</p>
        <footer className="text-xs text-muted">
          {note.authorName ? t('productContext.notes.byAuthor', { name: note.authorName, date: formatDate(note.createdAt) }) : formatDate(note.createdAt)}
          {wasEdited && <span> · {t('productContext.notes.edited', { date: formatDate(note.updatedAt) })}</span>}
        </footer>
      </article>
    </Card>
  );
}
