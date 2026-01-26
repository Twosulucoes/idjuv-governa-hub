import { useState, useRef, useCallback } from "react";
import { AdminLayout } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, Upload, RotateCcw, Eye, EyeOff, Save, MousePointer2, FileText } from "lucide-react";
import {
  CampoSegad,
  carregarConfiguracao,
  salvarConfiguracao,
  resetarConfiguracao,
  exportarConfiguracao,
  importarConfiguracao,
  atualizarCampo,
} from "@/config/segadFieldsConfig";

// Importar imagens das páginas
import fichaPage1 from "@/assets/ficha-cadastro-page1.jpg";
import fichaPage2 from "@/assets/ficha-cadastro-page2.jpg";
import fichaPage3 from "@/assets/ficha-cadastro-page3.jpg";
import fichaPage4 from "@/assets/ficha-cadastro-page4.jpg";
import fichaPage5 from "@/assets/ficha-cadastro-page5.jpg";
import fichaPage6 from "@/assets/ficha-cadastro-page6.jpg";
import fichaPage7 from "@/assets/ficha-cadastro-page7.jpg";

const PAGINAS = [
  { num: 1, titulo: "Identificação, Documentação, Escolaridade", imagem: fichaPage1 },
  { num: 2, titulo: "Endereço, Dados Bancários", imagem: fichaPage2 },
  { num: 3, titulo: "Declaração de Parentesco", imagem: fichaPage3 },
  { num: 4, titulo: "Declaração de Acumulação", imagem: fichaPage4 },
  { num: 5, titulo: "Declaração de Bens", imagem: fichaPage5 },
  { num: 6, titulo: "Declaração Bens Cônjuge", imagem: fichaPage6 },
  { num: 7, titulo: "Declaração Dependentes", imagem: fichaPage7 },
];

// Dimensões A4 em mm
const A4_WIDTH = 210;
const A4_HEIGHT = 297;

