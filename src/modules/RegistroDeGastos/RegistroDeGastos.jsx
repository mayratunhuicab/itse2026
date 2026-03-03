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

const darkTheme = {
  container: 'bg-[#0f172a]',
  card: 'bg-[#1e293b]/80 border-[#334155] backdrop-blur-xl',
  itemCard: 'bg-[#1e293b]/50 border-[#334155] hover:border-blue-500/50 shadow-blue-900/10',
  title: 'text-[#f8fafc]',
  description: 'text-[#cbd5e1]',
  label: 'text-[#cbd5e1]',
  inputBg: 'bg-[#0f172a]/50',
  inputBorder: 'border-[#334155]',
  inputRing: 'focus:ring-blue-500/20',
  inputFocusBorder: 'focus:border-blue-500/50',
  inputText: 'text-[#ffffff]',
  itemText: 'text-[#ffffff]',
  link: 'text-blue-400 hover:text-blue-300',
  modalCard: 'bg-[#0f172a] shadow-blue-900/40',
  modalBorder: 'border-[#334155]',
  modalHeader: 'bg-[#1e293b]',
  modalHeaderBorder: 'border-[#334155]',
  modalIconBg: 'bg-blue-500/20',
  modalIconColor: 'text-blue-200',
  sidebarBg: 'bg-[#1e293b]/30',
  sidebarBorder: 'border-[#334155]/50'
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
    <div className="space-y-4 mb-8 bg-[#1e293b]/80 p-6 rounded-3xl shadow-xl shadow-blue-900/10 border border-[#334155] backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex bg-[#0f172a]/50 p-1.5 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar border border-[#334155]/30">
          {['Todos', 'Hoy', 'Esta Semana', 'Este Mes'].map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${timeFilter === f
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-500/50'
                : 'text-[#cbd5e1] hover:text-[#ffffff] hover:bg-white/5'
                }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#cbd5e1] w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por concepto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0f172a]/50 border border-[#334155] rounded-2xl text-sm text-[#ffffff] placeholder-[#94a3b8] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#cbd5e1] w-4 h-4" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#0f172a]/50 border border-[#334155] rounded-2xl text-sm text-[#ffffff] focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="Todas" className="bg-[#1e293b]">Todas las categorías</option>
              {fields.find(f => f.name === 'categoria').options.map(opt => (
                <option key={opt} value={opt} className="bg-[#1e293b]">{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummary = (allItems, theme = {}) => {
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
        <div className="summary-card summary-card-blue bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden group transition-all duration-300">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform text-white">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-white/80 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Inversión Hoy</p>
            <h3 className="text-3xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              <CountUp value={totalHoy} />
            </h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md font-bold border border-white/10 shadow-sm">
              <Clock size={12} className="drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
              <span>Sincronizado</span>
            </div>
          </div>
        </div>

        <div className={`summary-card summary-card-emerald ${theme.card || 'bg-white border-slate-100'} rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all border`}>
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-300 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-500/20">
            <Wallet size={28} className="drop-shadow-[0_0_8px_rgba(110,231,183,0.5)]" />
          </div>
          <div>
            <p className={`${theme.description || 'text-slate-400'} text-[10px] font-black uppercase tracking-widest`}>Total {timeFilter === 'Todos' ? 'Acumulado' : timeFilter}</p>
            <h3 className={`text-2xl font-black ${theme.title || 'text-slate-800'} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
              <CountUp value={totalPeriodo} />
            </h3>
          </div>
        </div>

        <div className={`summary-card summary-card-violet ${theme.card || 'bg-white border-slate-100'} rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all border`}>
          <div className="w-14 h-14 bg-violet-500/10 text-violet-300 rounded-2xl flex items-center justify-center shadow-inner border border-violet-500/20">
            <Tag size={28} className="drop-shadow-[0_0_8px_rgba(196,181,253,0.5)]" />
          </div>
          <div className="overflow-hidden">
            <p className={`${theme.description || 'text-slate-400'} text-[10px] font-black uppercase tracking-widest`}>Último Gasto</p>
            <h3 className={`text-xl font-black ${theme.title || 'text-slate-700'} truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
              {filteredItems[0]?.content.concepto || 'Sin registros'}
            </h3>
          </div>
        </div>

        <div className={`summary-card ${theme.card || 'bg-white border-slate-100'} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all border flex flex-col items-center`}>
          <p className={`${theme.description || 'text-slate-400'} text-[10px] font-black uppercase tracking-widest mb-4 self-start flex items-center gap-3`}>
            <PieIcon size={14} className="text-blue-500" />
            Distribución
          </p>
          <div className="w-full h-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={8}
                  dataKey="value"
                  animationBegin={0}
                  animationDuration={800}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="hover:opacity-80 transition-opacity outline-none cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [`$${Number(value).toLocaleString('es-ES', { minimumFractionDigits: 2 })}`, `${CATEGORY_EMOJIS[name] || '💰'} ${name}`]}
                  contentStyle={{
                    borderRadius: '20px',
                    border: '1px solid #334155',
                    backgroundColor: '#1E293B',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                    padding: '16px',
                    color: '#F8FAFC'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {chartData.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 mt-4 w-full">
              {chartData.map((entry, index) => {
                const color = COLORS[index % COLORS.length];
                return (
                  <div key={entry.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 transition-all hover:scale-105 bg-white/5 backdrop-blur-sm" style={{ borderColor: `${color}40`, boxShadow: `0 0 10px ${color}15` }}>
                    <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_10px] shadow-current" style={{ backgroundColor: color, color: color }}></div>
                    <span className="text-[10px] font-black uppercase tracking-tight" style={{ color: color, textShadow: `0 0 8px ${color}40` }}>
                      {entry.name}: ${entry.value.toLocaleString('es-ES', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-4 ${theme.description || 'text-slate-300'} gap-2 opacity-60`}>
              <span className="text-2xl">📭</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Sin datos</p>
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
      theme={darkTheme}
    />
  );
}

export default RegistroDeGastos;
