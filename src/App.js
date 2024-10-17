"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function FinancialPlanner() {
  const [rawData, setRawData] = useState("")
  const [transactions, setTransactions] = useState<{ id: string; description: string; amount: number; category: string }[]>([])
  const [categories, setCategories] = useState<{ name: string; total: number; percentage: number }[]>([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [insight, setInsight] = useState("")
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: string; income: number; expenses: number }[]>([])
  const [unknownTransactions, setUnknownTransactions] = useState<{ id: string; description: string; amount: number; category: string }[]>([])

  const parseAmount = (amountStr: string): number => {
    const isIncome = amountStr.startsWith('+')
    const cleanedStr = amountStr.replace(/[^0-9.k]/g, '').toLowerCase()
    let amount = cleanedStr.endsWith('k') 
      ? parseFloat(cleanedStr.slice(0, -1)) * 1000 
      : parseFloat(cleanedStr)
    return isIncome ? amount : -amount
  }

  const categorizeTransaction = (description: string): string => {
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes("dinner") || lowerDesc.includes("lunch") || lowerDesc.includes("breakfast")) return "Food"
    if (lowerDesc.includes("drinks") || lowerDesc.includes("bar")) return "Drinks"
    if (lowerDesc.includes("dime") || lowerDesc.includes("stock")) return "Investments"
    if (lowerDesc.includes("binance") || lowerDesc.includes("crypto")) return "Crypto"
    if (lowerDesc.includes("gambl") || lowerDesc.includes("bet") || lowerDesc.includes("casino")) return "Gambling"
    if (lowerDesc.includes("shop") || lowerDesc.includes("store") || lowerDesc.includes("mall") || lowerDesc.includes("pants")) return "Shopping"
    if (lowerDesc.includes("movie") || lowerDesc.includes("game") || lowerDesc.includes("entertainment") || lowerDesc.includes("concert") || lowerDesc.includes("weedzilla")) return "Recreation"
    if (lowerDesc.includes("travel") || lowerDesc.includes("hotel") || lowerDesc.includes("flight")) return "Travel"
    return "Other"
  }

  const processRawData = () => {
    const lines = rawData.split('\n')
    const newTransactions: { id: string; description: string; amount: number; category: string }[] = []
    const newUnknownTransactions: { id: string; description: string; amount: number; category: string }[] = []

    lines.forEach((line, index) => {
      const parts = line.trim().split(' ')
      if (parts.length >= 2) {
        const amountStr = parts[0]
        const description = parts.slice(1).join(' ')
        const amount = parseAmount(amountStr)
        const category = amount > 0 ? "Income" : categorizeTransaction(description)
        const transaction = { id: `transaction-${index}`, description, amount, category }
        newTransactions.push(transaction)
        if (category === "Other") {
          newUnknownTransactions.push(transaction)
        }
      }
    })

    setTransactions(newTransactions)
    setUnknownTransactions(newUnknownTransactions)
    analyzeData(newTransactions)
  }

  const analyzeData = (data: { id: string; description: string; amount: number; category: string }[]) => {
    const categoryTotals: { [key: string]: number } = {}
    let incomeTotal = 0
    let expensesTotal = 0

    data.forEach(transaction => {
      if (transaction.amount > 0) {
        incomeTotal += transaction.amount
      } else {
        expensesTotal += Math.abs(transaction.amount)
        categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + Math.abs(transaction.amount)
      }
    })

    const newCategories: { name: string; total: number; percentage: number }[] = Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
      percentage: expensesTotal > 0 ? (total / expensesTotal) * 100 : 0
    }))

    setCategories(newCategories)
    setTotalIncome(incomeTotal)
    setTotalExpenses(expensesTotal)

    // Generate insight
    let insightText = ""
    if (newCategories.length > 0) {
      const highestCategory = newCategories.reduce((prev, current) => 
        (prev.total > current.total) ? prev : current
      )
      insightText = `Your highest spending category is ${highestCategory.name}, accounting for ${highestCategory.percentage.toFixed(2)}% of your total expenses. `
    } else {
      insightText = "You don't have any expenses recorded. "
    }
    
    insightText += incomeTotal > expensesTotal 
      ? "Good job! You're saving money this period." 
      : "You might want to consider reducing your expenses to save more."
    
    setInsight(insightText)

    // Generate mock monthly trend data
    const mockTrend = [
      { month: "Jan", income: incomeTotal * 0.9, expenses: expensesTotal * 0.8 },
      { month: "Feb", income: incomeTotal * 0.95, expenses: expensesTotal * 0.9 },
      { month: "Mar", income: incomeTotal * 1.0, expenses: expensesTotal * 1.0 },
      { month: "Apr", income: incomeTotal * 1.05, expenses: expensesTotal * 1.1 },
    ]
    setMonthlyTrend(mockTrend)
  }

  const updateCategory = (transactionId: string, newCategory: string) => {
    setTransactions(prevTransactions => 
      prevTransactions.map(t => 
        t.id === transactionId ? { ...t, category: newCategory } : t
      )
    )
    setUnknownTransactions(prevUnknown => prevUnknown.filter(t => t.id !== transactionId))
  }

  useEffect(() => {
    analyzeData(transactions)
  }, [transactions])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Financial Planner</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Raw Financial Data</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Paste your raw financial data here. Format: amount description (e.g., '10k dinner' or '+20k freelance')"
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
            rows={10}
            className="mb-4"
          />
          <Button onClick={processRawData}>Process Data</Button>
        </CardContent>
      </Card>

      {transactions.length > 0 && (
        <Tabs defaultValue="summary" className="mt-6">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="insight">AI Insight</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Total Income: {totalIncome.toFixed(2)} THB</p>
                <p>Total Expenses: {totalExpenses.toFixed(2)} THB</p>
                <p>Net: {(totalIncome - totalExpenses).toFixed(2)} THB</p>
                <p>Savings Rate: {totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0}%</p>
              </CardContent>
            </Card>

            {unknownTransactions.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Categorization Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">Please help us categorize the following transactions:</p>
                  {unknownTransactions.map((transaction) => (
                    <div key={transaction.id} className="mb-4">
                      <p className="font-semibold">{transaction.description} ({transaction.amount.toFixed(2)} THB)</p>
                      <div className="flex space-x-4 mt-2">
                        {['Recreation', 'Shopping', 'Food'].map((suggestedCategory, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${transaction.id}-${suggestedCategory}`}
                              onCheckedChange={() => updateCategory(transaction.id, suggestedCategory)}
                            />
                            <Label
                              htmlFor={`${transaction.id}-${suggestedCategory}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {suggestedCategory}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount (THB)</TableHead>
                      <TableHead>Category</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.description}</TableCell>
                        <TableCell>{t.amount.toFixed(2)}</TableCell>
                        <TableCell>{t.category}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Category</TableHead>
                        <TableHead>Total (THB)</TableHead>
                        <TableHead>Percentage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((category) => (
                        <TableRow key={category.name}>
                          <TableCell>{category.name}</TableCell>
                          <TableCell>{category.total.toFixed(2)}</TableCell>
                          <TableCell>{category.percentage.toFixed(2)}%</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>No expense categories to display.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="charts">
            <Card>
              <CardHeader>
                <CardTitle>Expense Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {categories.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categories}
                        dataKey="total"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        label
                      >
                        {categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>No expense data to display in the chart.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insight">
            <Card>
              <CardHeader>
                <CardTitle>AI Insight</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{insight}</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="income" fill="#8884d8" name="Income" />
                    <Bar dataKey="expenses" fill="#82ca9d" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
