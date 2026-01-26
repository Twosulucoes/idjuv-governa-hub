
# Plano: Refatorar Ficha Cadastro SEGAD com Mapeamento Perfeito e Calibrador Visual

## Contexto do Problema

O PDF gerado pelo sistema apresenta desalinhamento entre os dados preenchidos e os campos do formulário SEGAD, causando sobreposição e má legibilidade. O documento possui 7 páginas com estrutura complexa e muitos campos distribuídos em posições específicas.

## Estratégia de Solução

Implementaremos duas abordagens complementares:

1. **Calibrador Visual** - Ferramenta administrativa para mapear coordenadas exatas
2. **Mapeamento com Códigos SEGAD** - Adicionar tabelas de códigos oficiais para campos como Estado Civil e Tipo PCD

---

## Etapa 1: Criar Mapeamento de Códigos SEGAD

Adicionar constantes com os códigos numéricos oficiais do SEGAD para os campos que requerem formatação específica:

```text
Estado Civil:
  1-SOLTEIRO(A)
  2-CASADO(A)
  3-DIVORCIADO(A)
  4-VIÚVO(A)
  5-UNIÃO ESTÁVEL
  6-SEPARADO(A)

Tipo PCD:
  99-NÃO DEFICIENTE
  01-FÍSICA
  02-AUDITIVA
  03-VISUAL
  04-INTELECTUAL
  05-MÚLTIPLA
  06-OUTRA

Raça/Cor:
  1-BRANCA
  2-PRETA
  3-PARDA
  4-AMARELA
  5-INDÍGENA
  6-NÃO DECLARADA
```

**Arquivos modificados:**
- `src/types/rh.ts` - Adicionar constantes `SEGAD_ESTADO_CIVIL`, `SEGAD_TIPO_PCD`, `SEGAD_RACA_COR`
- `src/lib/pdfFichaCadastroGeral.ts` - Funções de conversão para códigos SEGAD

---

## Etapa 2: Criar Página de Calibração de Coordenadas

Uma ferramenta administrativa que permite ajustar visualmente as posições dos campos clicando na imagem do formulário.

**Nova página:** `/admin/calibrador-segad`

**Funcionalidades:**
- Exibir cada página do formulário como imagem de fundo
- Clicar para registrar coordenadas (x, y)
- Listar todos os campos com suas posições atuais
- Ajustar valores com input numérico ou clique direto
- Exportar/importar configuração como JSON
- Preview ao vivo do preenchimento

**Arquivos criados:**
- `src/pages/admin/CalibradorSegadPage.tsx` - Página principal do calibrador
- `src/config/segadFieldsConfig.ts` - Configuração centralizada de coordenadas

**Estrutura do arquivo de configuração:**

```text
interface CampoSegad {
  id: string;           // identificador único
  label: string;        // nome exibido
  pagina: number;       // 1-7
  tipo: 'texto' | 'checkbox' | 'data';
  x: number;            // coordenada X em mm
  y: number;            // coordenada Y em mm
  maxWidth?: number;    // largura máxima para truncar
  campo?: string;       // nome do campo no servidor
}

const CAMPOS_PAGINA_1: CampoSegad[] = [
  { id: 'nome', label: 'Nome Completo', pagina: 1, tipo: 'texto', x: 58, y: 118, maxWidth: 100, campo: 'nome_completo' },
  { id: 'estado_civil', label: 'Estado Civil', pagina: 1, tipo: 'texto', x: 104, y: 130, maxWidth: 35, campo: 'estado_civil' },
  { id: 'sexo_m', label: 'Sexo M', pagina: 1, tipo: 'checkbox', x: 186.5, y: 116.5 },
  { id: 'sexo_f', label: 'Sexo F', pagina: 1, tipo: 'checkbox', x: 195, y: 116.5 },
  // ... demais campos
];
```

---

## Etapa 3: Refatorar Gerador de PDF

Reescrever `src/lib/pdfFichaCadastroGeral.ts` para:

1. **Usar configuração centralizada** - Ler coordenadas do arquivo de config
2. **Aplicar códigos SEGAD** - Converter valores para formato com código numérico
3. **Marcar checkboxes com X** - Conforme solicitado
4. **Truncar textos corretamente** - Usar largura máxima de cada campo

**Estrutura refatorada:**

```text
// Funções auxiliares
function getSegadEstadoCivil(valor: string): string
function getSegadTipoPcd(valor: string, isPcd: boolean): string
function getSegadRacaCor(valor: string): string
function renderCampo(doc, config, valor): void
function renderCheckbox(doc, x, y, marcado): void

// Renderização por página
function renderPagina1(doc, servidor, cargo, unidade): void
function renderPagina2(doc, servidor): void
function renderPagina3(doc, servidor, cargo): void
// ... páginas 4-7

// Função principal
export function gerarFichaCadastroGeral(dados): jsPDF {
  const doc = new jsPDF("p", "mm", "a4");
  const config = carregarConfigCampos();
  
  // Página 1
  doc.addImage(fichaPage1, ...);
  renderPagina1(doc, dados.servidor, dados.cargo, dados.unidade);
  
  // Páginas 2-7
  // ...
  
  return doc;
}
```

