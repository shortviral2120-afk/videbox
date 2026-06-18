"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { createClient } from "@/lib/supabase/client";
import type { Cliente, Cronograma, FaseCronograma } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CronogramaFormDialog } from "./cronograma-form-dialog";
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog";
import { formatDate, cn } from "@/lib/utils";
import { fasesCronograma, prioridadeColor } from "@/lib/status-styles";
import { toast } from "sonner";

export function CronogramaClient() {
  const [items, setItems] = useState<Cronograma[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Cronograma | null>(null);
  const [deleting, setDeleting] = useState<Cronograma | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const [croRes, cliRes] = await Promise.all([
      supabase
        .from("cronograma")
        .select("*, clientes(nome)")
        .order("created_at", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
    ]);
    if (croRes.data) setItems(croRes.data as unknown as Cronograma[]);
    if (cliRes.data) setClientes(cliRes.data as Cliente[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("cronograma").delete().eq("id", deleting.id);
    setDeleteLoading(false);
    if (error) {
      toast.error("Erro ao excluir serviço.");
      return;
    }
    toast.success("Serviço excluído.");
    setDeleting(null);
    load();
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const itemId = String(active.id);
    const newFase = over.id as FaseCronograma;
    const current = items.find((i) => i.id === itemId);
    if (!current || current.fase === newFase) return;

    const previousFase = current.fase;
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, fase: newFase } : i))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("cronograma")
      .update({ fase: newFase })
      .eq("id", itemId);

    if (error) {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, fase: previousFase } : i))
      );
      toast.error("Erro ao mover serviço.");
      return;
    }

    toast.success("Serviço movido.");
  }

  const activeItem = activeId ? items.find((i) => i.id === activeId) ?? null : null;

  return (
    <>
      <PageHeader
        title="Cronograma de Serviços"
        description="Acompanhe os serviços em andamento por fase"
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Novo serviço
          </Button>
        }
      />

      {loading ? (
        <div className="flex gap-4 overflow-x-auto kanban-scroll">
          {fasesCronograma.map((fase) => (
            <div key={fase} className="w-72 shrink-0 space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 overflow-x-auto kanban-scroll pb-2">
            {fasesCronograma.map((fase) => (
              <KanbanColumn
                key={fase}
                fase={fase}
                items={items.filter((i) => i.fase === fase)}
                onEdit={(item) => {
                  setEditing(item);
                  setFormOpen(true);
                }}
                onDelete={(item) => setDeleting(item)}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? <CronogramaCardContent item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>
      )}

      <CronogramaFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        item={editing}
        clientes={clientes}
        onSaved={load}
      />

      <ConfirmDeleteDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        onConfirm={handleDelete}
        itemLabel={deleting?.servico ?? undefined}
        loading={deleteLoading}
      />
    </>
  );
}

function KanbanColumn({
  fase,
  items,
  onEdit,
  onDelete,
}: {
  fase: FaseCronograma;
  items: Cronograma[];
  onEdit: (item: Cronograma) => void;
  onDelete: (item: Cronograma) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: fase });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "w-72 shrink-0 rounded-lg border bg-card flex flex-col",
        isOver && "ring-2 ring-primary/40"
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <span className="text-sm font-semibold">{fase}</span>
        <Badge variant="secondary">{items.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 p-2 overflow-y-auto max-h-[70vh]">
        {items.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Nenhum serviço</p>
        ) : (
          items.map((item) => (
            <CronogramaCard key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
          ))
        )}
      </div>
    </div>
  );
}

function CronogramaCard({
  item,
  onEdit,
  onDelete,
}: {
  item: Cronograma;
  onEdit: (item: Cronograma) => void;
  onDelete: (item: Cronograma) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onEdit(item)}
      className={cn(
        "rounded-md border bg-background p-3 cursor-pointer transition-opacity",
        isDragging && "opacity-30"
      )}
    >
      <CronogramaCardContent item={item} onEdit={onEdit} onDelete={onDelete} />
    </div>
  );
}

function CronogramaCardContent({
  item,
  onEdit,
  onDelete,
}: {
  item: Cronograma;
  onEdit?: (item: Cronograma) => void;
  onDelete?: (item: Cronograma) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm">{item.clientes?.nome ?? "-"}</p>
        <Badge variant="outline" className={prioridadeColor[item.prioridade]}>
          {item.prioridade}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{item.servico || "-"}</p>
      <p className="text-xs text-muted-foreground">
        Previsão: {formatDate(item.previsao_conclusao)}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex justify-end gap-1">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(item);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item);
              }}
            >
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
