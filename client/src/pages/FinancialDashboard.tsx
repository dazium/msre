import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, FileText, CheckCircle, AlertCircle, Briefcase } from "lucide-react";

export default function FinancialDashboard() {
  const currentYear = new Date().getFullYear();
  const [year] = useState(currentYear);

  const { data: totalRevenue, isLoading: revenueLoading } = trpc.financialReporting.getTotalRevenue.useQuery();
  const { data: revenueByMonth, isLoading: monthlyLoading } = trpc.financialReporting.getRevenueByMonth.useQuery({ year });
  const { data: invoiceStats, isLoading: invoiceLoading } = trpc.financialReporting.getInvoiceStats.useQuery();
  const { data: projectStats, isLoading: projectLoading } = trpc.financialReporting.getProjectStats.useQuery();

  const isLoading = revenueLoading || monthlyLoading || invoiceLoading || projectLoading;

  if (isLoading) {
    return <div className="text-center py-8">Loading financial data...</div>;
  }

  const monthlyData = revenueByMonth || [];
  const maxRevenue = Math.max(...monthlyData.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Dashboard</h1>
        <p className="text-muted-foreground mt-1">Track your revenue, invoices, and business metrics</p>
      </div>

      {/* Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">All time payments received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${monthlyData.length > 0 ? (monthlyData.reduce((sum, m) => sum + m.revenue, 0) / monthlyData.length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground">Average per month in {year}</p>
          </CardContent>
        </Card>
      </div>

      {/* Invoice Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats?.totalInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">${(invoiceStats?.totalAmount || 0).toFixed(2)} total value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{invoiceStats?.paidInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">${(invoiceStats?.paidAmount || 0).toFixed(2)} collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid/Overdue</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(invoiceStats?.unpaidInvoices || 0) + (invoiceStats?.overdueInvoices || 0)}</div>
            <p className="text-xs text-muted-foreground">${(invoiceStats?.unpaidAmount || 0).toFixed(2)} outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Briefcase className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.totalProjects || 0}</div>
            <p className="text-xs text-muted-foreground">All projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.activeProjects || 0}</div>
            <p className="text-xs text-muted-foreground">In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Projects</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectStats?.completedProjects || 0}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue - {year}</CardTitle>
          <CardDescription>Revenue trend for the current year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No revenue data for {year}</p>
            ) : (
              <div className="space-y-2">
                {monthlyData.map((month) => {
                  const monthName = new Date(2024, month.month - 1).toLocaleString("default", { month: "short" });
                  const barWidth = (month.revenue / maxRevenue) * 100;

                  return (
                    <div key={month.month} className="flex items-center gap-2">
                      <div className="w-12 text-sm font-medium text-muted-foreground">{monthName}</div>
                      <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full flex items-center justify-end pr-2 transition-all"
                          style={{ width: `${barWidth}%` }}
                        >
                          {barWidth > 20 && <span className="text-xs font-medium text-white">${month.revenue.toFixed(0)}</span>}
                        </div>
                      </div>
                      <div className="w-20 text-right text-sm font-medium">${month.revenue.toFixed(2)}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Collection Rate */}
      {invoiceStats && invoiceStats.totalAmount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Collection Rate</CardTitle>
            <CardDescription>Percentage of invoiced amount that has been paid</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Collection Rate</span>
                  <span className="text-2xl font-bold">
                    {((invoiceStats.paidAmount / invoiceStats.totalAmount) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-600 h-full transition-all"
                    style={{ width: `${(invoiceStats.paidAmount / invoiceStats.totalAmount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Paid</p>
                  <p className="text-lg font-semibold">${invoiceStats.paidAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-lg font-semibold text-red-600">${invoiceStats.unpaidAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
