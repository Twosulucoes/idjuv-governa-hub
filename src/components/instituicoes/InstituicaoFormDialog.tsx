 import { useState, useEffect } from 'react';
 import {
   Dialog,
   DialogContent,
   DialogDescription,
   DialogHeader,
   DialogTitle,
 } from '@/components/ui/dialog';
 import { Button } from '@/components/ui/button';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Textarea } from '@/components/ui/textarea';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Loader2, Building2, Users, Landmark } from 'lucide-react';
 import { useInstituicoes } from '@/hooks/useInstituicoes';
 import type { 
   TipoInstituicao, 
   EsferaGoverno, 
   InstituicaoFormData,
   Instituicao 
 } from '@/types/instituicoes';
 import {
   TIPO_INSTITUICAO_LABELS,
   TIPO_INSTITUICAO_DESCRICOES,
   ESFERA_GOVERNO_LABELS,
   AREAS_ATUACAO_OPTIONS,
 } from '@/types/instituicoes';
 
 interface InstituicaoFormDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   instituicao?: Instituicao | null;
   onSuccess?: () => void;
 }
 
 const INITIAL_FORM: InstituicaoFormData = {
   tipo_instituicao: 'formal',
   nome_razao_social: '',
   nome_fantasia: '',
   cnpj: '',
   inscricao_estadual: '',
   esfera_governo: undefined,
   orgao_vinculado: '',
   endereco_logradouro: '',
   endereco_numero: '',
   endereco_complemento: '',
   endereco_bairro: '',
   endereco_cidade: '',
   endereco_uf: 'RR',
   endereco_cep: '',
   telefone: '',
   email: '',
   site: '',
   responsavel_nome: '',
   responsavel_cpf: '',
   responsavel_cargo: '',
   responsavel_telefone: '',
   responsavel_email: '',
   ato_constituicao: '',
   data_fundacao: '',
   area_atuacao: [],
   observacoes: '',
 };
 
 export function InstituicaoFormDialog({
   open,
   onOpenChange,
   instituicao,
   onSuccess,
 }: InstituicaoFormDialogProps) {
   const [formData, setFormData] = useState<InstituicaoFormData>(INITIAL_FORM);
   const [activeTab, setActiveTab] = useState('dados');
   const { createInstituicao, updateInstituicao, isCreating, isUpdating } = useInstituicoes();
 
   const isEditing = !!instituicao;
   const isSaving = isCreating || isUpdating;
 
   useEffect(() => {
     if (instituicao) {
       setFormData({
         tipo_instituicao: instituicao.tipo_instituicao,
         nome_razao_social: instituicao.nome_razao_social,
         nome_fantasia: instituicao.nome_fantasia || '',
         cnpj: instituicao.cnpj || '',
         inscricao_estadual: instituicao.inscricao_estadual || '',
         esfera_governo: instituicao.esfera_governo,
         orgao_vinculado: instituicao.orgao_vinculado || '',
         endereco_logradouro: instituicao.endereco_logradouro || '',
         endereco_numero: instituicao.endereco_numero || '',
         endereco_complemento: instituicao.endereco_complemento || '',
         endereco_bairro: instituicao.endereco_bairro || '',
         endereco_cidade: instituicao.endereco_cidade || '',
         endereco_uf: instituicao.endereco_uf || 'RR',
         endereco_cep: instituicao.endereco_cep || '',
         telefone: instituicao.telefone || '',
         email: instituicao.email || '',
         site: instituicao.site || '',
         responsavel_nome: instituicao.responsavel_nome,
         responsavel_cpf: instituicao.responsavel_cpf || '',
         responsavel_cargo: instituicao.responsavel_cargo || '',
         responsavel_telefone: instituicao.responsavel_telefone || '',
         responsavel_email: instituicao.responsavel_email || '',
         ato_constituicao: instituicao.ato_constituicao || '',
         data_fundacao: instituicao.data_fundacao || '',
         area_atuacao: instituicao.area_atuacao || [],
         observacoes: instituicao.observacoes || '',
       });
     } else {
       setFormData(INITIAL_FORM);
     }
     setActiveTab('dados');
   }, [instituicao, open]);
 
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
 
     try {
       if (isEditing && instituicao) {
         await updateInstituicao({ id: instituicao.id, data: formData });
       } else {
          // Remove campos de data vazios para evitar erro de sintaxe no banco
          const dataToSave = {
            ...formData,
            data_fundacao: formData.data_fundacao || null,
          };
          await createInstituicao(dataToSave);
       }
       onOpenChange(false);
       onSuccess?.();
     } catch (error) {
       // Erro tratado pelo hook
     }
   };
 
   const updateField = (field: keyof InstituicaoFormData, value: any) => {
     setFormData((prev) => ({ ...prev, [field]: value }));
   };
 
   const renderTipoButtons = () => (
     <div className="grid grid-cols-3 gap-3">
       {(['formal', 'informal', 'orgao_publico'] as TipoInstituicao[]).map((tipo) => {
         const icons = { formal: Building2, informal: Users, orgao_publico: Landmark };
         const Icon = icons[tipo];
         const isSelected = formData.tipo_instituicao === tipo;
         return (
           <button
             key={tipo}
             type="button"
             onClick={() => updateField('tipo_instituicao', tipo)}
             className={`p-4 rounded-lg border-2 transition-all text-left ${
               isSelected
                 ? 'border-primary bg-primary/10'
                 : 'border-border hover:border-primary/50'
             }`}
           >
             <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
             <p className="font-medium text-sm">{TIPO_INSTITUICAO_LABELS[tipo]}</p>
             <p className="text-xs text-muted-foreground mt-1">
               {TIPO_INSTITUICAO_DESCRICOES[tipo]}
             </p>
           </button>
         );
       })}
     </div>
   );
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>
             {isEditing ? 'Editar Instituição' : 'Nova Instituição'}
           </DialogTitle>
           <DialogDescription>
             {isEditing
               ? 'Atualize os dados da instituição cadastrada.'
               : 'Cadastre uma nova instituição para solicitar uso de espaços.'}
           </DialogDescription>
         </DialogHeader>
 
         <form onSubmit={handleSubmit} className="space-y-6">
           {/* Seleção de Tipo */}
           {!isEditing && (
             <div className="space-y-2">
               <Label>Tipo de Instituição *</Label>
               {renderTipoButtons()}
             </div>
           )}
 
           <Tabs value={activeTab} onValueChange={setActiveTab}>
             <TabsList className="grid w-full grid-cols-3">
               <TabsTrigger value="dados">Dados Principais</TabsTrigger>
               <TabsTrigger value="endereco">Endereço</TabsTrigger>
               <TabsTrigger value="responsavel">Responsável</TabsTrigger>
             </TabsList>
 
             <TabsContent value="dados" className="space-y-4 mt-4">
               {/* Nome/Razão Social */}
               <div className="space-y-2">
                 <Label>
                   {formData.tipo_instituicao === 'informal' ? 'Nome do Grupo' : 'Razão Social'} *
                 </Label>
                 <Input
                   value={formData.nome_razao_social}
                   onChange={(e) => updateField('nome_razao_social', e.target.value)}
                   placeholder={formData.tipo_instituicao === 'informal' ? 'Ex: Time de Futebol Unidos' : 'Razão social completa'}
                   required
                 />
               </div>
 
               {/* Nome Fantasia (apenas formal e orgao) */}
               {formData.tipo_instituicao !== 'informal' && (
                 <div className="space-y-2">
                   <Label>Nome Fantasia</Label>
                   <Input
                     value={formData.nome_fantasia}
                     onChange={(e) => updateField('nome_fantasia', e.target.value)}
                     placeholder="Nome fantasia ou sigla"
                   />
                 </div>
               )}
 
               {/* CNPJ (obrigatório para formal) */}
               {formData.tipo_instituicao === 'formal' && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <Label>CNPJ *</Label>
                     <Input
                       value={formData.cnpj}
                       onChange={(e) => updateField('cnpj', e.target.value)}
                       placeholder="00.000.000/0000-00"
                       required={formData.tipo_instituicao === 'formal'}
                     />
                   </div>
                   <div className="space-y-2">
                     <Label>Inscrição Estadual</Label>
                     <Input
                       value={formData.inscricao_estadual}
                       onChange={(e) => updateField('inscricao_estadual', e.target.value)}
                       placeholder="Opcional"
                     />
                   </div>
                 </div>
               )}
 
               {/* Órgão Público: Esfera e Vinculação */}
               {formData.tipo_instituicao === 'orgao_publico' && (
                 <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-2">
                     <Label>Esfera de Governo *</Label>
                     <Select
                       value={formData.esfera_governo}
                       onValueChange={(v) => updateField('esfera_governo', v as EsferaGoverno)}
                     >
                       <SelectTrigger>
                         <SelectValue placeholder="Selecione" />
                       </SelectTrigger>
                       <SelectContent>
                         {Object.entries(ESFERA_GOVERNO_LABELS).map(([key, label]) => (
                           <SelectItem key={key} value={key}>
                             {label}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Órgão Vinculado</Label>
                     <Input
                       value={formData.orgao_vinculado}
                       onChange={(e) => updateField('orgao_vinculado', e.target.value)}
                       placeholder="Ex: Secretaria de Esportes"
                     />
                   </div>
                 </div>
               )}
 
               {/* Contatos */}
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Telefone</Label>
                   <Input
                     value={formData.telefone}
                     onChange={(e) => updateField('telefone', e.target.value)}
                     placeholder="(00) 00000-0000"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>E-mail</Label>
                   <Input
                     type="email"
                     value={formData.email}
                     onChange={(e) => updateField('email', e.target.value)}
                     placeholder="contato@instituicao.org"
                   />
                 </div>
               </div>
 
               {/* Ato Constitutivo e Data Fundação */}
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>
                     {formData.tipo_instituicao === 'orgao_publico'
                       ? 'Lei de Criação'
                       : formData.tipo_instituicao === 'formal'
                       ? 'Estatuto Social'
                       : 'Documento Constituinte'}
                   </Label>
                   <Input
                     value={formData.ato_constituicao}
                     onChange={(e) => updateField('ato_constituicao', e.target.value)}
                     placeholder="Número do documento"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Data de Fundação</Label>
                   <Input
                     type="date"
                     value={formData.data_fundacao}
                     onChange={(e) => updateField('data_fundacao', e.target.value)}
                   />
                 </div>
               </div>
             </TabsContent>
 
             <TabsContent value="endereco" className="space-y-4 mt-4">
               <div className="grid gap-4 md:grid-cols-3">
                 <div className="md:col-span-2 space-y-2">
                   <Label>Logradouro</Label>
                   <Input
                     value={formData.endereco_logradouro}
                     onChange={(e) => updateField('endereco_logradouro', e.target.value)}
                     placeholder="Rua, Avenida, etc."
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Número</Label>
                   <Input
                     value={formData.endereco_numero}
                     onChange={(e) => updateField('endereco_numero', e.target.value)}
                     placeholder="Nº"
                   />
                 </div>
               </div>
 
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Complemento</Label>
                   <Input
                     value={formData.endereco_complemento}
                     onChange={(e) => updateField('endereco_complemento', e.target.value)}
                     placeholder="Sala, Bloco, etc."
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Bairro</Label>
                   <Input
                     value={formData.endereco_bairro}
                     onChange={(e) => updateField('endereco_bairro', e.target.value)}
                     placeholder="Bairro"
                   />
                 </div>
               </div>
 
               <div className="grid gap-4 md:grid-cols-3">
                 <div className="space-y-2">
                   <Label>Cidade</Label>
                   <Input
                     value={formData.endereco_cidade}
                     onChange={(e) => updateField('endereco_cidade', e.target.value)}
                     placeholder="Cidade"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>UF</Label>
                   <Input
                     value={formData.endereco_uf}
                     onChange={(e) => updateField('endereco_uf', e.target.value)}
                     placeholder="RR"
                     maxLength={2}
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>CEP</Label>
                   <Input
                     value={formData.endereco_cep}
                     onChange={(e) => updateField('endereco_cep', e.target.value)}
                     placeholder="00000-000"
                   />
                 </div>
               </div>
             </TabsContent>
 
             <TabsContent value="responsavel" className="space-y-4 mt-4">
               <div className="space-y-2">
                 <Label>Nome do Responsável *</Label>
                 <Input
                   value={formData.responsavel_nome}
                   onChange={(e) => updateField('responsavel_nome', e.target.value)}
                   placeholder="Nome completo"
                   required
                 />
               </div>
 
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>CPF do Responsável</Label>
                   <Input
                     value={formData.responsavel_cpf}
                     onChange={(e) => updateField('responsavel_cpf', e.target.value)}
                     placeholder="000.000.000-00"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>Cargo/Função</Label>
                   <Input
                     value={formData.responsavel_cargo}
                     onChange={(e) => updateField('responsavel_cargo', e.target.value)}
                     placeholder="Presidente, Coordenador, etc."
                   />
                 </div>
               </div>
 
               <div className="grid gap-4 md:grid-cols-2">
                 <div className="space-y-2">
                   <Label>Telefone do Responsável</Label>
                   <Input
                     value={formData.responsavel_telefone}
                     onChange={(e) => updateField('responsavel_telefone', e.target.value)}
                     placeholder="(00) 00000-0000"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>E-mail do Responsável</Label>
                   <Input
                     type="email"
                     value={formData.responsavel_email}
                     onChange={(e) => updateField('responsavel_email', e.target.value)}
                     placeholder="email@exemplo.com"
                   />
                 </div>
               </div>
 
               <div className="space-y-2">
                 <Label>Observações</Label>
                 <Textarea
                   value={formData.observacoes}
                   onChange={(e) => updateField('observacoes', e.target.value)}
                   placeholder="Informações adicionais sobre a instituição..."
                   rows={3}
                 />
               </div>
             </TabsContent>
           </Tabs>
 
           <div className="flex justify-end gap-2 pt-4 border-t">
             <Button
               type="button"
               variant="outline"
               onClick={() => onOpenChange(false)}
               disabled={isSaving}
             >
               Cancelar
             </Button>
             <Button type="submit" disabled={isSaving}>
               {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               {isEditing ? 'Salvar Alterações' : 'Cadastrar Instituição'}
             </Button>
           </div>
         </form>
       </DialogContent>
     </Dialog>
   );
 }