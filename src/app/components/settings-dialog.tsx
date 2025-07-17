
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type SettingsDialogProps = {
  roles: string[];
  onRolesChange: (roles: string[]) => void;
};

export function SettingsDialog({ roles, onRolesChange }: SettingsDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [internalRoles, setInternalRoles] = React.useState(roles);
  const { toast } = useToast();

  React.useEffect(() => {
    setInternalRoles(roles);
  }, [roles, isOpen]);

  const handleRoleChange = (index: number, value: string) => {
    const newRoles = [...internalRoles];
    newRoles[index] = value;
    setInternalRoles(newRoles);
  };

  const handleAddRole = () => {
    setInternalRoles([...internalRoles, `Nova Função ${internalRoles.length + 1}`]);
  };

  const handleRemoveRole = (index: number) => {
    const newRoles = internalRoles.filter((_, i) => i !== index);
    setInternalRoles(newRoles);
  };

  const handleSaveChanges = () => {
    onRolesChange(internalRoles);
    toast({ title: "Configurações Salvas", description: "As funções da equipe foram atualizadas." });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configurações</DialogTitle>
          <DialogDescription>
            Gerencie as configurações da sua aplicação aqui.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <Label className="text-base font-semibold">Funções da Equipe</Label>
            <p className="text-sm text-muted-foreground mb-2">Adicione, edite ou remova as funções disponíveis.</p>
            <div className="space-y-2">
              {internalRoles.map((role, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={role}
                    onChange={(e) => handleRoleChange(index, e.target.value)}
                    placeholder="Nome da Função"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveRole(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
             <Button variant="outline" size="sm" className="mt-2" onClick={handleAddRole}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Função
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={handleSaveChanges}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
