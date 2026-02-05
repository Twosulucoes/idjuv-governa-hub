
# Plano: Extrair e Reutilizar Componente de Vinculo Funcional

## Contexto do Problema

O formulario de cadastro manual de servidor (`ServidorFormPage.tsx`) nao possui os campos de vinculo funcional que existem no dialogo de conversao de pre-cadastro (`ConversaoServidorDialog.tsx`):

| Campo | Conversao Pre-Cadastro | Cadastro Manual |
|-------|------------------------|-----------------|
| Tipo de Servidor | Presente | Ausente |
| Cargo | Presente (quando aplicavel) | Ausente |
| Unidade de Lotacao | Presente | Ausente |
| Data de Admissao | Presente | Ausente |

## Solucao Proposta

Extrair a logica de selecao de vinculo funcional do `ConversaoServidorDialog` para um componente reutilizavel e inseri-lo como uma nova aba no `ServidorFormPage`.

## Implementacao

### 1. Criar componente reutilizavel `VinculoFuncionalForm`

Novo componente em `src/components/rh/VinculoFuncionalForm.tsx` contendo:

- Selector de **Tipo de Servidor** (efetivo, comissionado, cedido entrada/saida)
- Selector de **Cargo** (filtrado por natureza conforme tipo)
- Selector de **Unidade de Lotacao** (com contagem de vagas da composicao)
- Input de **Data de Admissao**
- Alerta de vagas disponiveis
- Regras de negocio do `REGRAS_TIPO_SERVIDOR`

A interface do componente sera:
```typescript
interface VinculoFuncionalFormProps {
  tipoServidor: TipoServidor | '';
  cargoId: string;
  unidadeId: string;
  dataAdmissao: string;
  onTipoServidorChange: (tipo: TipoServidor | '') => void;
  onCargoChange: (cargoId: string) => void;
  onUnidadeChange: (unidadeId: string) => void;
  onDataAdmissaoChange: (data: string) => void;
  disabled?: boolean;
}
```

### 2. Atualizar `ConversaoServidorDialog`

- Substituir a implementacao inline pelo novo componente `VinculoFuncionalForm`
- Manter a logica de conversao e validacao

### 3. Atualizar `ServidorFormPage`

- Adicionar nova aba **"Vinculo"** na lista de tabs
- Adicionar campos ao FormData:
  - `tipo_servidor: TipoServidor | ''`
  - `cargo_atual_id: string`
  - `unidade_atual_id: string`
  - `data_admissao: string`
- Renderizar o componente `VinculoFuncionalForm` na nova aba
- Atualizar mutation para:
  - Salvar `tipo_servidor`, `cargo_atual_id`, `unidade_atual_id`, `data_admissao` no servidor
  - Criar **lotacao inicial** na tabela `lotacoes`
  - Criar **provimento** na tabela `provimentos` (quando aplicavel)

### 4. Carregar dados ao editar servidor existente

- Buscar `tipo_servidor`, `cargo_atual_id`, `unidade_atual_id`, `data_admissao` do servidor
- Preencher os campos do formulario

## Beneficios

1. **Reutilizacao**: Mesmo componente para conversao e cadastro manual
2. **Consistencia**: Mesmas regras de negocio aplicadas em ambos os fluxos
3. **Manutencao**: Alteracoes em um unico lugar
4. **Completude**: Servidores cadastrados manualmente terao vinculo completo

---

## Secao Tecnica

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/components/rh/VinculoFuncionalForm.tsx` | Componente reutilizavel de vinculo funcional |

### Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/rh/ServidorFormPage.tsx` | Adicionar aba Vinculo, campos e logica de criacao |
| `src/components/curriculo/ConversaoServidorDialog.tsx` | Substituir implementacao inline pelo novo componente |

### Estrutura do Componente VinculoFuncionalForm

O componente encapsulara:
- Queries para buscar cargos, composicao de cargo, lotacoes ativas e unidades
- Logica de filtragem por tipo de servidor
- Calculo de vagas disponiveis
- Renderizacao dos campos com estados controlados

### Fluxo de Criacao de Lotacao e Provimento

Ao criar novo servidor com vinculo:

```typescript
// 1. Inserir servidor
const { data: novoServidor } = await supabase
  .from("servidores")
  .insert({ ...payload, tipo_servidor, cargo_atual_id, unidade_atual_id, data_admissao })
  .select("id")
  .single();

// 2. Criar lotacao
await supabase.from('lotacoes').insert({
  servidor_id: novoServidor.id,
  unidade_id: unidade_atual_id,
  cargo_id: cargo_atual_id || null,
  tipo_lotacao: 'lotacao_interna',
  data_inicio: data_admissao,
  ativo: true,
});

// 3. Criar provimento (se tiver cargo)
if (cargo_atual_id) {
  await supabase.from('provimentos').insert({
    servidor_id: novoServidor.id,
    cargo_id: cargo_atual_id,
    unidade_id: unidade_atual_id,
    status: 'ativo',
    data_nomeacao: data_admissao,
    data_posse: data_admissao,
    data_exercicio: data_admissao,
  });
}
```

### Validacoes

- `tipo_servidor` obrigatorio para novo servidor
- `unidade_atual_id` obrigatorio para novo servidor
- `cargo_atual_id` obrigatorio apenas se o tipo de servidor permitir cargo
- `data_admissao` obrigatoria para novo servidor
- Verificar disponibilidade de vagas antes de permitir selecao

### Importacoes Necessarias no ServidorFormPage

```typescript
import { VinculoFuncionalForm } from "@/components/rh/VinculoFuncionalForm";
import { Briefcase } from "lucide-react"; // icone para a aba
import type { TipoServidor } from "@/types/servidor";
```

### Layout da Nova Aba

```text
+--------------------------------------------------+
| [Pessoal] [Documentos] [Endereco] [Formacao]     |
| [Bancario] [Vinculo]                              |
+--------------------------------------------------+
|                                                  |
| Vinculo Funcional                                |
| ------------------------------------------------ |
| Tipo de Servidor:  [  Selecione...            v] |
| Descricao: "Servidor efetivo do quadro..."       |
| ------------------------------------------------ |
| Cargo:             [  Selecione cargo         v] |
| (apenas se tipo permitir cargo)                  |
| ------------------------------------------------ |
| Unidade de Lotacao:[  Selecione unidade       v] |
| (mostra vagas disponiveis quando ha cargo)       |
| ------------------------------------------------ |
| Data de Admissao:  [  ____/____/________      ]  |
| ------------------------------------------------ |
| [!] Alerta de vagas disponiveis (se aplicavel)   |
|                                                  |
+--------------------------------------------------+
```
