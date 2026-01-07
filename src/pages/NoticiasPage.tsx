import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { BadgeInstitucional } from "@/components/ui/BadgeInstitucional";
import { 
  Search,
  Calendar,
  ArrowLeft,
  ArrowRight,
  Newspaper,
  Filter,
  X,
  Clock,
  Eye
} from "lucide-react";

interface Noticia {
  id: number;
  titulo: string;
  resumo: string;
  conteudo: string;
  data: string;
  categoria: string;
  imagem?: string;
  destaque: boolean;
  visualizacoes: number;
  tempoLeitura: string;
}

const categorias = [
  { id: "todos", nome: "Todas", cor: "bg-primary" },
  { id: "esporte", nome: "Esporte", cor: "bg-primary" },
  { id: "juventude", nome: "Juventude", cor: "bg-secondary" },
  { id: "cultura", nome: "Cultura", cor: "bg-accent" },
  { id: "institucional", nome: "Institucional", cor: "bg-highlight" },
  { id: "eventos", nome: "Eventos", cor: "bg-muted-foreground" },
];

const noticias: Noticia[] = [
  {
    id: 1,
    titulo: "IDJUV abre inscrições para o Bolsa Atleta 2025",
    resumo: "Atletas de alto rendimento podem se inscrever até o dia 15 de janeiro para o programa de incentivo ao esporte. O programa oferece bolsas de até R$ 1.500 mensais.",
    conteudo: "",
    data: "2024-12-20",
    categoria: "esporte",
    destaque: true,
    visualizacoes: 1250,
    tempoLeitura: "3 min"
  },
  {
    id: 2,
    titulo: "Jogos Escolares de Roraima batem recorde de participação",
    resumo: "Mais de 5 mil estudantes participaram da edição 2024, representando escolas de todos os municípios do estado. A competição revelou novos talentos para o esporte roraimense.",
    conteudo: "",
    data: "2024-12-18",
    categoria: "esporte",
    destaque: true,
    visualizacoes: 980,
    tempoLeitura: "4 min"
  },
  {
    id: 3,
    titulo: "Festival de Cultura revela novos talentos roraimenses",
    resumo: "Evento reuniu artistas de diversas modalidades e premiou os melhores trabalhos em cada categoria. Foram mais de 200 inscritos competindo em 6 categorias.",
    conteudo: "",
    data: "2024-12-15",
    categoria: "cultura",
    destaque: false,
    visualizacoes: 756,
    tempoLeitura: "5 min"
  },
  {
    id: 4,
    titulo: "Programa Juventude Cidadã forma 200 jovens em capacitação profissional",
    resumo: "Jovens de 15 a 29 anos concluíram cursos de qualificação em diversas áreas, aumentando suas chances no mercado de trabalho.",
    conteudo: "",
    data: "2024-12-12",
    categoria: "juventude",
    destaque: false,
    visualizacoes: 634,
    tempoLeitura: "3 min"
  },
  {
    id: 5,
    titulo: "IDJUV inaugura novo centro esportivo no bairro Pintolândia",
    resumo: "O novo espaço conta com quadra poliesportiva, academia ao ar livre e pista de caminhada, beneficiando mais de 10 mil moradores da região.",
    conteudo: "",
    data: "2024-12-10",
    categoria: "institucional",
    destaque: true,
    visualizacoes: 1432,
    tempoLeitura: "4 min"
  },
  {
    id: 6,
    titulo: "Inscrições abertas para o Workshop de Empreendedorismo Jovem",
    resumo: "O evento gratuito acontecerá no Centro de Convenções e oferecerá palestras e oficinas práticas sobre criação de negócios.",
    conteudo: "",
    data: "2024-12-08",
    categoria: "eventos",
    destaque: false,
    visualizacoes: 523,
    tempoLeitura: "2 min"
  },
  {
    id: 7,
    titulo: "Atletas roraimenses conquistam medalhas nos Jogos do Norte",
    resumo: "Delegação do estado trouxe 15 medalhas da competição regional, com destaque para as modalidades de atletismo e natação.",
    conteudo: "",
    data: "2024-12-05",
    categoria: "esporte",
    destaque: false,
    visualizacoes: 892,
    tempoLeitura: "4 min"
  },
  {
    id: 8,
    titulo: "Conselho da Juventude elege nova diretoria para biênio 2025-2026",
    resumo: "Eleição contou com participação de representantes de todas as regiões do estado. Nova gestão focará em ampliar a participação juvenil nas políticas públicas.",
    conteudo: "",
    data: "2024-12-03",
    categoria: "juventude",
    destaque: false,
    visualizacoes: 412,
    tempoLeitura: "3 min"
  },
  {
    id: 9,
    titulo: "Projeto leva oficinas de dança para comunidades indígenas",
    resumo: "Iniciativa do IDJUV promove intercâmbio cultural entre danças tradicionais e contemporâneas em comunidades da região do Surumu.",
    conteudo: "",
    data: "2024-12-01",
    categoria: "cultura",
    destaque: false,
    visualizacoes: 567,
    tempoLeitura: "5 min"
  },
  {
    id: 10,
    titulo: "IDJUV divulga balanço de ações realizadas em 2024",
    resumo: "Relatório mostra que mais de 50 mil pessoas foram beneficiadas diretamente pelos programas e projetos da instituição ao longo do ano.",
    conteudo: "",
    data: "2024-11-28",
    categoria: "institucional",
    destaque: false,
    visualizacoes: 345,
    tempoLeitura: "6 min"
  },
];

