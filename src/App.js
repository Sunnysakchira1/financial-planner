"use client"

import React, { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#a4de6c', '#d0ed57', '#ffc658']

export default function FinancialPlanner() {
  const [rawData, setRawData] = useState("")
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [totalIncome, setTotalIncome] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [insight, setInsight] = useState("")
  const [monthlyTrend, setMonthlyTrend] = useState([])
  const [unknownTransactions, setUnknownTransactions] = useState([])

  const parseAmount = (amountStr) => {
    const isIncome = amountStr.startsWith('+')
    const cleanedStr = amountStr.replace(/[^0-9.k]/g, '').toLowerCase()
    let amount = cleanedStr.endsWith('k') 
      ? parseFloat(cleanedStr.slice(0, -1)) * 1000 
      : parseFloat(cleanedStr)
    return isIncome ? amount : -amount
  }

  const categorizeTransaction = (description) => {
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
    const newTransactions = []
    const newUnknownTransactions = []

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

  const analyzeData = (data) => {
    const categoryTotals = {}
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

    const newCategories = Object.entries(categoryTotals).map(([name, total]) => ({
      name,
      total,
      percentage: expensesTotal > 0 ? (total / expensesTotal) * 100 : 0
    }))

    setCategories(newCategories)
    setTotalIncome(incomeTotal)
    setTotalExpenses(expensesTotal)

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

    const mockTrend = [
      { month: "Jan", income: incomeTotal * 0.9, expenses: expensesTotal * 0.8 },
      { month: "Feb", income: incomeTotal * 0.95, expenses: expensesTotal * 0.9 },
      { month: "Mar", income: incomeTotal * 1.0, expenses: expensesTotal * 1.0 },
      { month: "Apr", income: incomeTotal * 1.05, expenses: expensesTotal * 1.1 },
    ]
    setMonthlyTrend(mockTrend)
  }

  const updateCategory = (transactionId, newCategory) => {
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
      <div className="mb-6">
        <h2>Enter Raw Financial Data</h2>
        <textarea
          placeholder="Paste your raw financial data here. Format: amount description (e.g., '10k dinner' or '+20k freelance')"
          value={rawData}
          onChange={(e) => setRawData(e.target.value)}
          rows={10}
          className="w-full p-2 border rounded"
        />
        <button onClick={processRawData} className="mt-2 p-2 bg-blue-500 text-white rounded">Process Data</button>
      </div>

      {transactions.length > 0 && (
        <div>
          <h2>Financial Summary</h2>
          <p>Total Income: {totalIncome.toFixed(2)} THB</p>
          <p>Total Expenses: {totalExpenses.toFixed(2)} THB</p>
          <p>Net: {(totalIncome - totalExpenses).toFixed(2)} THB</p>
          <p>Savings Rate: {totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0}%</p>

          <h2>Transactions</h2>
          <table className="w-full mt-4">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount (THB)</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{t.description}</td>
                  <td>{t.amount.toFixed(2)}</td>
                  <td>{t.category}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Spending by Category</h2>
          <table className="w-full mt-4">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total (THB)</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.name}>
                  <td>{category.name}</td>
                  <td>{category.total.toFixed(2)}</td>
                  <td>{category.percentage.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>Expense Distribution</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
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
          </div>

          <h2>AI Insight</h2>
          <p>{insight}</p>

          <h2>Monthly Trends</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
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
          </div>
        </div>
      )}
    </div>
  )
}
