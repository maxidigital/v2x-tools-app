import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import * as hub from '@/services/hubClient';
import type { IndexElement, Module } from '@/services/hubClient';
import { useAsync } from '@/hooks/useAsync';
import { Badge } from '@/components/ui/badge';
import { moduleName } from './Modules';

export function ModuleDetail() {
  const { moduleId = '' } = useParams();
  const location = useLocation();
  const passed = (location.state as { module?: Module } | null)?.module;

  // Navigated here → we already have the module. Deep-link / refresh → fetch the list and find it.
  const fallback = useAsync(() => hub.listModules(), [moduleId]);
  const module = passed ?? (fallback.data ?? []).find((m) => m.moduleId === moduleId) ?? null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-6">
      <Link
        to="/account/modules"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Modules
      </Link>

      {module ? (
        <ModuleBody module={module} />
      ) : fallback.loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <p className="text-sm text-destructive">Module not found.</p>
      )}
    </div>
  );
}

function ModuleBody({ module }: { module: Module }) {
  const elements = useAsync(() => hub.getModuleElements(module.moduleId), [module.moduleId]);
  const list = elements.data ?? [];

  return (
    <>
      <div className="flex items-center gap-2">
        <Boxes className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold tracking-tight">{moduleName(module)}</h1>
        <Badge variant={module.scope === 'private' ? 'primary' : 'default'}>
          {module.scope === 'private' ? 'Private' : 'Public'}
        </Badge>
      </div>
      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{module.oid}</p>
      <ShortEditor module={module} />

      <h2 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">
        Elements {!elements.loading && !elements.error && `(${list.length})`}
      </h2>
      {elements.loading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {elements.error && <p className="text-sm text-destructive">{elements.error}</p>}
      <div className="flex flex-col gap-1.5">
        {list.map((el) => (
          <ElementRow key={el.elementName} el={el} />
        ))}
      </div>
    </>
  );
}

/** The module's public one-line summary — click to edit, saved via the hub. */
function ShortEditor({ module }: { module: Module }) {
  const [short, setShort] = useState(module.short ?? '');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await hub.setModuleShort(module.moduleId, short.trim());
      setEditing(false);
      toast.success('Summary saved');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save summary');
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="mt-3 flex gap-2">
        <input
          autoFocus
          value={short}
          onChange={(e) => setShort(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          placeholder="Short summary (shown in the Modules list)…"
          className="h-8 flex-1 rounded-md border border-border bg-transparent px-3 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          onClick={save}
          disabled={saving}
          className="rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          Save
        </button>
        <button
          onClick={() => {
            setShort(module.short ?? '');
            setEditing(false);
          }}
          className="rounded-md px-2 text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      {short ? <span>{short}</span> : <span className="italic">Add a short summary…</span>}
      <Pencil className="h-3 w-3" />
    </button>
  );
}

/** One element: name + asn1Type, expandable to its ASN.1 structure — named values, range and fields.
 *  No comments/descriptions here (those live in the index for the MCP; the tab shows structure only). */
function ElementRow({ el }: { el: IndexElement }) {
  const fields = el.fields ?? [];
  const values = el.values ?? [];
  const range = el.constraint && `${el.constraint.min ?? '?'} … ${el.constraint.max ?? '?'}`;
  const hasBody = fields.length > 0 || values.length > 0 || Boolean(range);

  return (
    <details className="rounded-md border border-border/60 open:bg-accent/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm">
        <span className="font-medium">{el.elementName}</span>
        <Badge variant="outline" className="font-mono text-[10px]">
          {el.asn1Type}
        </Badge>
        {/* count only for containers (SEQUENCE/CHOICE members) */}
        {fields.length > 0 && <span className="ml-auto text-xs text-muted-foreground">{fields.length}</span>}
      </summary>

      <div className="flex flex-col gap-3 border-t border-border/60 px-3 py-2.5">
        {range && (
          <div>
            <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
              {range}
            </span>
          </div>
        )}

        {values.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 text-xs">
            {values.map((v) => (
              <li key={v.name} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-secondary-foreground">
                {v.name}
                {v.value !== '' && <span className="text-muted-foreground"> ({v.value})</span>}
              </li>
            ))}
          </ul>
        )}

        {fields.length > 0 && (
          <ul className="flex flex-col gap-1 text-sm">
            {fields.map((f) => (
              <li key={f.name} className="flex items-baseline justify-between gap-3">
                <span className="truncate">
                  {f.name}
                  {f.optional && <span className="ml-1 text-xs text-muted-foreground">optional</span>}
                </span>
                <span className="truncate font-mono text-xs text-muted-foreground">{f.type}</span>
              </li>
            ))}
          </ul>
        )}

        {!hasBody && <p className="text-xs text-muted-foreground">No further structure.</p>}
      </div>
    </details>
  );
}
