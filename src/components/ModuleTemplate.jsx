import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Plus, Edit, Trash2, Save, X, AlertCircle, CheckCircle } from 'lucide-react';

function ModuleTemplate({ moduleName, moduleOwner, fields, renderSummary, customFilters, filterFn, formColumns = 1, gridColumns = 1, useModal = false, layout = 'stacked' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  // Estado para mostrar errores y mensajes de éxito en pantalla
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Oculta el mensaje de éxito tras 3 segundos
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
      setItems([data[0], ...items]);
      setSuccessMsg('¡Registro guardado correctamente!');
      resetForm();
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

    // Validación de monto si existe en los campos
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

  const isRLSError = errorMsg && (
    errorMsg.includes('row-level') ||
    errorMsg.includes('violates') ||
    errorMsg.includes('42501') ||
    errorMsg.includes('new row') ||
    errorMsg.includes('permission')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {(renderSummary && layout !== 'sidebar') && renderSummary(items)}

        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">{moduleName}</h1>
              <p className="text-slate-500 text-sm">Gestiona tus registros de {moduleName.toLowerCase()} de forma eficiente</p>
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
              className={`${useModal ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-5 py-2.5 rounded-xl flex items-center shadow-lg transition-all transform hover:scale-105 active:scale-95`}
            >
              {showForm && !useModal ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {showForm && !useModal ? 'Cancelar' : 'Agregar Nuevo'}
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-300 text-red-800 rounded-lg px-4 py-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="font-semibold">Ocurrió un error</p>
                <p className="text-sm mt-1 font-mono bg-red-100 rounded p-1">{errorMsg}</p>
                {isRLSError && (
                  <div className="mt-3 text-sm bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-900">
                    <p className="font-semibold mb-1">💡 Solución — Row Level Security (RLS):</p>
                    <p>La tabla tiene RLS activado y bloquea operaciones sin autenticación. Ejecuta este SQL en tu panel de Supabase:</p>
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
          <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-300 text-green-800 rounded-lg px-4 py-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <p>{successMsg}</p>
          </div>
        )}

        {showForm && (
          useModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={resetForm}
              />
              <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 border border-slate-200">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl bg-emerald-100 text-emerald-600`}>
                      {editingItem ? <Edit size={20} /> : <Plus size={20} />}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">
                        {editingItem ? 'Editar' : 'Nuevo'} {moduleName.slice(0, -1)}
                      </h2>
                      <p className="text-xs text-slate-500">Completa los campos para continuar</p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8">
                  <div className={`grid grid-cols-1 md:grid-cols-${formColumns} gap-6 mb-8`}>
                    {fields.map((field) => (
                      <div key={field.name} className="flex flex-col space-y-2">
                        <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          {field.label}
                          {field.required && <span className="text-emerald-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all bg-slate-50/50"
                            rows="3"
                            required={field.required}
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all bg-slate-50/50 appearance-none"
                            required={field.required}
                          >
                            <option value="">Seleccionar...</option>
                            {field.options?.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || 'text'}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500/30 transition-all bg-slate-50/50"
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
                      disabled={saving || (formData.monto !== undefined && Number(formData.monto) < 1)}
                      className={`flex-1 flex items-center justify-center font-bold px-8 py-4 rounded-2xl transition-all transform hover:-translate-y-0.5 shadow-xl ${saving || (formData.monto !== undefined && Number(formData.monto) < 1) ? 'bg-slate-300 cursor-not-allowed shadow-none text-slate-500' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 active:scale-95'}`}
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-3" />
                          {editingItem ? 'Actualizar Registro' : 'Crear Registro'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-semibold mb-4">
                {editingItem ? 'Editar' : 'Agregar Nuevo'} {moduleName}
              </h2>
              <form onSubmit={handleSubmit}>
                {fields.map((field) => (
                  <div key={field.name} className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="4"
                        required={field.required}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={field.required}
                      >
                        <option value="">Seleccionar...</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.type || 'text'}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={field.required}
                      />
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg flex items-center transition-colors"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )
        )}

        {/* ── Filtros Personalizados ── */}
        {customFilters && (
          <div className="mb-6">
            {customFilters}
          </div>
        )}

        <div className={layout === 'sidebar' ? 'flex flex-col lg:flex-row gap-8 items-start' : ''}>
          <div className={layout === 'sidebar' ? 'flex-1 w-full order-2 lg:order-1' : ''}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Lista de {moduleName}</h2>
                <button
                  onClick={fetchData}
                  className="text-sm text-blue-600 hover:underline"
                >
                  ↻ Recargar
                </button>
              </div>

              {loading ? (
                <div className="flex items-center gap-2 text-gray-500 py-4 text-center justify-center">
                  Cargando datos...
                </div>
              ) : (filterFn ? items.filter(filterFn) : items).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-4 animate-in fade-in slide-in-from-bottom-4">
                  <span className="text-6xl filter grayscale opacity-50">📭</span>
                  <div className="text-center">
                    <p className="text-xl font-bold text-slate-600">Parece que aún no hay gastos hoy</p>
                    <p className="text-sm">Intenta cambiar el filtro o agregar un nuevo registro</p>
                  </div>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-${gridColumns} gap-6`}>
                  {(filterFn ? items.filter(filterFn) : items).map((item) => {
                    const categoriaNormalizada = item.content.categoria?.toLowerCase().replace(/\s+/g, '-');
                    return (
                      <div key={item.id} className={`history-card card-cat-${categoriaNormalizada} group relative bg-white border border-gray-100 rounded-2xl p-6 hover:shadow-2xl hover:shadow-blue-50/50 transition-all duration-300`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="grid grid-cols-1 gap-3">
                              {fields.map((field) => (
                                <div key={field.name} className="flex flex-col">
                                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-tighter">{field.label}</span>
                                  <span className="text-gray-700 font-medium text-lg">
                                    {field.type === 'number' ?
                                      `$${Number(item.content[field.name]).toLocaleString('es-ES', { minimumFractionDigits: 2 })}` :
                                      (item.content[field.name] || '—')
                                    }
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-6 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              Registrado el {new Date(item.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleEdit(item)}
                              className="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white p-2.5 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => deleteData(item.id)}
                              className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white p-2.5 rounded-xl transition-all"
                              title="Eliminar"
                            >
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

          {layout === 'sidebar' && renderSummary && (
            <aside className="lg:w-[320px] w-full space-y-6 sidebar-sticky order-1 lg:order-2 bg-slate-50/50 p-4 rounded-3xl border border-slate-100/50 shadow-inner">
              {renderSummary(items)}
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModuleTemplate;
