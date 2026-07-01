import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, Boxes } from 'lucide-react';
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
      {module.note && (
        <p className="mt-3 rounded-md border border-border bg-card p-3 text-sm">{module.note}</p>
      )}

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

/** One element: name + asn1Type, expandable to its description, metadata, named values and fields. */
function ElementRow({ el }: { el: IndexElement }) {
  const asn1 = el.annotation?.asn1;
  const fields = el.fields ?? [];
  const count = fields.length || el.values?.length || 0;
  const chips = [
    asn1?.category,
    asn1?.unit && `unit: ${asn1.unit}`,
    el.constraint && `${el.constraint.min ?? '?'} … ${el.constraint.max ?? '?'}`,
  ].filter(Boolean) as string[];

  return (
    <details className="rounded-md border border-border/60 open:bg-accent/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm">
        <span className="font-medium">{el.elementName}</span>
        <Badge variant="outline" className="font-mono text-[10px]">
          {el.asn1Type}
        </Badge>
        {count > 0 && <span className="ml-auto text-xs text-muted-foreground">{count}</span>}
      </summary>

      <div className="flex flex-col gap-3 border-t border-border/60 px-3 py-2.5">
        {asn1?.description && (
          <p className="whitespace-pre-line border-l-2 border-border pl-3 text-xs leading-relaxed text-muted-foreground">
            {asn1.description}
          </p>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {chips.map((c) => (
              <span key={c} className="rounded bg-secondary px-1.5 py-0.5 text-[11px] text-secondary-foreground">
                {c}
              </span>
            ))}
          </div>
        )}

        {el.values && el.values.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 text-xs">
            {el.values.map((v) => (
              <li key={v.name} className="rounded bg-secondary px-1.5 py-0.5 font-mono text-secondary-foreground">
                {v.name} <span className="text-muted-foreground">({v.value})</span>
              </li>
            ))}
          </ul>
        )}

        {fields.length > 0 && (
          <ul className="flex flex-col gap-1.5 text-sm">
            {fields.map((f) => (
              <li key={f.name} className="flex flex-col gap-0.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate">
                    {f.name}
                    {f.optional && <span className="ml-1 text-xs text-muted-foreground">optional</span>}
                  </span>
                  <span className="truncate font-mono text-xs text-muted-foreground">{f.type}</span>
                </div>
                {f.annotation?.asn1?.description && (
                  <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground/80">
                    {f.annotation.asn1.description}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {asn1?.notes?.map((n, i) => (
          <p key={i} className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground/70">
            <span className="font-medium">Note:</span> {n}
          </p>
        ))}
      </div>
    </details>
  );
}
