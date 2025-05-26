import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { authService } from "@/lib/auth";
import TransactionForm from "@/components/finances/transaction-form";
import { Plus, Search, Filter, TrendingUp, TrendingDown, DollarSign, Calendar, BarChart3, PieChartIcon } from "lucide-react"; // Added chart icons
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@shared/schema";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Helper for colors in Pie charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC0CB', '#D2B48C'];


export default function Finances() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["/api/projects"],
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a transação.",
        variant: "destructive",
      });
    },
  });

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction: Transaction) => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter;
    return matchesSearch && matchesType && matchesCategory;
  });

  // --- Chart Data Processing ---

  // 1. Income vs. Expense Over Time (Monthly for last 6 months)
  const monthlyChartData = (() => {
    const last6Months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return last6Months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart);
      const monthName = format(monthStart, "MMM/yy", { locale: ptBR });
      
      const income = transactions
        .filter(t => t.type === 'income' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date) >= monthStart && new Date(t.date) <= monthEnd)
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      return { month: monthName, Receitas: income, Despesas: expense };
    });
  })();

  // 2. Expense Breakdown by Category (Current Month)
  const currentMonthStart = startOfMonth(new Date());
  const currentMonthEnd = endOfMonth(new Date());

  const expenseByCategoryData = (() => {
    const categoryMap: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= currentMonthStart && new Date(t.date) <= currentMonthEnd)
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + parseFloat(t.amount);
      });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  })();
  
  // 3. Income Breakdown by Category (Current Month)
   const incomeByCategoryData = (() => {
    const categoryMap: { [key: string]: number } = {};
    transactions
      .filter(t => t.type === 'income' && new Date(t.date) >= currentMonthStart && new Date(t.date) <= currentMonthEnd)
      .forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] || 0) + parseFloat(t.amount);
      });
    return Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
  })();

  // --- End Chart Data Processing ---


  // Calculate totals for summary cards (already existing logic)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyTransactions = transactions.filter((t: Transaction) => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const totalIncome = monthlyTransactions
    .filter((t: Transaction) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalExpenses = monthlyTransactions
    .filter((t: Transaction) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const totalInvestments = monthlyTransactions
    .filter((t: Transaction) => t.type === "investment")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const balance = totalIncome - totalExpenses - totalInvestments;

  // Get unique categories
  const categories = [...new Set(transactions.map((t: Transaction) => t.category))];

  const getTypeColor = (type: string) => {
    switch (type) {
      case "income":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-red-100 text-red-800";
      case "investment":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case "income":
        return "Receita";
      case "expense":
        return "Despesa";
      case "investment":
        return "Investimento";
      default:
        return type;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "income":
        return TrendingUp;
      case "expense":
        return TrendingDown;
      case "investment":
        return DollarSign;
      default:
        return DollarSign;
    }
  };

  const getProjectName = (projectId: number | null) => {
    if (!projectId) return "Geral";
    const project = projects.find(p => p.id === projectId);
    return project?.name || "Projeto não encontrado";
  };

  if (isLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 shadow rounded-lg">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Financeiro
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Controle suas receitas, despesas e investimentos
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => setEditingTransaction(null)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Transação
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTransaction ? "Editar Transação" : "Nova Transação"}
                  </DialogTitle>
                </DialogHeader>
                <TransactionForm
                  transaction={editingTransaction}
                  projects={projects}
                  onSuccess={() => {
                    setIsFormOpen(false);
                    setEditingTransaction(null);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="overflow-hidden shadow">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Receitas (Mês)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <TrendingDown className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Despesas (Mês)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      R$ {totalExpenses.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Investimentos (Mês)
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      R$ {totalInvestments.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${balance >= 0 ? 'bg-green-500' : 'bg-red-500'} rounded-md flex items-center justify-center`}>
                    <DollarSign className="w-4 h-4 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Saldo (Mês)
                    </dt>
                    <dd className={`text-lg font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="income">Receitas</SelectItem>
                  <SelectItem value="expense">Despesas</SelectItem>
                  <SelectItem value="investment">Investimentos</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Charts Section */}
        <div className="my-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Análise Gráfica</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Receitas vs. Despesas (Últimos 6 Meses)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `R$${value.toLocaleString('pt-BR')}`} />
                      <Tooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                      <Legend />
                      <Bar dataKey="Receitas" fill="#00C49F" />
                      <Bar dataKey="Despesas" fill="#FF8042" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-10">Dados insuficientes para o gráfico de Receitas vs. Despesas.</p>
                )}
              </CardContent>
            </Card>

            <Card className="shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2 text-red-600" />
                  Despesas por Categoria (Mês Atual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {expenseByCategoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={expenseByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {expenseByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-500 py-10">Nenhuma despesa registrada este mês para exibir o gráfico.</p>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Optional: Income by Category Chart */}
          {incomeByCategoryData.length > 0 && (
            <Card className="shadow">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2 text-green-600" />
                  Receitas por Categoria (Mês Atual)
                </CardTitle>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={incomeByCategoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#82CA9D"
                        dataKey="value"
                      >
                        {incomeByCategoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `R$${value.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Transactions Table */}
        <Card className="shadow">
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle> {/* Changed title for clarity */}
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma transação encontrada
                </h3>
                <p className="text-gray-500 text-center mb-6">
                  {searchTerm || typeFilter !== "all" || categoryFilter !== "all"
                    ? "Tente ajustar os filtros para encontrar transações."
                    : "Comece adicionando sua primeira transação."}
                </p>
                {!searchTerm && typeFilter === "all" && categoryFilter === "all" && (
                  <Button
                    onClick={() => setIsFormOpen(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeira Transação
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Projeto</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction: Transaction) => {
                      const IconComponent = getTypeIcon(transaction.type);
                      
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <IconComponent className="w-4 h-4 text-gray-400" />
                              <Badge className={getTypeColor(transaction.type)}>
                                {getTypeText(transaction.type)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {transaction.description || "Sem descrição"}
                          </TableCell>
                          <TableCell>{transaction.category}</TableCell>
                          <TableCell>{getProjectName(transaction.projectId)}</TableCell>
                          <TableCell>
                            {format(new Date(transaction.date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <span className={
                              transaction.type === "income" 
                                ? "text-green-600" 
                                : transaction.type === "expense"
                                ? "text-red-600"
                                : "text-blue-600"
                            }>
                              {transaction.type === "income" ? "+" : "-"}
                              R$ {parseFloat(transaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingTransaction(transaction);
                                  setIsFormOpen(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => deleteTransactionMutation.mutate(transaction.id)}
                                disabled={deleteTransactionMutation.isPending}
                              >
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
