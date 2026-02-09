/**
 * Hook para integração de IA nos formulários CPSI
 * Suporta: preenchimento automático, assistência por campo e revisão
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type DocumentType = 'dfd' | 'etp' | 'tr';
type AIAction = 'fill_all' | 'fill_field' | 'review';

interface UseAICPSIOptions {
  documentType: DocumentType;
}

export function useAICPSI({ documentType }: UseAICPSIOptions) {
  const [isFillingAll, setIsFillingAll] = useState(false);
  const [fillingField, setFillingField] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<string>('');

  const callAI = useCallback(async (
    action: AIAction,
    params: {
      context?: string;
      fieldName?: string;
      fieldLabel?: string;
      currentValue?: string;
      formData?: Record<string, string>;
    }
  ) => {
    const { data, error } = await supabase.functions.invoke('cpsi-ai-assistant', {
      body: {
        action,
        documentType,
        ...params,
      },
    });

    if (error) {
      console.error('AI error:', error);
      throw new Error(error.message || 'Erro ao chamar IA');
    }

    if (data?.error) {
      throw new Error(data.error);
    }

    return data;
  }, [documentType]);

  const fillAll = useCallback(async (
    context: string,
    onFieldsFilled: (fields: Record<string, string>) => void
  ) => {
    setIsFillingAll(true);
    try {
      const data = await callAI('fill_all', { context });
      if (data?.fields) {
        onFieldsFilled(data.fields);
        toast.success('Formulário preenchido pela IA!', {
          description: 'Revise os campos antes de gerar o documento.',
        });
      }
    } catch (err) {
      toast.error('Erro ao preencher com IA', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      });
    } finally {
      setIsFillingAll(false);
    }
  }, [callAI]);

  const fillField = useCallback(async (
    fieldName: string,
    fieldLabel: string,
    currentValue: string,
    formData: Record<string, string>,
    onFieldFilled: (value: string) => void
  ) => {
    setFillingField(fieldName);
    try {
      const data = await callAI('fill_field', {
        fieldName,
        fieldLabel,
        currentValue,
        formData,
      });
      if (data?.content) {
        onFieldFilled(data.content);
        toast.success(`Campo "${fieldLabel}" preenchido pela IA`);
      }
    } catch (err) {
      toast.error('Erro ao gerar sugestão', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      });
    } finally {
      setFillingField(null);
    }
  }, [callAI]);

  const review = useCallback(async (formData: Record<string, string>) => {
    setIsReviewing(true);
    setReviewResult('');
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cpsi-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'review',
            documentType,
            formData,
          }),
        }
      );

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Erro ao revisar documento');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setReviewResult(fullText);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setReviewResult(fullText);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      toast.error('Erro ao revisar', {
        description: err instanceof Error ? err.message : 'Tente novamente',
      });
    } finally {
      setIsReviewing(false);
    }
  }, [documentType]);

  return {
    fillAll,
    fillField,
    review,
    isFillingAll,
    fillingField,
    isReviewing,
    reviewResult,
    setReviewResult,
  };
}
