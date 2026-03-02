import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Wallet, Tag, Clock, Search, Filter, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import ModuleTemplate from '../../components/ModuleTemplate';
import './RegistroDeGastos.css';

// Componente para animar el conteo de números
const CountUp = ({ value, duration = 800 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = displayValue;
    const endValue = value;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = progress * (endValue - startValue) + startValue;
      setDisplayValue(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    window.requestAnimationFrame(step);
  }, [value]);

  return <span>${displayValue.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
};

const fields = [
  { name: 'concepto', label: '📝 Concepto', type: 'text', required: true },
  { name: 'monto', label: '💰 Monto', type: 'number', min: '1', required: true },
  {
    name: 'fecha',
    label: '📅 Fecha',
    type: 'date',
    defaultValue: (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })(),
    required: true
  },
  { name: 'categoria', label: '🏷️ Categoría', type: 'select', options: ['Alimentación', 'Transporte', 'Material Escolar', 'Libros', 'Otro'], required: true },
];

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];

const CATEGORY_EMOJIS = {
  'Alimentación': '🍔',
  'Transporte': '🚗',
  'Material Escolar': '📚',
  'Libros': '📖',
  'Otro': '💰'
};

function RegistroDeGastos() {
  const [timeFilter, setTimeFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Lógica de filtrado centralizada
  const filterFn = useMemo(() => (item) => {
    const matchesSearch = item.content.concepto?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || item.content.categoria === categoryFilter;

    const now = new Date();
    // Normalizar a inicio del día para comparaciones precisas si es necesario
    const createdAt = new Date(item.created_at);
    let matchesTime = true;

    if (timeFilter === 'Hoy') {
      matchesTime = createdAt.toDateString() === now.toDateString();
    } else if (timeFilter === 'Esta Semana') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0); // Desde el inicio de hace 7 días
      matchesTime = createdAt >= sevenDaysAgo;
    } else if (timeFilter === 'Este Mes') {
      matchesTime = createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory && matchesTime;
  }, [searchQuery, categoryFilter, timeFilter]);

  const renderFilters = () => (
    <div className="space-y-4 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['Todos', 'Hoy', 'Esta Semana', 'Este Mes'].map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`flex-1 lg:flex-none px-5 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${timeFilter === f
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="relative w-full sm:w-48">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Todas">Todas las categorías</option>
              {fields.find(f => f.name === 'categoria').options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummary = (allItems) => {
    const filteredItems = useMemo(() => allItems.filter(filterFn), [allItems, filterFn]);

    const chartData = useMemo(() => {
      const groups = filteredItems.reduce((acc, item) => {
        const cat = item.content.categoria || 'Otro';
        const monto = Number(item.content.monto || 0);
        acc[cat] = (acc[cat] || 0) + monto;
        return acc;
      }, {});

      return Object.entries(groups).map(([name, value]) => ({ name, value }));
    }, [filteredItems]);

    const totalHoy = allItems
      .filter(i => new Date(i.created_at).toDateString() === new Date().toDateString())
      .reduce((acc, curr) => acc + Number(curr.content.monto || 0), 0);
    const totalPeriodo = filteredItems.reduce((acc, curr) => acc + Number(curr.content.monto || 0), 0);

    return (
      <div className="flex flex-col gap-6 mb-8">
        <div className="summary-card summary-card-blue bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group transition-all duration-300">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform text-white">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Inversión Hoy</p>
            <h3 className="text-3xl font-black text-white">
              <CountUp value={totalHoy} />
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
              <Clock size={12} />
              <span>Sincronizado</span>
            </div>
          </div>
        </div>

        <div className="summary-card summary-card-emerald bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total {timeFilter === 'Todos' ? 'Acumulado' : timeFilter}</p>
            <h3 className="text-2xl font-black text-slate-800">
              <CountUp value={totalPeriodo} />
            </h3>
          </div>
        </div>

        <div className="summary-card summary-card-violet bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Tag size={28} />
          </div>
          <div className="overflow-hidden">
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Último Gasto</p>
            <h3 className="text-xl font-bold text-slate-700 truncate">
              {filteredItems[0]?.content.concepto || 'Sin registros'}
            </h3>
          </div>
        </div>

        <div className="summary-card bg-white border border-slate-100 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center">
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 self-start flex items-center gap-2">
            <PieIcon size={14} className="text-blue-500" />
            Distribución
          </p>
          <div className="w-full h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`$${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })} ${CATEGORY_EMOJIS[name] || '💰'}`, 'Monto']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {chartData.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-2 w-full">
              {chartData.map((entry, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <div key={entry.name} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-slate-100/50 transition-all hover:scale-105" style={{ backgroundColor: `${color}15` }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }}></div>
                    <span className="text-[9px] font-bold" style={{ color: color }}>
                      {entry.name}: ${entry.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })} {CATEGORY_EMOJIS[entry.name] || '💰'}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 text-slate-300 gap-1 opacity-60">
              <span className="text-xl">📭</span>
              <p className="text-[8px] font-bold uppercase">Sin datos</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <ModuleTemplate
      moduleName="Historial de Gastos"
      moduleOwner="RegistroDeGastos"
      fields={fields}
      renderSummary={renderSummary}
      customFilters={renderFilters()}
      filterFn={filterFn}
      useModal={true}
      layout="sidebar"
      formColumns={2}
      gridColumns={2}
    />
  );
}

export default RegistroDeGastos;
