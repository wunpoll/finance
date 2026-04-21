import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Plus,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Trash,
  Pencil,
} from "lucide-react";
import { supabase } from "./supabase";

const months = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const years = [2024, 2025, 2026, 2027];

const colors = ["#34d399", "#60a5fa", "#f87171", "#fbbf24", "#a78bfa"];

function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-zinc-900/70 border border-zinc-800 rounded-2xl shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-xl transition active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-white outline-none focus:border-emerald-500"
    />
  );
}

function Section({ title, icon: Icon, total, children }) {
  return (
    <Card>
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Icon className="w-5 h-5 text-emerald-400" />
            {title}
          </div>
          <div className="font-bold text-xl">{total}</div>
        </div>
        {children}
      </div>
    </Card>
  );
}

function ListManager({
  type,
  items,
  refresh,
  label,
  month,
  year,
}) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [editId, setEditId] = useState(null);

  const reset = () => {
    setName("");
    setAmount("");
    setEditId(null);
  };

  async function saveItem() {
    if (!name || !amount) return;

    if (editId) {
      await supabase
        .from("finance_items")
        .update({
          name,
          amount: Number(amount),
        })
        .eq("id", editId);
    } else {
      await supabase.from("finance_items").insert({
        type,
        name,
        amount: Number(amount),
        month,
        year,
      });
    }

    reset();
    refresh();
  }

  async function removeItem(id) {
    await supabase.from("finance_items").delete().eq("id", id);
    refresh();
  }

  function editItem(item) {
    setName(item.name);
    setAmount(item.amount);
    setEditId(item.id);
  }

  const current = items.filter(
    (x) => x.month === month && x.year === year
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Input
          placeholder={label}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="number"
          placeholder="Сумма"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />

        <Button
          onClick={saveItem}
          className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {editId ? "Сохранить" : "Добавить"}
        </Button>
      </div>

      <div className="space-y-2 max-h-[260px] overflow-y-auto">
        {current.map((item) => (
          <div
            key={item.id}
            className="bg-zinc-800 rounded-xl p-3 flex justify-between items-center"
          >
            <div className="min-w-0">
              <div className="truncate font-medium">{item.name}</div>
              <div className="text-sm text-zinc-400">{item.amount}</div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => editItem(item)}
                className="bg-zinc-700 hover:bg-zinc-600"
              >
                <Pencil className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => removeItem(item.id)}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [capital, setCapital] = useState([]);

  const [tab, setTab] = useState("income");

  async function loadData() {
    const { data } = await supabase
      .from("finance_items")
      .select("*")
      .order("created_at", { ascending: false });

    const rows = data || [];

    setIncome(rows.filter((x) => x.type === "income"));
    setExpenses(rows.filter((x) => x.type === "expenses"));
    setDebts(rows.filter((x) => x.type === "debts"));
    setCapital(rows.filter((x) => x.type === "capital"));
  }

  useEffect(() => {
    loadData();
  }, []);

  const sum = (arr) =>
    arr.reduce((acc, item) => acc + Number(item.amount), 0);

  const filterPeriod = (arr) =>
    arr.filter(
      (x) =>
        x.month === selectedMonth &&
        x.year === selectedYear
    );

  const incomeM = filterPeriod(income);
  const expensesM = filterPeriod(expenses);
  const debtsM = filterPeriod(debts);
  const capitalM = filterPeriod(capital);

  const totals = useMemo(
    () => ({
      income: sum(incomeM),
      expenses: sum(expensesM),
      debts: sum(debtsM),
      capital: sum(capitalM),
    }),
    [income, expenses, debts, capital, selectedMonth, selectedYear]
  );

  const net =
    totals.income +
    totals.capital -
    totals.expenses -
    totals.debts;

  const compareData = [
    { name: "Доходы", value: totals.income },
    { name: "Расходы", value: totals.expenses },
    { name: "Долги", value: totals.debts },
  ];

  const tabs = [
    { id: "income", label: "Доходы" },
    { id: "expenses", label: "Расходы" },
    { id: "debts", label: "Долги" },
    { id: "capital", label: "Капитал" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-white p-3 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-5"
      >
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <h1 className="text-2xl md:text-3xl font-bold">
            Финансовый дашборд
          </h1>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) =>
                setSelectedMonth(Number(e.target.value))
              }
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) =>
                setSelectedYear(Number(e.target.value))
              }
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2"
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <div className="bg-emerald-500/10 text-emerald-300 rounded-xl flex items-center justify-center px-2">
              {net}
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData}>
                <XAxis dataKey="name" stroke="#e5e7eb" />
                <YAxis stroke="#e5e7eb" />
                <Tooltip />
                <Bar dataKey="value">
                  {compareData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={colors[i]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="h-72 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expensesM}
                  dataKey="amount"
                  nameKey="name"
                  outerRadius={90}
                  label={({ name }) => name}
                >
                  {expensesM.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        colors[i % colors.length]
                      }
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl py-2 text-sm ${
                tab === t.id
                  ? "bg-emerald-500 text-black font-semibold"
                  : "bg-zinc-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "income" && (
          <Section
            title="Доходы"
            icon={TrendingUp}
            total={totals.income}
          >
            <ListManager
              type="income"
              items={income}
              refresh={loadData}
              label="Доход"
              month={selectedMonth}
              year={selectedYear}
            />
          </Section>
        )}

        {tab === "expenses" && (
          <Section
            title="Расходы"
            icon={TrendingDown}
            total={totals.expenses}
          >
            <ListManager
              type="expenses"
              items={expenses}
              refresh={loadData}
              label="Расход"
              month={selectedMonth}
              year={selectedYear}
            />
          </Section>
        )}

        {tab === "debts" && (
          <Section
            title="Долги"
            icon={CreditCard}
            total={totals.debts}
          >
            <ListManager
              type="debts"
              items={debts}
              refresh={loadData}
              label="Долг"
              month={selectedMonth}
              year={selectedYear}
            />
          </Section>
        )}

        {tab === "capital" && (
          <Section
            title="Капитал"
            icon={Wallet}
            total={totals.capital}
          >
            <ListManager
              type="capital"
              items={capital}
              refresh={loadData}
              label="Актив"
              month={selectedMonth}
              year={selectedYear}
            />
          </Section>
        )}
      </motion.div>
    </div>
  );
}
