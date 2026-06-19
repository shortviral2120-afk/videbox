"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { PERFIL_PADRAO, loadPerfil, savePerfil, type PerfilEmpresa } from "@/lib/perfil";

export function PerfilClient() {
  const [perfil, setPerfil] = useState<PerfilEmpresa>(PERFIL_PADRAO);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPerfil(loadPerfil());
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setPerfil((p) => ({ ...p, logoBase64: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    savePerfil(perfil);
    toast.success("Perfil salvo!");
  }

  return (
    <>
      <PageHeader title="Perfil" description="Dados da empresa e configurações do app" />

      <div className="space-y-6 max-w-2xl">
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold">Dados da Empresa</h2>

          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={perfil.logoBase64 || undefined} alt="Logo" />
              <AvatarFallback>{perfil.nomeEmpresa.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Enviar logo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nomeEmpresa">Nome da empresa</Label>
              <Input
                id="nomeEmpresa"
                value={perfil.nomeEmpresa}
                onChange={(e) => setPerfil((p) => ({ ...p, nomeEmpresa: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomeResponsavel">Nome do responsável</Label>
              <Input
                id="nomeResponsavel"
                value={perfil.nomeResponsavel}
                onChange={(e) => setPerfil((p) => ({ ...p, nomeResponsavel: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={perfil.telefone}
                onChange={(e) => setPerfil((p) => ({ ...p, telefone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cnpjCpf">CNPJ/CPF</Label>
              <Input
                id="cnpjCpf"
                value={perfil.cnpjCpf}
                onChange={(e) => setPerfil((p) => ({ ...p, cnpjCpf: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endereco">Endereço</Label>
              <Input
                id="endereco"
                value={perfil.endereco}
                onChange={(e) => setPerfil((p) => ({ ...p, endereco: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-4">
          <h2 className="font-semibold">Configurações do App</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="percentualEntrada">Percentual padrão de entrada (%)</Label>
              <Input
                id="percentualEntrada"
                type="number"
                min="0"
                max="100"
                value={perfil.percentualEntrada}
                onChange={(e) =>
                  setPerfil((p) => ({ ...p, percentualEntrada: Number(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moeda">Moeda</Label>
              <Input
                id="moeda"
                value={perfil.moeda}
                onChange={(e) => setPerfil((p) => ({ ...p, moeda: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4 space-y-1">
          <h2 className="font-semibold mb-2">Sobre</h2>
          <p className="text-sm text-muted-foreground">Versão do app: 1.0.0</p>
          <p className="text-sm text-muted-foreground">Desenvolvido por: VidroBox</p>
        </div>

        <Button onClick={handleSave}>Salvar</Button>
      </div>
    </>
  );
}
