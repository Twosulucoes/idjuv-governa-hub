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
const INSCRICAO_FIM = new Date("2026-02-26T23:59:59"); // Encerra 26/02
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
      <div className="w-14 h-14 md:w-16 md:h-16 bg-foreground rounded-xl flex items-center justify-center">
        <span className="text-2xl md:text-3xl font-black text-background tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground mt-1">
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
    <section className="py-12 px-4 bg-gradient-to-b from-muted to-background">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-3xl p-6 md:p-10 shadow-xl border border-border"
        >
          {/* Status: Antes da Inscrição */}
          {status === "antes_inscricao" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-4">
                  <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-bold tracking-wider uppercase text-muted-foreground">
                    Inscrições em breve
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-foreground mb-2">
                  INSCRIÇÕES ABREM EM
                </h2>
                <p className="text-base text-muted-foreground">
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
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/15 rounded-full mb-4 animate-pulse">
                  <AlertCircle className="w-4 h-4 text-success" aria-hidden="true" />
                  <span className="text-sm font-bold tracking-wider uppercase text-success">
                    Inscrições Abertas!
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-foreground mb-2">
                  INSCREVA-SE AGORA
                </h2>
                <p className="text-base text-muted-foreground mb-4">
                  As inscrições encerram em:
                </p>
              </div>
              {renderCountdown(timeToFimInscricao)}
              <div className="mt-8 text-center">
                <Button 
                  asChild
                  size="lg" 
                  className="min-h-11 bg-foreground hover:bg-foreground/85 text-background font-bold tracking-wider uppercase px-8 py-6 text-base rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  <a href={INSCRICAO_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 w-5 h-5" aria-hidden="true" />
                    FAZER INSCRIÇÃO
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                </Button>
              </div>
            </>
          )}

          {/* Status: Inscrição Encerrada */}
          {status === "inscricao_encerrada" && (
            <>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full mb-4">
                  <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-bold tracking-wider uppercase text-muted-foreground">
                    Inscrições encerradas
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-foreground mb-2">
                  SELETIVAS COMEÇAM EM
                </h2>
                <p className="text-base text-muted-foreground">
                  28 de Fevereiro de 2026
                </p>
              </div>
              {renderCountdown(timeToSeletiva)}
            </>
          )}

          {/* Status: Seletiva Iniciada */}
          {status === "seletiva_iniciada" && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-success/15 rounded-full mb-4">
                <AlertCircle className="w-4 h-4 text-success" aria-hidden="true" />
                <span className="text-sm font-bold tracking-wider uppercase text-success">
                  Em Andamento
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-[0.1em] uppercase text-foreground">
                SELETIVAS EM CURSO
              </h2>
              <p className="text-base text-muted-foreground mt-2">
                Confira o cronograma e resultados abaixo
              </p>
            </div>
          )}

          {/* Cronograma resumido */}
          <div className="mt-8 pt-6 border-t border-border">
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-muted-foreground mb-4 text-center">
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
                  className="bg-muted/60 rounded-xl p-3 text-center"
                >
                  <p className="text-xs font-bold tracking-wider uppercase text-foreground">
                    {item.mod}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
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
