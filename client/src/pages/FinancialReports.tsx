import { useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingUp, Users, AlertCircle } from "lucide-react";

export default function FinancialReports() {
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: payments } = trpc.payments.getByUser.useQuery();
  const { data: projects } = trpc.projects.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: estimates } = trpc.estimates.list.useQuery();

  // Calculate P&L Report
  const profitLoss = useMemo(() => {
    const totalRevenue = payments?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;
    const totalInvoiced = invoices?.reduce((sum, i) => sum + (parseFloat(i.total) || 0), 0) || 0;
    
    // Estimate costs (simplified: 40% of revenue for materials/labor)
    const estimatedCosts = totalRevenue * 0.4;
    const profit = totalRevenue - estimatedCosts;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue * 100).toFixed(2) : 0;

    return {
      revenue: totalRevenue,
      costs: estimatedCosts,
      profit,
      profitMargin,
      invoiced: totalInvoiced,
    };
  }, [payments, invoices]);

  // Calculate Cash Flow Forecast
  const cashFlowForecast = useMemo(() => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 6; i++) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      const monthInvoices = invoices?.filter(inv => {
        const invDate = new Date(inv.createdAt);
        return invDate.getMonth() === monthDate.getMonth() && invDate.getFullYear() === monthDate.getFullYear();
      }) || [];
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      
      months.push({
        month: monthStr,
        projected: monthRevenue,
        actual: monthRevenue > 0 ? monthRevenue : null,
      });
    }
    
    return months;
  }, [invoices]);

  // Calculate Project Profitability
  const projectProfitability = useMemo(() => {
    return projects?.map(project => {
      const projectInvoices = invoices?.filter(inv => inv.projectId === project.id) || [];
      const revenue = projectInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      const estimatedCost = revenue * 0.4;
      const profit = revenue - estimatedCost;
      const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : '0';
      
      return {
        id: project.id,
        title: project.title,
        revenue,
        cost: estimatedCost,
        profit,
        margin: typeof margin === 'string' ? parseFloat(margin) : margin,
      };
    }).sort((a, b) => b.profit - a.profit).slice(0, 10) || [];
  }, [projects, invoices]);

  // Calculate Customer Lifetime Value
  const customerLifetimeValue = useMemo(() => {
    return customers?.map(customer => {
      const customerInvoices = invoices?.filter(inv => inv.customerId === customer.id) || [];
      const totalValue = customerInvoices.reduce((sum, inv) => sum + (parseFloat(inv.total) || 0), 0);
      const projectCount = projects?.filter(p => p.customerId === customer.id).length || 0;
      
      return {
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        totalValue,
        projectCount,
        avgProjectValue: projectCount > 0 ? (totalValue / projectCount).toFixed(2) : '0',
      };
    }).sort((a, b) => b.totalValue - a.totalValue).slice(0, 10) || [];
  }, [customers, invoices, projects]);

  // Calculate Sales Pipeline
  const salesPipeline = useMemo(() => {
    const pipeline = {
      draft: 0,
      sent: 0,
      accepted: 0,
      rejected: 0,
    };
    
    estimates?.forEach(est => {
      if (est.status === 'draft') pipeline.draft += parseFloat(est.subtotal || '0');
      if (est.status === 'sent') pipeline.sent += parseFloat(est.subtotal || '0');
      if (est.status === 'accepted') pipeline.accepted += parseFloat(est.subtotal || '0');
      if (est.status === 'rejected') pipeline.rejected += parseFloat(est.subtotal || '0');
    });
    
    return [
      { name: 'Draft', value: pipeline.draft, color: '#8b5cf6' },
      { name: 'Sent', value: pipeline.sent, color: '#3b82f6' },
      { name: 'Accepted', value: pipeline.accepted, color: '#10b981' },
      { name: 'Rejected', value: pipeline.rejected, color: '#ef4444' },
    ];
  }, [estimates]);

  // Calculate Accounts Receivable Aging
  const receivableAging = useMemo(() => {
    const today = new Date();
    const aging = {
      current: 0,
      '30days': 0,
      '60days': 0,
      '90days': 0,
      'over90': 0,
    };
    
    invoices?.forEach(inv => {
      if (inv.status === 'paid') return;
      
      const invDate = new Date(inv.createdAt);
      const daysOld = Math.floor((today.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24));
      const amount = parseFloat(inv.total) || 0;
      
      if (daysOld <= 30) aging.current += amount;
      else if (daysOld <= 60) aging['30days'] += amount;
      else if (daysOld <= 90) aging['60days'] += amount;
      else if (daysOld <= 120) aging['90days'] += amount;
      else aging['over90'] += amount;
    });
    
    return [
      { range: 'Current (0-30)', amount: aging.current },
      { range: '31-60 Days', amount: aging['30days'] },
      { range: '61-90 Days', amount: aging['60days'] },
      { range: '91-120 Days', amount: aging['90days'] },
      { range: 'Over 120 Days', amount: aging['over90'] },
    ];
  }, [invoices]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Financial Reports</h1>

      {/* P&L Report */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Profit & Loss Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded bg-blue-950/20 border border-blue-500/50">
              <p className="text-sm text-foreground/60">Total Revenue</p>
              <p className="text-2xl font-bold text-blue-400">${profitLoss.revenue.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded bg-red-950/20 border border-red-500/50">
              <p className="text-sm text-foreground/60">Estimated Costs</p>
              <p className="text-2xl font-bold text-red-400">${profitLoss.costs.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded bg-green-950/20 border border-green-500/50">
              <p className="text-sm text-foreground/60">Net Profit</p>
              <p className="text-2xl font-bold text-green-400">${profitLoss.profit.toFixed(2)}</p>
            </div>
            <div className="p-4 rounded bg-purple-950/20 border border-purple-500/50">
              <p className="text-sm text-foreground/60">Profit Margin</p>
              <p className="text-2xl font-bold text-purple-400">{profitLoss.profitMargin}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Forecast */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>6-Month Cash Flow Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cashFlowForecast}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="month" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }} />
              <Legend />
              <Line type="monotone" dataKey="projected" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Profitability */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Top 10 Projects by Profitability</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectProfitability}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="title" stroke="#888" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }} />
              <Legend />
              <Bar dataKey="profit" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Customer Lifetime Value */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top 10 Customers by Lifetime Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customerLifetimeValue.map((customer, idx) => (
              <div key={customer.id} className="p-3 rounded bg-background/30 border border-border/50">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-foreground">{idx + 1}. {customer.name}</p>
                    <p className="text-xs text-foreground/60">{customer.projectCount} projects</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-400">${customer.totalValue.toFixed(2)}</p>
                    <p className="text-xs text-foreground/60">Avg: ${customer.avgProjectValue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sales Pipeline */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle>Sales Pipeline by Status</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={salesPipeline}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: $${value.toFixed(0)}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {salesPipeline.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => `$${(value as number)?.toFixed?.(2) || 0}`} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accounts Receivable Aging */}
      <Card className="border-border/50 bg-background/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Accounts Receivable Aging
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={receivableAging}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="range" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1a2e', border: '1px solid #444' }} formatter={(value: any) => `$${(value as number)?.toFixed?.(2) || 0}`} />
              <Bar dataKey="amount" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