export default function CalibradorSegadPage() {
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [campos, setCampos] = useState<CampoSegad[]>(carregarConfiguracao());
  const [campoSelecionado, setCampoSelecionado] = useState<string | null>(null);
  const [modoClique, setModoClique] = useState(false);
  const [mostrarMarcadores, setMostrarMarcadores] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const camposPagina = campos.filter(c => c.pagina === paginaAtual);
  const paginaInfo = PAGINAS.find(p => p.num === paginaAtual);

  const handleImageClick = useCallback((e: React.MouseEvent<HTMLImageElement>) => {
    if (!modoClique || !campoSelecionado || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = A4_WIDTH / rect.width;
    const scaleY = A4_HEIGHT / rect.height;

    const x = Math.round((e.clientX - rect.left) * scaleX * 10) / 10;
    const y = Math.round((e.clientY - rect.top) * scaleY * 10) / 10;

    const novosCampos = atualizarCampo(campoSelecionado, { x, y });
    setCampos(novosCampos);
    toast.success(`Campo posicionado em X: ${x}mm, Y: ${y}mm`);
  }, [modoClique, campoSelecionado]);

  const handleSalvar = () => {
    salvarConfiguracao(campos);
    toast.success("Configuração salva com sucesso!");
  };

  const handleExportar = () => {
    const json = exportarConfiguracao();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "segad-config.json";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Configuração exportada!");
  };

  const handleImportar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const importedCampos = importarConfiguracao(json);
      if (importedCampos) {
        setCampos(importedCampos);
        toast.success("Configuração importada com sucesso!");
      } else {
        toast.error("Erro ao importar configuração");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleResetar = () => {
    const camposOriginais = resetarConfiguracao();
    setCampos(camposOriginais);
    toast.success("Configuração resetada para o padrão");
  };

  const handleCampoChange = (id: string, field: keyof CampoSegad, value: number | string) => {
    const novosCampos = atualizarCampo(id, { [field]: value });
    setCampos(novosCampos);
  };

  const getCampoSelecionadoInfo = () => {
    if (!campoSelecionado) return null;
    return campos.find(c => c.id === campoSelecionado);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Calibrador SEGAD
            </h1>
            <p className="text-muted-foreground text-sm">
              Ajuste as coordenadas dos campos da Ficha Cadastral SEGAD
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportar}
            />
            <Button variant="outline" size="sm" onClick={handleExportar}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={handleResetar}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Resetar
            </Button>
            <Button size="sm" onClick={handleSalvar}>
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Preview do Formulário */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Preview - Página {paginaAtual}</CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={paginaAtual.toString()} onValueChange={(v) => setPaginaAtual(parseInt(v))}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGINAS.map((p) => (
                        <SelectItem key={p.num} value={p.num.toString()}>
                          Página {p.num} - {p.titulo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant={mostrarMarcadores ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMostrarMarcadores(!mostrarMarcadores)}
                  >
                    {mostrarMarcadores ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                    {mostrarMarcadores ? "Marcadores ON" : "Marcadores OFF"}
                  </Button>
                  <Button
                    variant={modoClique ? "default" : "outline"}
                    size="sm"
                    onClick={() => setModoClique(!modoClique)}
                  >
                    <MousePointer2 className="h-4 w-4 mr-2" />
                    {modoClique ? "Modo Clique ON" : "Modo Clique OFF"}
                  </Button>
                </div>
              </div>
              {modoClique && campoSelecionado && (
                <div className="text-sm text-primary mt-2">
                  Clique na imagem para posicionar o campo: <strong>{getCampoSelecionadoInfo()?.label}</strong>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="relative border rounded-lg overflow-hidden bg-muted">
                <img
                  ref={imageRef}
                  src={paginaInfo?.imagem}
                  alt={`Página ${paginaAtual}`}
                  className={`w-full h-auto ${modoClique && campoSelecionado ? "cursor-crosshair" : ""}`}
                  onClick={handleImageClick}
                  draggable={false}
                />
                {/* Marcadores dos campos - só mostra se ativado ou campo selecionado */}
                {(mostrarMarcadores || campoSelecionado) && camposPagina.map((campo) => {
                  const imageWidth = imageRef.current?.clientWidth || 600;
                  const imageHeight = imageRef.current?.clientHeight || 850;
                  const scaleX = imageWidth / A4_WIDTH;
                  const scaleY = imageHeight / A4_HEIGHT;

                  // Se não está mostrando marcadores, só mostra o selecionado
                  if (!mostrarMarcadores && campoSelecionado !== campo.id) return null;

                  return (
                    <div
                      key={campo.id}
                      className={`absolute transition-all cursor-pointer ${
                        campoSelecionado === campo.id
                          ? "w-3 h-3 bg-primary border-2 border-primary-foreground rounded-full z-10 shadow-lg"
                          : "w-2 h-2 bg-red-500/80 border border-white rounded-full opacity-60 hover:opacity-100"
                      }`}
                      style={{
                        left: campo.x * scaleX - (campoSelecionado === campo.id ? 6 : 4),
                        top: campo.y * scaleY - (campoSelecionado === campo.id ? 6 : 4),
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCampoSelecionado(campo.id);
                      }}
                      title={campo.label}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Lista de Campos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center justify-between">
                Campos da Página {paginaAtual}
                <Badge variant="secondary">{camposPagina.length} campos</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-3">
                  {camposPagina.map((campo) => (
                    <div
                      key={campo.id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        campoSelecionado === campo.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setCampoSelecionado(campo.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{campo.label}</span>
                        <Badge variant={campo.tipo === "checkbox" ? "outline" : "secondary"} className="text-xs">
                          {campo.tipo}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">X (mm)</Label>
                          <Input
                            type="number"
                            value={campo.x}
                            onChange={(e) => handleCampoChange(campo.id, "x", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                            step="0.5"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Y (mm)</Label>
                          <Input
                            type="number"
                            value={campo.y}
                            onChange={(e) => handleCampoChange(campo.id, "y", parseFloat(e.target.value) || 0)}
                            className="h-7 text-xs"
                            step="0.5"
                          />
                        </div>
                        {campo.tipo === "texto" && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Largura</Label>
                            <Input
                              type="number"
                              value={campo.maxWidth || 50}
                              onChange={(e) => handleCampoChange(campo.id, "maxWidth", parseInt(e.target.value) || 50)}
                              className="h-7 text-xs"
                            />
                          </div>
                        )}
                      </div>
                      {campo.campo && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Campo: <code className="bg-muted px-1 rounded">{campo.campo}</code>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Instruções */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <Badge variant="outline">1</Badge>
                <span>Selecione um campo na lista à direita</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">2</Badge>
                <span>Ative o "Modo Clique" e clique na imagem para posicionar</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">3</Badge>
                <span>Ou ajuste X/Y manualmente nos campos numéricos</span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline">4</Badge>
                <span>Clique em "Salvar" para persistir as alterações</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
