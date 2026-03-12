/**
 * Hook para gerenciar configuração de campos de formulário
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FormFieldConfig {
  id: string;
  form_type: string;
  field_key: string;
  section: string;
  label: string;
  enabled: boolean;
  required: boolean;
  display_order: number;
  updated_at: string;
}

export function useFormFieldConfig(formType: string = 'pre_cadastro') {
  const [fields, setFields] = useState<FormFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFields = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('form_field_config')
      .select('*')
      .eq('form_type', formType)
      .order('section')
      .order('display_order');

    if (error) {
      console.error('Erro ao carregar config de campos:', error);
    } else {
      setFields((data as any[]) || []);
    }
    setLoading(false);
  }, [formType]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  const updateField = async (id: string, updates: Partial<Pick<FormFieldConfig, 'enabled' | 'required'>>) => {
    const { error } = await supabase
      .from('form_field_config')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: error.message });
      return false;
    }

    setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    return true;
  };

  const isFieldEnabled = useCallback((fieldKey: string): boolean => {
    const field = fields.find(f => f.field_key === fieldKey);
    return field ? field.enabled : true; // default enabled
  }, [fields]);

  const isFieldRequired = useCallback((fieldKey: string): boolean => {
    const field = fields.find(f => f.field_key === fieldKey);
    return field ? field.required : false;
  }, [fields]);

  const isSectionEnabled = useCallback((sectionKey: string): boolean => {
    const field = fields.find(f => f.section === 'secoes' && f.field_key === sectionKey);
    return field ? field.enabled : true;
  }, [fields]);

  return {
    fields,
    loading,
    fetchFields,
    updateField,
    isFieldEnabled,
    isFieldRequired,
    isSectionEnabled,
    // Group by section
    bySection: {
      documentos: fields.filter(f => f.section === 'documentos'),
      dados_pessoais: fields.filter(f => f.section === 'dados_pessoais'),
      secoes: fields.filter(f => f.section === 'secoes'),
    },
  };
}
