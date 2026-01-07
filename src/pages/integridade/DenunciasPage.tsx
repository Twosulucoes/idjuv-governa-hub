import { useState } from "react";
import { Link } from "react-router-dom";
import { 
  AlertTriangle, ArrowLeft, Send, Shield, Lock, Eye, EyeOff,
  FileText, CheckCircle2, Info
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const tiposDenuncia = [
  { id: "corrupcao", label: "Corrupção ou desvio de recursos" },
  { id: "assedio", label: "Assédio moral ou sexual" },
  { id: "conflito", label: "Conflito de interesses" },
  { id: "favorecimento", label: "Favorecimento indevido" },
  { id: "irregularidade", label: "Irregularidade administrativa" },
  { id: "outro", label: "Outro" },
];

export default function DenunciasPage() {
  const { toast } = useToast();
  const [isAnonimo, setIsAnonimo] = useState(true);
  const [tipoDenuncia, setTipoDenuncia] = useState("");
  const [aceitaLGPD, setAceitaLGPD] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tipoDenuncia) {
      toast({
        title: "Erro",
        description: "Selecione o tipo de denúncia",
        variant: "destructive",
      });
      return;
    }

    if (!aceitaLGPD) {
      toast({
        title: "Erro",
        description: "Você deve aceitar os termos de tratamento de dados",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    
    // Simular envio
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Denúncia registrada",
      description: "Sua denúncia foi registrada com sucesso. Protocolo: DEN-2025-0001",
    });
    
    setEnviando(false);
  };

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-warning text-warning-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/integridade" className="hover:underline">Integridade</Link>
            <span>/</span>
            <span>Canal de Denúncias</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Canal de Denúncias</h1>
              <p className="opacity-90 mt-1">
                Comunicação segura e confidencial de irregularidades
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Garantias */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Shield className="w-10 h-10 text-success mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Sigilo Garantido</h3>
                  <p className="text-sm text-muted-foreground">
                    Proteção total da identidade do denunciante
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <Lock className="w-10 h-10 text-info mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Denúncia Anônima</h3>
                  <p className="text-sm text-muted-foreground">
                    Opção de não identificação disponível
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <FileText className="w-10 h-10 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold mb-1">Conformidade LGPD</h3>
                  <p className="text-sm text-muted-foreground">
                    Tratamento conforme Lei de Proteção de Dados
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator className="my-8" />

            {/* Formulário */}
            <Card>
              <CardHeader>
                <CardTitle>Formulário de Denúncia</CardTitle>
                <CardDescription>
                  Relate a irregularidade com o máximo de detalhes possível
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Identificação */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Identificação</Label>
                    <RadioGroup 
                      value={isAnonimo ? "anonimo" : "identificado"}
                      onValueChange={(v) => setIsAnonimo(v === "anonimo")}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="anonimo" id="anonimo" />
                        <Label htmlFor="anonimo" className="flex items-center gap-2 cursor-pointer">
                          <EyeOff className="w-4 h-4" />
                          Denúncia anônima
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="identificado" id="identificado" />
                        <Label htmlFor="identificado" className="flex items-center gap-2 cursor-pointer">
                          <Eye className="w-4 h-4" />
                          Desejo me identificar
                        </Label>
                      </div>
                    </RadioGroup>

                    {!isAnonimo && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor="nome">Nome completo</Label>
                          <Input id="nome" placeholder="Seu nome" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail</Label>
                          <Input id="email" type="email" placeholder="seu@email.com" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="telefone">Telefone (opcional)</Label>
                          <Input id="telefone" placeholder="(00) 00000-0000" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cargo">Cargo/Vínculo (opcional)</Label>
                          <Input id="cargo" placeholder="Ex: Servidor, Cidadão" />
                        </div>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Tipo de Denúncia */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Tipo de Denúncia *</Label>
                    <RadioGroup value={tipoDenuncia} onValueChange={setTipoDenuncia}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {tiposDenuncia.map((tipo) => (
                          <div key={tipo.id} className="flex items-center space-x-2">
                            <RadioGroupItem value={tipo.id} id={tipo.id} />
                            <Label htmlFor={tipo.id} className="cursor-pointer">{tipo.label}</Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  </div>

                  <Separator />

                  {/* Detalhes */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="envolvidos">Pessoas ou setores envolvidos *</Label>
                      <Input 
                        id="envolvidos" 
                        placeholder="Descreva quem está envolvido na irregularidade"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quando">Quando ocorreu? *</Label>
                      <Input 
                        id="quando" 
                        placeholder="Data aproximada ou período"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onde">Onde ocorreu? *</Label>
                      <Input 
                        id="onde" 
                        placeholder="Local ou setor"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição detalhada da denúncia *</Label>
                      <Textarea 
                        id="descricao" 
                        placeholder="Descreva a irregularidade com o máximo de detalhes possível. Inclua informações sobre como teve conhecimento do fato, se há testemunhas, documentos ou outras evidências."
                        className="min-h-[150px]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="evidencias">Evidências ou documentos (opcional)</Label>
                      <Textarea 
                        id="evidencias" 
                        placeholder="Descreva documentos, e-mails, registros ou outras evidências que possam comprovar a denúncia"
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>

                  <Separator />

                  {/* LGPD */}
                  <div className="bg-info/10 border border-info/30 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), 
                          informamos que os dados pessoais eventualmente fornecidos serão tratados 
                          exclusivamente para fins de apuração da denúncia, sendo garantido o sigilo 
                          e a proteção das informações.
                        </p>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="lgpd" 
                            checked={aceitaLGPD}
                            onCheckedChange={(checked) => setAceitaLGPD(checked === true)}
                          />
                          <Label htmlFor="lgpd" className="text-sm cursor-pointer">
                            Li e aceito os termos de tratamento de dados *
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-4 justify-end">
                    <Button asChild variant="outline">
                      <Link to="/integridade">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancelar
                      </Link>
                    </Button>
                    <Button 
                      type="submit" 
                      className="btn-gov"
                      disabled={enviando}
                    >
                      {enviando ? (
                        "Enviando..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Enviar Denúncia
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
