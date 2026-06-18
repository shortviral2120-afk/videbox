"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import type { FaseServico, Servico } from "@/lib/types";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MonthCalendar } from "@/components/month-calendar";
import { formatDate, cn } from "@/lib/utils";
import { fasesServico, prioridadeColor } from "@/lib/status-styles";
import { toast } from "sonner";

export function CronogramaClient() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("servicos")
      .select("*, clientes(nome)")
      .order("created_at", { ascending: false });
    if (data) setServicos(data as unknown as Servico[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const servicoId = String(active.id);
    const newFase = over.id as FaseServico;
    const current = servicos.find((s) => s.id === servicoId);
    if (!current || current.fase === newFase) return;

    const previousFase = current.fase;
    setServicos((prev) =>
      prev.map((s) => (s.id === servicoId ? { ...s, fase: newFase } : s))
    );

    const supabase = createClient();
    const { error } = await supabase
      .from("servicos")
      .update({ fase: newFase, updated_at: new Date().toISOString() })
      .eq("id", servicoId);

    if (error) {
      setServicos((prev) =>
        prev.map((s) => (s.id === servicoId ? { ...s, fase: previousFase } : s))
      );
      toast.error("Erro ao mover serviço.");
      return;
    }

    await supabase.from("servico_fase_historico").insert({ servico_id: servicoId, fase: newFase });

    toast.success("Serviço movido.");
  }

  const activeServico = activeId ? servicos.find((s) => s.id === activeId) ?? null : null;

  const events = servicos
    .filter((s) => s.data_instalacao)
    .map((s) => ({ date: s.data_instalacao as string, id: s.id }));

  const servicosNoDia = selectedDate
    ? servicos.filter((s) => s.data_instalacao === selectedDate)
    : [];

  return (
    <>
      <PageHeader title="Cronograma" description="Acompanhe o andamento dos serviços" />

      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6">
        <div>
          {loading ? (
            <div className="flex gap-4 overflow-x-auto kanban-scroll">
              {fasesServico.map((fase) => (
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
                {fasesServico.map((fase) => (
                  <KanbanColumn
                    key={fase}
                    fase={fase}
                    servicos={servicos.filter((s) => s.fase === fase)}
                  />
                ))}
              </div>
              <DragOverlay>
                {activeServico ? <ServicoCardContent servico={activeServico} /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        <div className="space-y-4">
          <MonthCalendar events={events} onDayClick={setSelectedDate} selectedDate={selectedDate} />

          <div className="rounded-lg border bg-card p-3 space-y-2">
            {!selectedDate ? (
              <p className="text-sm text-muted-foreground">
                Selecione um dia no calendário para ver os serviços agendados.
              </p>
            ) : servicosNoDia.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum serviço agendado para este dia.
              </p>
            ) : (
              servicosNoDia.map((s) => <ServicoDiaRow key={s.id} servico={s} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ServicoDiaRow({ servico }: { servico: Servico }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.push(`/servicos/${servico.id}`)}
      className="flex w-full items-center justify-between gap-2 rounded-md border bg-background p-2 text-left hover:bg-accent transition-colors"
    >
      <div>
        <p className="text-sm font-semibold">{servico.clientes?.nome ?? "-"}</p>
        <p className="text-xs text-muted-foreground">{servico.titulo}</p>
      </div>
      <Badge variant="secondary">{servico.fase}</Badge>
    </button>
  );
}

function KanbanColumn({
  fase,
  servicos,
}: {
  fase: FaseServico;
  servicos: Servico[];
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
        <Badge variant="secondary">{servicos.length}</Badge>
      </div>
      <div className="flex-1 space-y-2 p-2 overflow-y-auto max-h-[70vh]">
        {servicos.length === 0 ? (
          <p className="p-4 text-center text-xs text-muted-foreground">Nenhum serviço</p>
        ) : (
          servicos.map((servico) => <ServicoCard key={servico.id} servico={servico} />)
        )}
      </div>
    </div>
  );
}

function ServicoCard({ servico }: { servico: Servico }) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: servico.id });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/servicos/${servico.id}`)}
      className={cn(
        "rounded-md border bg-background p-3 cursor-pointer transition-opacity",
        isDragging && "opacity-30"
      )}
    >
      <ServicoCardContent servico={servico} />
    </div>
  );
}

function ServicoCardContent({ servico }: { servico: Servico }) {
  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm">{servico.clientes?.nome ?? "-"}</p>
        <Badge variant="outline" className={prioridadeColor[servico.prioridade]}>
          {servico.prioridade}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{servico.titulo || "-"}</p>
      {servico.data_instalacao && (
        <p className="text-xs text-muted-foreground">
          Instalação: {formatDate(servico.data_instalacao)}
        </p>
      )}
    </div>
  );
}
