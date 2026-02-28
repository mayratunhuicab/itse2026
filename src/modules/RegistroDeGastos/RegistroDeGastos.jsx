import { TrendingUp, Wallet, Tag, Clock } from 'lucide-react';
import ModuleTemplate from '../../components/ModuleTemplate';

const fields = [
  { name: 'concepto', label: '📝 Concepto', type: 'text', required: true },
  { name: 'monto', label: '💰 Monto', type: 'number', required: true },
  { name: 'fecha', label: '📅 Fecha', type: 'date', required: true },
  { name: 'categoria', label: '🏷️ Categoría', type: 'select', options: ['Alimentación', 'Transporte', 'Material Escolar', 'Libros', 'Otro'], required: true },
];

function RegistroDeGastos() {
  const renderSummary = (items) => {
    const hoy = new Date().toISOString().split('T')[0];
    const gastosHoy = items.filter(i => i.created_at.startsWith(hoy));
    const totalHoy = gastosHoy.reduce((acc, curr) => acc + Number(curr.content.monto || 0), 0);
    const totalMes = items.reduce((acc, curr) => acc + Number(curr.content.monto || 0), 0);

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform">
            <TrendingUp size={120} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-100 text-sm font-medium uppercase tracking-wider mb-1">Total Hoy</p>
            <h3 className="text-3xl font-bold">${totalHoy.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
            <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-full">
              <Clock size={12} />
              <span>{gastosHoy.length} transacciones</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase">Acumulado Mes</p>
            <h3 className="text-xl font-bold text-gray-800">${totalMes.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
            <Tag size={24} />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-medium uppercase">Última Categoría</p>
            <h3 className="text-xl font-bold text-gray-800">
              {items[0]?.content.categoria || 'Sin datos'}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  return (
    <ModuleTemplate
      moduleName="Registro de Gastos"
      moduleOwner="RegistroDeGastos"
      fields={fields}
      renderSummary={renderSummary}
      useModal={true}
      formColumns={2}
      gridColumns={2}
    />
  );
}

export default RegistroDeGastos;
