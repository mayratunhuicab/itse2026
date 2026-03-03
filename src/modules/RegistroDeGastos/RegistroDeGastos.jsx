import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp, Wallet, Tag, Clock, Search, Filter,
  PieChart as PieIcon, ArrowLeft, Plus, Edit,
  Trash2, Save, X, AlertCircle, CheckCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '../../supabaseClient';
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

  return <span>${displayValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>;
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
  modalIconBg: 'bg-blue-50/10',
  modalIconColor: 'text-blue-200',
  sidebarBg: 'bg-[#1e293b]/30',
  sidebarBorder: 'border-[#334155]/50'
};

function RegistroDeGastos() {
  const moduleName = "Historial de Gastos";
  const moduleOwner = "RegistroDeGastos";
  const useModal = true;
  const layout = "sidebar";
  const formColumns = 2;
  const gridColumns = 2;
  const theme = darkTheme;
  const locale = "es-MX";

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [timeFilter, setTimeFilter] = useState('Todos');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (successMsg) {
      const t = setTimeout(() => setSuccessMsg(null), 3000);
      return () => clearTimeout(t);
    }
  }, [successMsg]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from('student_modules')
        .select('*')
        .eq('module_owner', moduleOwner)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching data:', error.message);
      setErrorMsg('Error al cargar datos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const addData = async (content) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('student_modules')
        .insert([{ module_owner: moduleOwner, content }])
        .select();

      if (error) throw error;
      if (data && data[0]) {
        setItems(prev => [data[0], ...prev]);
        setSuccessMsg('¡Registro guardado correctamente!');
        resetForm();
      }
    } catch (error) {
      console.error('Error adding data:', error.message);
      setErrorMsg('Error al guardar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateData = async (id, content) => {
    setSaving(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('student_modules')
        .update({ content })
        .eq('id', id);

      if (error) throw error;
      setItems(items.map(item => item.id === id ? { ...item, content } : item));
      setSuccessMsg('¡Registro actualizado correctamente!');
      resetForm();
    } catch (error) {
      console.error('Error updating data:', error.message);
      setErrorMsg('Error al actualizar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteData = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este elemento?')) return;
    setErrorMsg(null);
    try {
      const { error } = await supabase
        .from('student_modules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setItems(items.filter(item => item.id !== id));
      setSuccessMsg('Registro eliminado.');
    } catch (error) {
      console.error('Error deleting data:', error.message);
      setErrorMsg('Error al eliminar: ' + error.message);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingItem(null);
    const defaults = {};
    fields.forEach(f => { if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue; });
    setFormData(defaults);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.monto !== undefined && Number(formData.monto) < 1) {
      setErrorMsg('¡El monto debe ser mayor a 0! 💰');
      return;
    }
    if (editingItem) {
      updateData(editingItem.id, formData);
    } else {
      addData(formData);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item.content);
    setShowForm(true);
  };

  const handleInputChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });
  };

  // Lógica de filtrado centralizada
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.content.concepto?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || item.content.categoria === categoryFilter;

      const now = new Date();
      const createdAt = new Date(item.created_at);
      let matchesTime = true;

      if (timeFilter === 'Hoy') {
        matchesTime = createdAt.toDateString() === now.toDateString();
      } else if (timeFilter === 'Esta Semana') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        sevenDaysAgo.setHours(0, 0, 0, 0);
        matchesTime = createdAt >= sevenDaysAgo;
      } else if (timeFilter === 'Este Mes') {
        matchesTime = createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesCategory && matchesTime;
    });
  }, [items, searchQuery, categoryFilter, timeFilter]);

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

  const renderSummary = () => {
    const chartData = (() => {
      const groups = filteredItems.reduce((acc, item) => {
        const cat = item.content.categoria || 'Otro';
        const monto = Number(item.content.monto || 0);
        acc[cat] = (acc[cat] || 0) + monto;
        return acc;
      }, {});

      return Object.entries(groups).map(([name, value]) => ({ name, value }));
    })();

    const totalHoy = items
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

        <div className={`summary-card summary-card-emerald ${theme.card || ''} rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all border`}>
          <div className="w-14 h-14 bg-emerald-500/10 text-emerald-300 rounded-2xl flex items-center justify-center shadow-inner border border-emerald-500/20">
            <Wallet size={28} className="drop-shadow-[0_0_8px_rgba(110,231,183,0.5)]" />
          </div>
          <div>
            <p className={`${theme.description || ''} text-[10px] font-black uppercase tracking-widest`}>Total {timeFilter === 'Todos' ? 'Acumulado' : timeFilter}</p>
            <h3 className={`text-2xl font-black ${theme.title || ''} drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
              <CountUp value={totalPeriodo} />
            </h3>
          </div>
        </div>

        <div className={`summary-card summary-card-violet ${theme.card || ''} rounded-3xl p-6 shadow-sm flex items-center gap-5 hover:shadow-md transition-all border`}>
          <div className="w-14 h-14 bg-violet-500/10 text-violet-300 rounded-2xl flex items-center justify-center shadow-inner border border-violet-500/20">
            <Tag size={28} className="drop-shadow-[0_0_8px_rgba(196,181,253,0.5)]" />
          </div>
          <div className="overflow-hidden">
            <p className={`${theme.description || ''} text-[10px] font-black uppercase tracking-widest`}>Último Gasto</p>
            <h3 className={`text-xl font-black ${theme.title || ''} truncate drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]`}>
              {filteredItems[0]?.content.concepto || 'Sin registros'}
            </h3>
          </div>
        </div>

        <div className={`summary-card ${theme.card || ''} rounded-3xl p-5 shadow-sm hover:shadow-md transition-all border flex flex-col items-center`}>
          <p className={`${theme.description || ''} text-[10px] font-black uppercase tracking-widest mb-4 self-start flex items-center gap-3`}>
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
                  formatter={(value) => [`$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 'Gasto']}
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
                      {entry.name}: ${entry.value.toLocaleString('es-MX', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={`flex flex-col items-center justify-center py-4 ${theme.description || ''} gap-2 opacity-60`}>
              <span className="text-2xl">📭</span>
              <p className="text-[10px] font-black uppercase tracking-widest">Sin datos</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const isRLSError = errorMsg && (
    errorMsg.includes('row-level') || errorMsg.includes('violates') || errorMsg.includes('42501')
  );

  return (
    <div className={`min-h-screen ${theme.container || 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">

        <div className="mb-6">
          <Link to="/" className={`inline-flex items-center ${theme.link || 'text-blue-600 hover:text-blue-800'} mb-4 transition-colors`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className={`text-4xl font-extrabold ${theme.title || 'text-slate-800'} tracking-tight`}>{moduleName}</h1>
              <p className={`${theme.description || 'text-slate-500'} text-sm`}>Gestiona tus registros de {moduleName.toLowerCase()} de forma eficiente</p>
            </div>
            <button
              onClick={() => {
                if (!showForm) {
                  const defaults = {};
                  fields.forEach(f => { if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue; });
                  setFormData(defaults);
                }
                setShowForm(!showForm);
                setEditingItem(null);
                setErrorMsg(null);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg transition-all transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 mr-2" />
              {'Agregar Nuevo'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Ocurrió un error</p>
                <p className="text-sm mt-1 font-mono bg-red-100 rounded p-1">{errorMsg}</p>
                {isRLSError && (
                  <div className="mt-3 text-sm bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-900">
                    <p className="font-semibold mb-1">💡 Solución — Row Level Security (RLS):</p>
                    <p>La tabla tiene RLS activado. Verifica tus políticas en Supabase.</p>
                  </div>
                )}
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-600 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-300 text-green-800 rounded-lg px-4 py-3 animate-in fade-in slide-in-from-top-4">
            <CheckCircle className="w-5 h-5 flex-shrink-0 text-green-500" />
            <p>{successMsg}</p>
          </div>
        )}

        {showForm && useModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={resetForm} />
            <div className={`relative ${theme.modalCard || 'bg-white'} w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border ${theme.modalBorder || 'border-slate-200'}`}>
              <div className={`${theme.modalHeader || 'bg-slate-50'} px-8 py-6 border-b ${theme.modalHeaderBorder || 'border-slate-100'} flex justify-between items-center`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${theme.modalIconBg || ''} ${theme.modalIconColor || ''}`}>
                    {editingItem ? <Edit size={20} /> : <Plus size={20} />}
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${theme.title || ''}`}>
                      {editingItem ? 'Editar' : 'Nuevo'} Gasto
                    </h2>
                    <p className={`text-xs ${theme.description || ''}`}>Completa los campos para continuar</p>
                  </div>
                </div>
                <button onClick={resetForm} className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8">
                <div className={`grid grid-cols-1 md:grid-cols-${formColumns} gap-6 mb-8`}>
                  {fields.map((field) => (
                    <div key={field.name} className="flex flex-col space-y-2">
                      <label className={`text-sm font-bold ${theme.label || ''} flex items-center gap-2`}>
                        {field.label}
                        {field.required && <span className="text-emerald-500">*</span>}
                      </label>
                      {field.type === 'select' ? (
                        <select
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className={`w-full px-4 py-3 border ${theme.inputBorder || ''} rounded-xl focus:outline-none focus:ring-4 ${theme.inputRing || ''} ${theme.inputFocusBorder || ''} transition-all ${theme.inputBg || ''} ${theme.inputText || ''} appearance-none`}
                          required={field.required}
                        >
                          <option value="" className="bg-[#1e293b]">Seleccionar...</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option} className="bg-[#1e293b]">{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleInputChange(field.name, e.target.value)}
                          className={`w-full px-4 py-3 border ${theme.inputBorder || ''} rounded-xl focus:outline-none focus:ring-4 ${theme.inputRing || ''} ${theme.inputFocusBorder || ''} transition-all ${theme.inputBg || ''} ${theme.inputText || ''}`}
                          required={field.required}
                          min={field.min}
                        />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`flex-1 flex items-center justify-center font-bold px-8 py-4 rounded-2xl transition-all transform hover:-translate-y-0.5 shadow-xl ${saving ? 'bg-slate-300 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95'}`}
                  >
                    {saving ? 'Guardando...' : (
                      <>
                        <Save className="w-5 h-5 mr-3" />
                        {editingItem ? 'Actualizar Registro' : 'Crear Registro'}
                      </>
                    )}
                  </button>
                  <button type="button" onClick={resetForm} disabled={saving} className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {renderFilters()}

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 w-full order-2 lg:order-1">
            <div className={`rounded-3xl border ${theme.card || ''} p-8 shadow-2xl`}>
              <div className="flex items-center justify-between mb-8">
                <h2 className={`text-2xl font-bold ${theme.title || ''}`}>Lista de {moduleName}</h2>
                <button onClick={fetchData} className={`text-sm ${theme.link || ''} hover:underline font-bold flex items-center gap-2`}>
                  <Clock size={14} />
                  Recargar
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
                  <p className="font-medium">Cargando datos del servidor...</p>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <span className="text-6xl filter grayscale opacity-50">📭</span>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-300">No se encontraron gastos</p>
                    <p className="text-sm opacity-60">Intenta cambiar los filtros o agrega un nuevo registro</p>
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-${gridColumns} gap-6`}>
                  {filteredItems.map((item) => {
                    const categoriaNormalizada = item.content.categoria?.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <div key={item.id} className={`history-card card-cat-${categoriaNormalizada} group relative ${theme.itemCard || ''} border rounded-2xl p-6 hover:shadow-2xl transition-all duration-300`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 gap-4">
                              {fields.map((field) => (
                                <div key={field.name} className="flex flex-col">
                                  <span className={`text-[10px] font-bold ${theme.description || ''} uppercase tracking-widest mb-1`}>{field.label}</span>
                                  <span className={`${theme.itemText || ''} font-bold text-lg`}>
                                    {field.type === 'number' ?
                                      `$${Number(item.content[field.name]).toLocaleString(locale, { minimumFractionDigits: 2 })}` :
                                      (item.content[field.name] || '—')
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className={`text-[10px] ${theme.description || ''} mt-6 flex items-center gap-2 font-bold`}>
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              Registrado el {new Date(item.created_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(item)} className="bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white p-2.5 rounded-xl transition-all" title="Editar">
                              <Edit size={18} />
                            </button>
                            <button onClick={() => deleteData(item.id)} className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-2.5 rounded-xl transition-all" title="Eliminar">
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <aside className={`lg:w-[320px] w-full space-y-6 sidebar-sticky order-1 lg:order-2 ${theme.sidebarBg || ''} p-6 rounded-3xl border ${theme.sidebarBorder || ''} shadow-inner`}>
            {renderSummary()}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default RegistroDeGastos;
