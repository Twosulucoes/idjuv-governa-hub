/**
 * CTA de Inscrição com Contagem Regressiva
 * Mostra countdown para inscrição e início das seletivas
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Clock, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const INSCRICAO_URL = "https://forms.gle/278FWm1b8yojNcRE8";
const INSCRICAO_INICIO = new Date("2026-02-09T00:00:00");
const INSCRICAO_FIM = new Date("2026-02-13T23:59:59");
const SELETIVA_INICIO = new Date("2026-02-28T08:00:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date();
  const difference = targetDate.getTime() - now.getTime();

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 md:w-16 md:h-16 bg-zinc-900 dark:bg-zinc-100 rounded-xl flex items-center justify-center">
        <span className="text-2xl md:text-3xl font-black text-white dark:text-zinc-900 tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] md:text-xs font-bold tracking-wider uppercase text-zinc-500 dark:text-zinc-400 mt-1">
        {label}
      </span>
    </div>
  );
}

type Status = "antes_inscricao" | "inscricao_aberta" | "inscricao_encerrada" | "seletiva_iniciada";

function getStatus(): Status {
  const now = new Date();
  if (now < INSCRICAO_INICIO) return "antes_inscricao";
  if (now >= INSCRICAO_INICIO && now <= INSCRICAO_FIM) return "inscricao_aberta";
  if (now > INSCRICAO_FIM && now < SELETIVA_INICIO) return "inscricao_encerrada";
  return "seletiva_iniciada";
}

export function SeletivaCountdownCTA() {
  const [status, setStatus] = useState<Status>(getStatus());
  const [timeToInscricao, setTimeToInscricao] = useState<TimeLeft>(calculateTimeLeft(INSCRICAO_INICIO));
  const [timeToSeletiva, setTimeToSeletiva] = useState<TimeLeft>(calculateTimeLeft(SELETIVA_INICIO));
  const [timeToFimInscricao, setTimeToFimInscricao] = useState<TimeLeft>(calculateTimeLeft(INSCRICAO_FIM));

  useEffect(() => {
    const timer = setInterval(() => {
      setStatus(getStatus());
      setTimeToInscricao(calculateTimeLeft(INSCRICAO_INICIO));
      setTimeToSeletiva(calculateTimeLeft(SELETIVA_INICIO));
      setTimeToFimInscricao(calculateTimeLeft(INSCRICAO_FIM));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const renderCountdown = (timeLeft: TimeLeft) => (
    <div className="flex gap-2 md:gap-3 justify-center">
      <CountdownUnit value={timeLeft.days} label="Dias" />
      <CountdownUnit value={timeLeft.hours} label="Horas" />
      <CountdownUnit value={timeLeft.minutes} label="Min" />
      <CountdownUnit value={timeLeft.seconds} label="Seg" />
    </div>
  );

  return (
    <section className="py-12 px-4 bg-gradient-to-b from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white dark:bg-zinc-800 rounded-3xl p-6 md:p-10 shadow-xl border border-zinc-200 dark:border-zinc-700"
        >
          {/* Status: Antes da Inscrição */}
          {status === "antes_inscricao" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-700 rounded-full mb-4">
                  <Clock className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  <span className="text-sm font-bold tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
                    Inscrições em breve
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100 mb-2">
                  INSCRIÇÕES ABREM EM
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  09 de Fevereiro de 2026
                </p>
              </div>
              {renderCountdown(timeToInscricao)}
            </>
          )}

          {/* Status: Inscrição Aberta */}
          {status === "inscricao_aberta" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-bold tracking-wider uppercase text-green-600 dark:text-green-400">
                    Inscrições Abertas!
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100 mb-2">
                  INSCREVA-SE AGORA
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                  As inscrições encerram em:
                </p>
              </div>
              {renderCountdown(timeToFimInscricao)}
              <div className="mt-8 text-center">
                <a href={INSCRICAO_URL} target="_blank" rel="noopener noreferrer">
                  <Button 
                    size="lg" 
                    className="bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold tracking-wider uppercase px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                  >
                    <ExternalLink className="mr-2 w-5 h-5" />
                    FAZER INSCRIÇÃO
                  </Button>
                </a>
              </div>
            </>
          )}

          {/* Status: Inscrição Encerrada */}
          {status === "inscricao_encerrada" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-200 dark:bg-zinc-700 rounded-full mb-4">
                  <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
                  <span className="text-sm font-bold tracking-wider uppercase text-zinc-600 dark:text-zinc-300">
                    Inscrições encerradas
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100 mb-2">
                  SELETIVAS COMEÇAM EM
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  28 de Fevereiro de 2026
                </p>
              </div>
              {renderCountdown(timeToSeletiva)}
            </>
          )}

          {/* Status: Seletiva Iniciada */}
          {status === "seletiva_iniciada" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                <AlertCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold tracking-wider uppercase text-green-600 dark:text-green-400">
                  Em Andamento
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-zinc-900 dark:text-zinc-100">
                SELETIVAS EM CURSO
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                Confira o cronograma e resultados abaixo
              </p>
            </div>
          )}

          {/* Cronograma resumido */}
          <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-700">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-zinc-500 dark:text-zinc-400 mb-4 text-center">
              Cronograma das Seletivas
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { mod: "VÔLEI", datas: "28/02 e 01/03" },
                { mod: "FUTSAL", datas: "07/03 e 08/03" },
                { mod: "BASQUETE", datas: "14/03 e 15/03" },
                { mod: "HANDEBOL", datas: "21/03 e 22/03" },
              ].map((item) => (
                <div
                  key={item.mod}
                  className="bg-zinc-100 dark:bg-zinc-900/50 rounded-xl p-3 text-center"
                >
                  <p className="text-xs font-bold tracking-wider uppercase text-zinc-900 dark:text-zinc-100">
                    {item.mod}
                  </p>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1">
                    {item.datas}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
