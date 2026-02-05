

# Plano: Atualizar Unidades Locais com Dados Completos do PDF

## Situacao Atual

O banco de dados possui **32 unidades cadastradas**, mas os campos de detalhamento estao vazios:

| Campo | Preenchidos |
|-------|-------------|
| Endereco completo | 0 |
| Capacidade | 0 |
| Areas disponiveis | 0 |
| Estrutura disponivel | 0 |
| Horario funcionamento | 0 |

## Dados do PDF

O documento **"RELACAO DE UNIDADES DESPORTIVAS 2026"** contem informacoes completas para cada unidade:

- **Endereco**: Bairro/localizacao de cada unidade
- **Estrutura**: Quadras, piscinas, vestiarios, arquibancadas, etc.
- **Tipo**: Classificacao correta (parque aquatico, ginasio, estadio, complexo)

## Estrategia de Atualizacao

### Etapa 1: Preparar SQL de Atualizacao

Criar comandos UPDATE para cada unidade com os dados do PDF:

```text
Exemplo de unidade:
┌───────────────────────────────────────────────────────────────────┐
│ Parque Aquatico Alto Alegre                                       │
├───────────────────────────────────────────────────────────────────┤
│ Endereco: Vila Campos (Sede do Municipio)                         │
│ Estrutura: Piscina semi-olimpica, piscina infantil,               │
│            vestiarios masculino/feminino, lanchonete,             │
│            duchas, guarita, banheiros, deck de madeira            │
│ Areas: Piscina Semiolimpica, Piscina Infantil, Vestiarios,        │
│        Banheiros, Area de Alimentacao                             │
└───────────────────────────────────────────────────────────────────┘
```

### Etapa 2: Executar Atualizacoes no Banco

Usar a ferramenta de dados do Supabase para executar os UPDATEs:

```sql
UPDATE unidades_locais SET
  endereco_completo = 'Vila Campos (Sede do Municipio), Alto Alegre - RR',
  estrutura_disponivel = 'Piscina semi-olimpica, piscina infantil, vestiarios masculino/feminino, lanchonete, duchas, guarita, banheiros, deck de madeira',
  areas_disponiveis = ARRAY['Piscina Semiolimpica', 'Piscina Infantil', 'Vestiarios', 'Banheiros', 'Area de Alimentacao']
WHERE nome_unidade = 'Parque Aquatico Alto Alegre';
```

### Etapa 3: Validar e Ajustar Tipos

Verificar se o `tipo_unidade` esta correto para cada registro:
- Campos do Careca, Rei Pele, etc. -> tipo `outro` pode ser ajustado para `quadra` ou `complexo`
- Complexos esportivos identificados no PDF

## Mapeamento de Dados do PDF

| Municipio | Unidade | Endereco | Estrutura Principal |
|-----------|---------|----------|---------------------|
| Alto Alegre | PA Alto Alegre | Vila Campos | 2 piscinas, vestiarios |
| Amajari | PA Amajari | Vila Brasil | 2 piscinas, deck |
| Boa Vista | PA Cacari | Av. Major Williams, Cacari | 2 piscinas, academia, vestiarios |
| Boa Vista | PA Carana | Av. Venezuela, Carana | 2 piscinas, deck, vestiarios |
| Boa Vista | PA Primavera | Primavera | 2 piscinas, vestiarios |
| Boa Vista | Piscina Olimpica | Av. Mario Homem de Mello | Piscina olimpica, arquibancada |
| Boa Vista | Estadio Canarinho | Av. Ene Garcez | Campo, vestiarios, arquibancada |
| Boa Vista | Estadio Ribeirao | Av. das Guianas | Campo, vestiarios, arquibancada |
| Boa Vista | Ginasio Totozao | Av. Mario Homem de Mello | Quadra, vestiarios, arquibancada |
| Boa Vista | Ginasio Tancredo Neves | Cidade Satelite | Quadra, vestiarios |
| Boa Vista | Ginasio Pintolandia | Pintolandia | Quadra, vestiarios |
| Boa Vista | Ginasio Helio Campos | Helio Campos | Quadra, vestiarios |
| ... | ... | ... | ... |

*(Total: 32 unidades)*

## Resumo das Alteracoes

```text
ATUALIZACOES POR LOTE:
├── 8 Parques Aquaticos ─────── endereco + estrutura + areas
├── 1 Piscina Olimpica ──────── endereco + estrutura + areas + capacidade
├── 4 Estadios ──────────────── endereco + estrutura + areas
├── 18 Ginasios ─────────────── endereco + estrutura + areas
└── 2 Complexos Esportivos ──── endereco + estrutura + areas
    (+ ajuste de tipo_unidade)
```

## Campos a Preencher

Para cada unidade:

| Campo | Origem no PDF |
|-------|---------------|
| `endereco_completo` | Coluna "Endereco" |
| `estrutura_disponivel` | Descricao dos itens |
| `areas_disponiveis` | Array baseado na estrutura |
| `tipo_unidade` | Ajustar se necessario |
| `observacoes` | Informacoes adicionais |

## Ordem de Execucao

1. Gerar SQLs de UPDATE para todas as 32 unidades
2. Executar em lotes (por municipio ou por tipo)
3. Verificar resultado final com query de validacao
4. Atualizar tipos onde necessario (ex: Campo -> outro/complexo)

