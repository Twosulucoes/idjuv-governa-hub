/**
 * Relatório 2: Quantidade de gestores por município (tabela + gráfico)
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { contarPorMunicipio, type MunicipioContagem } from '@/services/relatoriosGestoresService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function RelatorioMunicipios() {
  const [dados, setDados] = useState<MunicipioContagem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contarPorMunicipio()
      .then(setDados)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const total = dados.reduce((s, d) => s + d.quantidade, 0);

  return (
    <div className="space-y-6">
      {/* Gráfico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gestores por Município</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Carregando...</p>
          ) : dados.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Sem dados.</p>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(300, dados.length * 35)}>
              <BarChart data={dados} layout="vertical" margin={{ left: 120, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="municipio" type="category" width={110} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Detalhamento por Município</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Município</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dados.map((d) => (
                <TableRow key={d.municipio}>
                  <TableCell className="font-medium">{d.municipio}</TableCell>
                  <TableCell className="text-right">{d.quantidade}</TableCell>
                  <TableCell className="text-right">
                    {total > 0 ? ((d.quantidade / total) * 100).toFixed(1) : 0}%
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold border-t-2">
                <TableCell>Total</TableCell>
                <TableCell className="text-right">{total}</TableCell>
                <TableCell className="text-right">100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
