import { useState } from 'react';
import { TrendingUp, Wallet, Tag, Clock, Search, Filter } from 'lucide-react';
import ModuleTemplate from '../../components/ModuleTemplate';

const fields = [
  { name: 'concepto', label: '📝 Concepto', type: 'text', required: true },
  { name: 'monto', label: '💰 Monto', type: 'number', required: true },
  { name: 'fecha', label: '📅 Fecha', type: 'date', required: true },
  { name: 'categoria', label: '🏷️ Categoría', type: 'select', options: ['Alimentación', 'Transporte', 'Material Escolar', 'Libros', 'Otro'], required: true },
];

function RegistroDeGastos() {
  const [timeFilter, setTimeFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Lógica de filtrado que se pasará al ModuleTemplate
  const filterFn = (item) => {
    // 1. Filtro de Búsqueda (por concepto)
    const matchesSearch = item.content.concepto?.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Filtro de Categoría
    const matchesCategory = categoryFilter === 'Todas' || item.content.categoria === categoryFilter;

    // 3. Filtro de Tiempo (comparando created_at)
    const now = new Date();
    const createdAt = new Date(item.created_at);
    let matchesTime = true;

    if (timeFilter === 'Hoy') {
      matchesTime = createdAt.toDateString() === now.toDateString();
    } else if (timeFilter === 'Esta Semana') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      matchesTime = createdAt >= lastWeek;
    } else if (timeFilter === 'Este Mes') {
      matchesTime = createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesCategory && matchesTime;
  };

  const renderFilters = () => (
    <div className="space-y-4 mb-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        {/* Pestañas de Tiempo */}
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

        {/* Buscador y Categoría */}
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
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSummary = (items) => {
    const totalHoy = items
      .filter(i => new Date(i.created_at).toDateString() === new Date().toDateString())
      .reduce((acc, curr) => acc + Number(curr.content.monto || 0), 0);
    const totalMes = items.reduce((acc, curr) => acc + Number(curr.content.monto || 0), 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-6 text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">Inversión Hoy</p>
            <h3 className="text-3xl font-black">${totalHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] bg-white/20 w-fit px-2 py-1 rounded-full backdrop-blur-sm">
              <Clock size={12} />
              <span>Sincronizado</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Wallet size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Total Acumulado</p>
            <h3 className="text-2xl font-black text-slate-800">${totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center shadow-inner">
            <Tag size={28} />
          </div>
          <div>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Último Gasto</p>
            <h3 className="text-xl font-bold text-slate-700 truncate max-w-[150px]">
              {items[0]?.content.concepto || 'Sin registros'}
            </h3>
          </div>
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
      formColumns={2}
      gridColumns={2}
    />
  );
}

export default RegistroDeGastos;
