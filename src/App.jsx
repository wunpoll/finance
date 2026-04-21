import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";
import { Plus, Trash2 } from "lucide-react";

const months = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const years = [2024, 2025, 2026];

const colors = ["#34d399","#60a5fa","#f87171","#fbbf24","#a78bfa"];

export default function App() {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());

  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [name, setName] = useState("");
  const [sum, setSum] = useState("");

  const addExpense = () => {
    if (!name || !sum) return;
    setExpenses([...expenses, { name, amount: +sum, month, year }]);
    setName("");
    setSum("");
  };

  const filteredExpenses = expenses.filter(i => i.month === month && i.year === year);
  const totalExpenses = filteredExpenses.reduce((a,b)=>a+b.amount,0);

  const chartData = [
    { name: "Доходы", value: income.reduce((a,b)=>a+b.amount,0) },
    { name: "Расходы", value: totalExpenses }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-4">
      <motion.div
        initial={{opacity:0,y:20}}
        animate={{opacity:1,y:0}}
        className="max-w-5xl mx-auto space-y-6"
      >
        <h1 className="text-3xl font-bold">Финансы</h1>

        <div className="grid grid-cols-2 gap-2">
          <select value={month} onChange={e=>setMonth(+e.target.value)} className="bg-zinc-900 p-2 rounded-xl">
            {months.map((m,i)=><option key={i} value={i}>{m}</option>)}
          </select>

          <select value={year} onChange={e=>setYear(+e.target.value)} className="bg-zinc-900 p-2 rounded-xl">
            {years.map(y=><option key={y}>{y}</option>)}
          </select>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-zinc-900 p-4 rounded-2xl h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#fff" />
                <YAxis stroke="#fff" />
                <Tooltip />
                <Bar dataKey="value">
                  {chartData.map((_,i)=><Cell key={i} fill={colors[i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-zinc-900 p-4 rounded-2xl h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={filteredExpenses} dataKey="amount" nameKey="name" label>
                  {filteredExpenses.map((_,i)=><Cell key={i} fill={colors[i%colors.length]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 p-4 rounded-2xl space-y-3">
          <h2 className="text-xl font-semibold">Добавить расход</h2>

          <input
            className="w-full p-2 rounded-xl bg-zinc-800"
            placeholder="Название"
            value={name}
            onChange={e=>setName(e.target.value)}
          />

          <input
            className="w-full p-2 rounded-xl bg-zinc-800"
            placeholder="Сумма"
            type="number"
            value={sum}
            onChange={e=>setSum(e.target.value)}
          />

          <button
            onClick={addExpense}
            className="bg-emerald-500 text-black px-4 py-2 rounded-xl flex items-center gap-2"
          >
            <Plus size={18}/> Добавить
          </button>

          {filteredExpenses.map((item,i)=>(
            <div key={i} className="flex justify-between bg-zinc-800 p-2 rounded-xl">
              <span>{item.name}</span>
              <span>{item.amount}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