---

## Etapa 4: Integrar Rota do Calibrador no Admin

Adicionar a nova página ao menu administrativo.

**Arquivos modificados:**
- `src/config/adminMenu.ts` - Adicionar item "Calibrador SEGAD" na seção Configurações
- `src/App.tsx` - Adicionar rota `/admin/calibrador-segad`

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/admin/CalibradorSegadPage.tsx` |
| Criar | `src/config/segadFieldsConfig.ts` |
| Modificar | `src/types/rh.ts` |
| Modificar | `src/lib/pdfFichaCadastroGeral.ts` |
| Modificar | `src/config/adminMenu.ts` |
| Modificar | `src/App.tsx` |

---

## Detalhes Técnicos

### Coordenadas Calibradas (Página 1)

Baseado na análise das imagens do formulário original e do PDF gerado, as coordenadas serão mapeadas em milímetros (A4 = 210x297mm):

```text
DADOS DE IDENTIFICAÇÃO (Página 1)
┌─────────────────────────────────────────────────────────────────────┐
│ NOME: [x=58, y=118, w=100]                    SEXO: M[x=186.5] F[x=195] │
│ ESTADO CIVIL: [x=104, y=130, w=35]  RAÇA/COR: [x=141, y=130, w=30]    │
│                                     PCD: SIM[x=178] NÃO[x=191]       │
│ NACIONALIDADE: [x=58, y=142, w=55]  TIPO: [x=147, y=142, w=50]       │
│ NATURALIDADE: [x=58, y=154, w=55]   MOLÉSTIA: SIM[x=178] NÃO[x=191]  │
│ DATA NASC: [x=58, y=166]            TIPO SANG: [x=147, y=166]        │
│ NOME MÃE: [x=58, y=178, w=70]       NOME PAI: [x=147, y=178, w=55]   │
└─────────────────────────────────────────────────────────────────────┘

DOCUMENTAÇÃO (Página 1)
┌─────────────────────────────────────────────────────────────────────┐
│ CPF: [x=32, y=206]                  PIS/PASEP: [x=108, y=206]       │
│ RG: [x=58, y=218]      ÓRGÃO/UF: [x=118, y=218]  DATA: [x=175, y=218] │
│ RESERVISTA: [x=58, y=230] ÓRGÃO: [x=118, y=230]  DATA: [x=175, y=230] │
│ CATEGORIA: [x=58, y=242, w=40]      ANO: [x=175, y=242]             │
│ TÍTULO: [x=58, y=254]  SEÇÃO: [x=108, y=254]  ZONA: [x=135, y=254]  │
│                                     DATA: [x=175, y=254]             │
│ CIDADE VOT: [x=58, y=266]           UF: [x=175, y=266]              │
└─────────────────────────────────────────────────────────────────────┘
```

### Interface do Calibrador

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  CALIBRADOR SEGAD                                    [Salvar] [Exportar] │
├──────────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────┐  ┌─────────────────────────────────────┐ │
│  │    Página [1▼] de 7       │  │  Lista de Campos                    │ │
│  │                            │  │  ──────────────────────────────     │ │
│  │  [Imagem do formulário]    │  │  ☑ nome_completo  x:58 y:118 w:100 │ │
│  │                            │  │  ☑ estado_civil   x:104 y:130 w:35 │ │
│  │  [Clique para posicionar]  │  │  ☑ sexo_m (check) x:186.5 y:116.5  │ │
│  │                            │  │  ☑ sexo_f (check) x:195 y:116.5    │ │
│  │                            │  │  ☑ raca_cor       x:141 y:130 w:30 │ │
│  │                            │  │  ...                                │ │
│  └────────────────────────────┘  └─────────────────────────────────────┘ │
│                                                                          │
│  [Preview PDF]  [Testar com Servidor]                                    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Fluxo de Uso

1. Administrador acessa `/admin/calibrador-segad`
2. Seleciona a página do formulário (1-7)
3. Clica no campo da lista para editar
4. Clica na imagem para definir nova posição OU ajusta valores manualmente
5. Clica em "Preview PDF" para testar com dados de exemplo
6. Após validar, clica em "Salvar" para persistir configuração

### Persistência

As configurações serão salvas em localStorage inicialmente, com opção de exportar/importar JSON. Futuramente pode-se adicionar uma tabela no banco para persistência server-side.

---

## Benefícios

1. **Precisão** - Mapeamento exato sem sobreposição
2. **Manutenibilidade** - Alterações de coordenadas sem mexer no código
3. **Códigos SEGAD** - Formatação oficial com prefixos numéricos
4. **Validação Visual** - Preview em tempo real antes de gerar PDF final
5. **Flexibilidade** - Fácil adaptar se o modelo do formulário mudar

