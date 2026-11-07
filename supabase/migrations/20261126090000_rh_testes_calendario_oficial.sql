-- RH, teste de 06/11/2026, item 17: calendário oficial.
--
-- Falta o Dia Nacional de Zumbi e da Consciência Negra (20/11), feriado nacional pela Lei nº 14.759/2023: novembro
-- de 2026 contava 20 dias úteis em vez de 19. Entra como recorrente, como os outros feriados de data fixa.
-- Os feriados móveis só existiam em 2026; entram os de 2027 (Páscoa em 28/03/2027).
--
-- Só INSERT, cada um protegido por NOT EXISTS: rodar de novo não duplica nada, e a linha que o RH já tiver
-- cadastrado à mão (mesma data) é mantida.

INSERT INTO public.dias_nao_uteis
  (id, data, nome, tipo, esfera, conta_frequencia, exige_compensacao, recorrente, mes_recorrente, dia_recorrente,
   abrangencia, ativo, fundamentacao_legal)
SELECT v.id, v.data, v.nome, v.tipo, 'nacional', false, false, v.recorrente, v.mes_recorrente, v.dia_recorrente,
       'todas', true, v.fundamentacao_legal
  FROM (VALUES
    ('a7c1d2e0-1120-4c0a-9b1e-202611200001'::uuid, DATE '2026-11-20', 'Dia Nacional de Zumbi e da Consciência Negra',
     'feriado_nacional', true, 11, 20, 'Lei nº 14.759, de 21/12/2023'),
    ('a7c1d2e0-1120-4c0a-9b1e-202703260001'::uuid, DATE '2027-03-26', 'Sexta-feira Santa',
     'feriado_nacional', false, NULL::int, NULL::int, NULL),
    ('a7c1d2e0-1120-4c0a-9b1e-202705270001'::uuid, DATE '2027-05-27', 'Corpus Christi',
     'ponto_facultativo', false, NULL::int, NULL::int, NULL)
  ) AS v(id, data, nome, tipo, recorrente, mes_recorrente, dia_recorrente, fundamentacao_legal)
 WHERE NOT EXISTS (
         SELECT 1 FROM public.dias_nao_uteis d
          WHERE d.data = v.data
             OR (v.recorrente AND coalesce(d.recorrente, false)
                 AND d.mes_recorrente = v.mes_recorrente AND d.dia_recorrente = v.dia_recorrente)
       )
   AND NOT EXISTS (SELECT 1 FROM public.dias_nao_uteis d WHERE d.id = v.id);
