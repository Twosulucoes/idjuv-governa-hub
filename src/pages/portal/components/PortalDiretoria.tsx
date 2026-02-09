/**
 * PortalDiretoria - Seção da diretoria com dados do banco
 */

import { motion } from "framer-motion";
import { Mail, Phone, Linkedin, Award, User } from "lucide-react";
import { usePortalDiretoria } from "@/hooks/usePortalDiretoria";
import { useDadosOficiais } from "@/hooks/useDadosOficiais";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function DiretoriaCard({ 
  membro, 
  index, 
  isPresidente 
}: { 
  membro: any; 
  index: number;
  isPresidente?: boolean;
}) {
  const initials = membro.nome
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={`group ${isPresidente ? 'md:col-span-2 lg:col-span-1' : ''}`}
    >
      <div className={`relative bg-card border border-border rounded-2xl overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 ${
        isPresidente ? 'ring-2 ring-primary/20' : ''
      }`}>
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Badge Presidente */}
        {isPresidente && (
          <div className="absolute top-4 right-4 z-10">
            <Badge className="bg-primary/90 text-primary-foreground">
              <Award className="w-3 h-3 mr-1" />
              Dirigente Máximo
            </Badge>
          </div>
        )}

        <div className="relative p-6 text-center">
          {/* Avatar */}
          <motion.div 
            className="relative mx-auto mb-4"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Avatar className={`${isPresidente ? 'w-32 h-32' : 'w-24 h-24'} mx-auto border-4 border-primary/20 shadow-lg`}>
              <AvatarImage src={membro.foto_url || undefined} alt={membro.nome} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Ring Animation */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" style={{ margin: '-4px' }} />
          </motion.div>

          {/* Info */}
          <h3 className={`font-bold text-foreground group-hover:text-primary transition-colors ${
            isPresidente ? 'text-xl' : 'text-lg'
          }`}>
            {membro.nome}
          </h3>
          
          <p className="text-primary font-medium mt-1">
            {membro.cargo}
          </p>
          
          {membro.unidade && (
            <p className="text-muted-foreground text-sm mt-1">
              {membro.unidade}
            </p>
          )}

          {membro.bio && (
            <p className="text-muted-foreground text-sm mt-3 line-clamp-2">
              {membro.bio}
            </p>
          )}

          {membro.decreto_nomeacao && (
            <p className="text-xs text-muted-foreground/70 mt-3 italic">
              {membro.decreto_nomeacao}
            </p>
          )}

          {/* Contact Links */}
          {(membro.email || membro.telefone || membro.linkedin_url) && (
            <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-border">
              {membro.email && (
                <a 
                  href={`mailto:${membro.email}`}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Email"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {membro.telefone && (
                <a 
                  href={`tel:${membro.telefone}`}
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Telefone"
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {membro.linkedin_url && (
                <a 
                  href={membro.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function DiretoriaSkeleton() {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 text-center">
      <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
      <Skeleton className="h-6 w-32 mx-auto mb-2" />
      <Skeleton className="h-4 w-24 mx-auto mb-1" />
      <Skeleton className="h-4 w-40 mx-auto" />
    </div>
  );
}

export function PortalDiretoria() {
  const { data: diretoria, isLoading, error } = usePortalDiretoria();
  const { presidenteNome, obterValor } = useDadosOficiais();

  // Se não houver dados no banco, usar os dados oficiais do hook
  const membros = diretoria?.length 
    ? diretoria 
    : presidenteNome 
      ? [{
          id: 'presidente-fallback',
          nome: presidenteNome,
          cargo: obterValor('presidente_cargo', 'Presidente'),
          unidade: 'Presidência',
          foto_url: null,
          email: null,
          telefone: null,
          bio: null,
          linkedin_url: null,
          decreto_nomeacao: obterValor('presidente_decreto_nomeacao'),
          data_posse: null,
          ordem_exibicao: 1,
        }]
      : [];

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.05)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--accent)/0.05)_0%,transparent_50%)]" />

      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4 border border-primary/20">
            <User className="w-4 h-4 inline mr-2" />
            Conheça nossa equipe
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Diretoria Executiva
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Gestores comprometidos com o desenvolvimento esportivo e da juventude roraimense
          </p>
        </motion.div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <DiretoriaSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-12">
            <p>Não foi possível carregar a diretoria.</p>
          </div>
        ) : membros.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membros.map((membro, index) => (
              <DiretoriaCard
                key={membro.id}
                membro={membro}
                index={index}
                isPresidente={membro.cargo?.toLowerCase().includes('presidente') || index === 0}
              />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <p>Diretoria em atualização.</p>
          </div>
        )}
      </div>
    </section>
  );
}
