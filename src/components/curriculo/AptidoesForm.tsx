import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import type { PreCadastro, Idioma, CursoComplementar } from "@/types/preCadastro";
import { HABILIDADES_SUGERIDAS, NIVEIS_IDIOMA } from "@/types/preCadastro";

interface Props {
  dados: Partial<PreCadastro>;
  onChange: (dados: Partial<PreCadastro>) => void;
}

export function AptidoesForm({ dados, onChange }: Props) {
  const [novaHabilidade, setNovaHabilidade] = useState("");
  const [novoIdioma, setNovoIdioma] = useState({ idioma: "", nivel: "" as Idioma["nivel"] });
  const [novoCurso, setNovoCurso] = useState<Partial<CursoComplementar>>({});

  const habilidades = dados.habilidades || [];
  const idiomas = (dados.idiomas || []) as Idioma[];
  const cursos = (dados.cursos_complementares || []) as CursoComplementar[];

  const adicionarHabilidade = (hab: string) => {
    if (hab && !habilidades.includes(hab)) {
      onChange({ ...dados, habilidades: [...habilidades, hab] });
    }
    setNovaHabilidade("");
  };

  const removerHabilidade = (hab: string) => {
    onChange({ ...dados, habilidades: habilidades.filter((h) => h !== hab) });
  };

  const adicionarIdioma = () => {
    if (novoIdioma.idioma && novoIdioma.nivel) {
      onChange({ ...dados, idiomas: [...idiomas, novoIdioma as Idioma] });
      setNovoIdioma({ idioma: "", nivel: "" as Idioma["nivel"] });
    }
  };

  const removerIdioma = (index: number) => {
    onChange({ ...dados, idiomas: idiomas.filter((_, i) => i !== index) });
  };

  const adicionarCurso = () => {
    if (novoCurso.nome && novoCurso.instituicao) {
      onChange({ ...dados, cursos_complementares: [...cursos, novoCurso as CursoComplementar] });
      setNovoCurso({});
    }
  };

  const removerCurso = (index: number) => {
    onChange({ ...dados, cursos_complementares: cursos.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-primary">Aptidões e Características</h3>
        <p className="text-sm text-muted-foreground">
          Informe suas habilidades, idiomas e cursos complementares.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Habilidades */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Habilidades e Competências</h4>

          <div className="flex flex-wrap gap-2">
            {habilidades.map((hab) => (
              <Badge key={hab} variant="secondary" className="gap-1">
                {hab}
                <button
                  type="button"
                  onClick={() => removerHabilidade(hab)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={novaHabilidade}
              onChange={(e) => setNovaHabilidade(e.target.value)}
              placeholder="Digite uma habilidade..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  adicionarHabilidade(novaHabilidade);
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => adicionarHabilidade(novaHabilidade)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Sugestões:</p>
            <div className="flex flex-wrap gap-1">
              {HABILIDADES_SUGERIDAS.filter((h) => !habilidades.includes(h))
                .slice(0, 10)
                .map((hab) => (
                  <Badge
                    key={hab}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => adicionarHabilidade(hab)}
                  >
                    + {hab}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        {/* Idiomas */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Idiomas</h4>

          {idiomas.length > 0 && (
            <div className="space-y-2">
              {idiomas.map((idioma, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span>
                    {idioma.idioma} - <span className="text-muted-foreground">{idioma.nivel}</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removerIdioma(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={novoIdioma.idioma}
              onChange={(e) => setNovoIdioma({ ...novoIdioma, idioma: e.target.value })}
              placeholder="Idioma"
              className="flex-1"
            />
            <Select
              value={novoIdioma.nivel}
              onValueChange={(value) => setNovoIdioma({ ...novoIdioma, nivel: value as Idioma["nivel"] })}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Nível" />
              </SelectTrigger>
              <SelectContent>
                {NIVEIS_IDIOMA.map((n) => (
                  <SelectItem key={n.value} value={n.value}>
                    {n.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" size="icon" onClick={adicionarIdioma}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Experiência */}
        <div className="grid gap-2">
          <Label htmlFor="experiencia_resumo">Resumo de Experiência Profissional</Label>
          <Textarea
            id="experiencia_resumo"
            value={dados.experiencia_resumo || ""}
            onChange={(e) => onChange({ ...dados, experiencia_resumo: e.target.value })}
            placeholder="Descreva brevemente sua experiência profissional..."
            rows={4}
          />
        </div>

        {/* Cursos Complementares */}
        <div className="p-4 border rounded-lg space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Cursos Complementares</h4>

          {cursos.length > 0 && (
            <div className="space-y-2">
              {cursos.map((curso, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div>
                    <p className="font-medium text-sm">{curso.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {curso.instituicao}
                      {curso.carga_horaria && ` • ${curso.carga_horaria}h`}
                      {curso.ano && ` • ${curso.ano}`}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removerCurso(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Input
              value={novoCurso.nome || ""}
              onChange={(e) => setNovoCurso({ ...novoCurso, nome: e.target.value })}
              placeholder="Nome do curso"
            />
            <Input
              value={novoCurso.instituicao || ""}
              onChange={(e) => setNovoCurso({ ...novoCurso, instituicao: e.target.value })}
              placeholder="Instituição"
            />
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={novoCurso.carga_horaria || ""}
              onChange={(e) =>
                setNovoCurso({ ...novoCurso, carga_horaria: parseInt(e.target.value) || undefined })
              }
              placeholder="Carga horária"
              className="w-[140px]"
            />
            <Input
              type="number"
              value={novoCurso.ano || ""}
              onChange={(e) =>
                setNovoCurso({ ...novoCurso, ano: parseInt(e.target.value) || undefined })
              }
              placeholder="Ano"
              className="w-[100px]"
            />
            <Button type="button" variant="outline" onClick={adicionarCurso}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