function formatarData(dataString: string): string {
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
}

function getCorCategoria(categoriaId: string): string {
  const categoria = categorias.find(c => c.id === categoriaId);
  return categoria?.cor || "bg-muted";
}

export default function NoticiasPage() {
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 6;

  const noticiasFiltradas = useMemo(() => {
    return noticias.filter(noticia => {
      const matchBusca = busca === "" || 
        noticia.titulo.toLowerCase().includes(busca.toLowerCase()) ||
        noticia.resumo.toLowerCase().includes(busca.toLowerCase());
      
      const matchCategoria = categoriaAtiva === "todos" || 
        noticia.categoria === categoriaAtiva;
      
      return matchBusca && matchCategoria;
    });
  }, [busca, categoriaAtiva]);

  const noticiasDestaque = noticias.filter(n => n.destaque).slice(0, 3);

  const totalPaginas = Math.ceil(noticiasFiltradas.length / itensPorPagina);
  const noticiasPaginadas = noticiasFiltradas.slice(
    (paginaAtual - 1) * itensPorPagina,
    paginaAtual * itensPorPagina
  );

  const limparFiltros = () => {
    setBusca("");
    setCategoriaAtiva("todos");
    setPaginaAtual(1);
  };

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-secondary/70 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-foreground/80 hover:text-primary-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Voltar para o início
          </Link>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-primary-foreground/10 rounded-xl backdrop-blur-sm">
              <Newspaper className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">Notícias</h1>
              <p className="text-primary-foreground/80">Acompanhe as novidades do IDJUV</p>
            </div>
          </div>
        </div>
      </section>

      {/* Notícias em Destaque */}
      <section className="py-12 bg-background border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <BadgeInstitucional variant="highlight">Em Destaque</BadgeInstitucional>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {noticiasDestaque.map((noticia, index) => (
              <Card 
                key={noticia.id}
                className={`group cursor-pointer hover:shadow-xl transition-all duration-300 animate-fade-in overflow-hidden ${
                  index === 0 ? 'md:col-span-2 md:row-span-2' : ''
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`${getCorCategoria(noticia.categoria)} h-2`}></div>
                <CardContent className={`p-6 ${index === 0 ? 'md:p-8' : ''}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getCorCategoria(noticia.categoria)}/10 text-foreground`}>
                      {categorias.find(c => c.id === noticia.categoria)?.nome}
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatarData(noticia.data)}
                    </span>
                  </div>
                  <h3 className={`font-bold text-foreground mb-3 group-hover:text-primary transition-colors ${
                    index === 0 ? 'text-2xl md:text-3xl' : 'text-lg'
                  }`}>
                    {noticia.titulo}
                  </h3>
                  <p className={`text-muted-foreground leading-relaxed ${index === 0 ? 'text-base' : 'text-sm'}`}>
                    {noticia.resumo}
                  </p>
                  <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {noticia.tempoLeitura} de leitura
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {noticia.visualizacoes.toLocaleString()} visualizações
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Filtros e Lista de Notícias */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          {/* Barra de Busca e Filtros */}
          <div className="bg-background rounded-xl p-4 md:p-6 shadow-sm mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Campo de Busca */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar notícias..."
                  value={busca}
                  onChange={(e) => {
                    setBusca(e.target.value);
                    setPaginaAtual(1);
                  }}
                  className="pl-10 h-12"
                />
              </div>
              
              {/* Botão Limpar Filtros */}
              {(busca || categoriaAtiva !== "todos") && (
                <Button 
                  variant="outline" 
                  onClick={limparFiltros}
                  className="h-12"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar Filtros
                </Button>
              )}
            </div>

            {/* Categorias */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Categorias:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria.id}
                    variant={categoriaAtiva === categoria.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setCategoriaAtiva(categoria.id);
                      setPaginaAtual(1);
                    }}
                    className={`transition-all ${
                      categoriaAtiva === categoria.id 
                        ? '' 
                        : 'hover:bg-primary/10 hover:text-primary hover:border-primary'
                    }`}
                  >
                    {categoria.nome}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {noticiasFiltradas.length} {noticiasFiltradas.length === 1 ? 'notícia encontrada' : 'notícias encontradas'}
              {categoriaAtiva !== "todos" && ` em "${categorias.find(c => c.id === categoriaAtiva)?.nome}"`}
              {busca && ` para "${busca}"`}
            </p>
          </div>

          {/* Lista de Notícias */}
          {noticiasPaginadas.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticiasPaginadas.map((noticia, index) => (
                <Card 
                  key={noticia.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300 animate-fade-in overflow-hidden"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={`${getCorCategoria(noticia.categoria)} h-1`}></div>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {categorias.find(c => c.id === noticia.categoria)?.nome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatarData(noticia.data)}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
                      {noticia.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                      {noticia.resumo}
                    </p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {noticia.tempoLeitura}
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {noticia.visualizacoes}
                        </span>
                      </div>
                      <span className="text-xs text-primary font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Ler mais
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhuma notícia encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros ou termos de busca.
              </p>
              <Button variant="outline" onClick={limparFiltros}>
                Limpar Filtros
              </Button>
            </Card>
          )}

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((pagina) => (
                <Button
                  key={pagina}
                  variant={paginaAtual === pagina ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPaginaAtual(pagina)}
                  className="w-10"
                >
                  {pagina}
                </Button>
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
