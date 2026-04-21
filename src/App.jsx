import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import {
  Plus, Wallet, TrendingUp, TrendingDown, CreditCard, Trash, Pencil
} from "lucide-react";
import { supabase } from "./supabase";

const months = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"
];

const years = [2024, 2025, 2026, 2027];

const COLORS = ["#34d399","#60a5fa","#f87171","#fbbf24","#a78bfa","#fb7185"];

const makeId = () => Math.random().toString(36).slice(2, 9);

function Card({ children, className = "" }) {
  return (
    <div className={`bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800/70 rounded-2xl shadow-xl shadow-black/30 ${className}`}>
      {children}
    </div>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`px-3 py-2 rounded-xl transition hover:scale-[1.02] active:scale-95 ${className}`}
    >
      {children}
    </button>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full px-3 py-2 rounded-xl bg-zinc-900/70 border border-zinc-700 text-zinc-100 outline-none focus:border-emerald-400"
    />
  );
}

function Section({ title, icon: Icon, total, children }) {
  return (
    <Card>
      <div className="p-4 md:p-5 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center font-semibold text-lg text-zinc-100">
            <Icon className="w-5 h-5 text-emerald-400" />
            <span>{title}</span>
          </div>
          <div className="text-xl font-bold text-zinc-100">{total}</div>
        </div>
        {children}
      </div>
    </Card>
  );
}

function ListManager({ type, items, refresh, label, month, year }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [editId, setEditId] = useState(null);

  const current = items.filter(x => x.month === month && x.year === year);

  async function saveItem() {
    if (!name || !amount) return;

    if (editId) {
      await supabase
        .from("finance_items")
        .update({
          name,
          amount: Number(amount)
        })
        .eq("id", editId);
    } else {
      await supabase
        .from("finance_items")
        .insert({
          id: makeId(),
          type,
          name,
          amount: Number(amount),
          month,
          year
        });
    }

    setName("");
    setAmount("");
    setEditId(null);
    refresh();
  }

  async function remove(id) {
    await supabase
      .from("finance_items")
      .delete()
      .eq("id", id);

    refresh();
  }

  function edit(it) {
    setName(it.name);
    setAmount(it.amount);
    setEditId(it.id);
  }

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

      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {current.map((it) => (
          <div
            key={it.id}
            className="flex justify-between items-center bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 text-zinc-100"
          >
            <div className="min-w-0">
              <div className="font-medium truncate">{it.name}</div>
              <div className="text-sm text-zinc-400">{it.amount}</div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => edit(it)}
                className="bg-zinc-800 text-zinc-200"
              >
                <Pencil className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => remove(it.id)}
                className="bg-red-500/20 text-red-300"
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
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [debts, setDebts] = useState([]);
  const [capital, setCapital] = useState([]);

  const [tab, setTab] = useState("income");

  async function loadData() {
    const { data } = await supabase
      .from("finance_items")
      .select("*");

    const rows = data || [];

    setIncome(rows.filter(x => x.type === "income"));
    setExpenses(rows.filter(x => x.type === "expenses"));
    setDebts(rows.filter(x => x.type === "debts"));
    setCapital(rows.filter(x => x.type === "capital"));
  }

  useEffect(() => {
    loadData();
  }, []);

  const sum = (arr) => arr.reduce((a, b) => a + Number(b.amount), 0);

  const filter = (arr) =>
    arr.filter(
      x => x.month === selectedMonth && x.year === selectedYear
    );

  const incomeM = filter(income);
  const expensesM = filter(expenses);
  const debtsM = filter(debts);
  const capitalM = filter(capital);

  const totals = useMemo(() => ({
    income: sum(incomeM),
    expenses: sum(expensesM),
    debts: sum(debtsM),
    capital: sum(capitalM),
  }), [income, expenses, debts, capital, selectedMonth, selectedYear]);

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
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-black to-zinc-950 text-zinc-100 p-3 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto space-y-5 md:space-y-6"
      >
        {/* HEADER */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl md:text-3xl font-bold">
            Финансовый дашборд 3.0
          </h1>

          <div className="grid grid-cols-3 gap-2 w-full md:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2 text-sm"
            >
              {months.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-700 rounded-xl px-2 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <div className="text-emerald-300 bg-emerald-500/10 px-2 py-2 rounded-xl text-center text-sm font-semibold">
              {net}
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <Card>
            <div className="p-3 md:p-5 h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={compareData}>
                  <XAxis dataKey="name" stroke="#e5e7eb" />
                  <YAxis stroke="#e5e7eb" />
                  <Tooltip />
                  <Bar dataKey="value">
                    {compareData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card>
            <div className="p-3 md:p-5 h-64 md:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expensesM}
                    dataKey="amount"
                    nameKey="name"
                    outerRadius={85}
                    label={({ name }) => name}
                  >
                    {expensesM.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-4 gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-xl py-2 text-sm transition ${
                tab === t.id
                  ? "bg-emerald-500 text-black font-semibold"
                  : "bg-zinc-900 text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "income" && (
          <Section title="Доходы" icon={TrendingUp} total={totals.income}>
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
          <Section title="Расходы" icon={TrendingDown} total={totals.expenses}>
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
          <Section title="Долги" icon={CreditCard} total={totals.debts}>
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
          <Section title="Капитал" icon={Wallet} total={totals.capital}>
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
