# MIGRAÇÃO DO MÓDULO DE VIDA FUNCIONAL
## Status: ✅ IMPLEMENTADO
### Data: 02/02/2026 | Versão 1.0

---

## 📋 RESUMO DA MIGRAÇÃO

Esta etapa migrou o módulo de **Vida Funcional do Servidor** para consumir parâmetros configuráveis do banco de dados, eliminando hardcodes e preparando o sistema para multi-institucionalidade.

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. Tabelas de Configuração Criadas

| Tabela | Substitui | Campos Principais |
|--------|-----------|-------------------|
| `config_tipos_servidor` | `TIPO_SERVIDOR_LABELS`, `TIPO_SERVIDOR_COLORS`, `REGRAS_TIPO_SERVIDOR` | codigo, nome, cor_classe, regras de negócio |
| `config_situacoes_funcionais` | `SITUACAO_LABELS`, `SITUACAO_COLORS` | codigo, nome, cor_classe, permite_trabalho |
| `config_motivos_desligamento` | `MOTIVOS_ENCERRAMENTO` | codigo, nome, aplica_efetivo/comissionado |
| `config_tipos_ato` | `TIPOS_ATO` | codigo, nome, sigla, requer_doe |
| `config_tipos_onus` | `TIPOS_ONUS` | codigo, nome |

### 2. Seeds Populados para IDJUV

- **4 tipos de servidor**: efetivo_idjuv, comissionado_idjuv, cedido_entrada, cedido_saida
- **8 situações funcionais**: ativo, afastado, cedido, licença, férias, exonerado, aposentado, falecido
- **6 motivos de desligamento**: exoneração, término de mandato, cessão, aposentadoria, falecimento, demissão
- **4 tipos de ato**: portaria, decreto, lei, resolução
- **3 tipos de ônus**: origem, destino, compartilhado

### 3. RLS Implementada

Todas as tabelas possuem:
- `ENABLE ROW LEVEL SECURITY`
- `FORCE ROW LEVEL SECURITY`
- Políticas separadas para SELECT (rh.vidafuncional) e WRITE (admin.config)
- WITH CHECK em todas as políticas de escrita

### 4. Hook Frontend Criado

**`src/hooks/useConfigVidaFuncional.ts`**

```typescript
const {
  // Labels e Colors (compatibilidade direta)
  tipoServidorLabels,    // Record<string, string>
  tipoServidorColors,    // Record<string, string>
  regrasTipoServidor,    // Record<string, RegrasTipo>
  situacaoLabels,        // Record<string, string>
  situacaoColors,        // Record<string, string>
  
  // Options para selects
  motivosEncerramentoOptions,  // { value, label }[]
  tiposAtoOptions,             // { value, label }[]
  tiposOnusOptions,            // { value, label }[]
  
  // Funções utilitárias
  getLabelTipoServidor,  // (codigo) => string
  getColorTipoServidor,  // (codigo) => string
  getLabelSituacao,      // (codigo) => string
  getColorSituacao,      // (codigo) => string
  
  // Estado
  loading,
  usandoFallback,
} = useConfigVidaFuncional();
```

### 5. Fallback Seguro

O hook mantém **fallback local** para todos os valores, garantindo que:
- Se o banco estiver inacessível, o sistema continua funcionando
- Se a instituição não existir, usa valores padrão
- Se a tabela estiver vazia, usa hardcodes originais

---

## 🔌 COMO MIGRAR COMPONENTES

### Antes (hardcoded)

```typescript
import { 
  TIPO_SERVIDOR_LABELS, 
  TIPO_SERVIDOR_COLORS, 
  REGRAS_TIPO_SERVIDOR 
} from "@/types/servidor";

// Uso direto
<Badge className={TIPO_SERVIDOR_COLORS[tipo]}>
  {TIPO_SERVIDOR_LABELS[tipo]}
</Badge>

const regras = REGRAS_TIPO_SERVIDOR[tipoServidor];
```

### Depois (parametrizado)

```typescript
import { useConfigVidaFuncional } from "@/hooks/useConfigVidaFuncional";

const { 
  tipoServidorLabels, 
  tipoServidorColors, 
  regrasTipoServidor,
  getLabelTipoServidor,
  getColorTipoServidor,
} = useConfigVidaFuncional();

// Uso com fallback seguro
<Badge className={getColorTipoServidor(tipo)}>
  {getLabelTipoServidor(tipo)}
</Badge>

const regras = regrasTipoServidor[tipoServidor];
```

---

## 📊 ARQUIVOS AFETADOS

### Criados
- `src/hooks/useConfigVidaFuncional.ts`

### A Migrar (Fase 2 - Quando necessário)
- `src/pages/rh/GestaoServidoresPage.tsx`
- `src/components/curriculo/ConversaoServidorDialog.tsx`
- `src/components/rh/ProvimentoForm.tsx`
- `src/components/rh/LotacaoForm.tsx`

### Mantidos para Compatibilidade
- `src/types/servidor.ts` - Mantido com exports para backward compatibility
- `src/types/rh.ts` - Mantido com exports para backward compatibility

---

## ⚠️ NOTAS IMPORTANTES

1. **Não remover hardcodes ainda**: Os valores em `types/servidor.ts` e `types/rh.ts` devem ser mantidos como fallback até toda a migração ser concluída.

2. **Migração gradual**: Componentes podem ser migrados um a um sem quebrar o sistema.

3. **Cache do hook**: O hook carrega dados uma vez ao montar e mantém em memória. Use `recarregar()` se precisar atualizar.

4. **Permissões**: Apenas usuários com `admin.config` ou `admin` podem modificar configurações. Usuários com `rh.vidafuncional` podem apenas ler.

---

## 🚀 PRÓXIMAS ETAPAS

1. [ ] Migrar componentes de RH para usar `useConfigVidaFuncional()`
2. [ ] Criar interface administrativa para gerenciar configurações
3. [ ] Adicionar suporte a vigência temporal em tipos de servidor
4. [ ] Implementar auditoria de alterações em configurações

---

*Documento de migração - Versão 1.0*
*Próxima revisão: Fase de integração nos componentes*
