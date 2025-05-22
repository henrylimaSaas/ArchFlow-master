import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@shared/schema";

interface FinancialOverviewProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export default function FinancialOverview({ transactions, isLoading }: FinancialOverviewProps) {
  if (isLoading) {
    return (
      <Card className="shadow">
        <CardHeader>
          <CardTitle>Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-center">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                </div>
              ))}
            </div>
            <div className="bg-gray-100 rounded-lg h-48"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate financial summary
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter(t => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const revenue = monthlyTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const expenses = monthlyTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const profit = revenue - expenses;

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Resumo Financeiro
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm" className="text-sm text-gray-500">
              Mês
            </Button>
            <Button variant="ghost" size="sm" className="text-sm font-medium text-green-600">
              Trimestre
            </Button>
            <Button variant="ghost" size="sm" className="text-sm text-gray-500">
              Ano
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              R$ {revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500">Receita</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              R$ {expenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500">Despesas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              R$ {profit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500">Lucro</div>
          </div>
        </div>
        
        {/* Simple Chart Placeholder */}
        <div className="bg-gray-100 rounded-lg h-48 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl text-gray-400 mb-2">📊</div>
            <p className="text-gray-500">Gráfico de evolução financeira</p>
            <p className="text-xs text-gray-400">Será implementado com Recharts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
