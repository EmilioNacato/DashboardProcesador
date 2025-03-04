import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TransactionTable from '../components/TransactionTable';
import StatCard from '../components/StatCard';
import TransactionChart from '../components/TransactionChart';
import { getFraudulentTransactions } from '../services/TransactionService';

export default function FraudePage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    montoTotal: 0,
    promedioMonto: 0
  });

  useEffect(() => {
    const loadFraudulentTransactions = async () => {
      try {
        setLoading(true);
        const data = await getFraudulentTransactions();
        setTransactions(data);
        
        // Calcular estadísticas
        const total = data.length;
        const montoTotal = data.reduce((sum, tx) => sum + (tx.monto || 0), 0);
        
        setStats({
          total,
          montoTotal,
          promedioMonto: total > 0 ? montoTotal / total : 0
        });
      } catch (err) {
        setError('Error al cargar las transacciones fraudulentas');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadFraudulentTransactions();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Transacciones Fraudulentas</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Transacciones"
            value={stats.total}
            icon="🚫"
          />
          <StatCard
            title="Monto Total"
            value={`$${stats.montoTotal.toFixed(2)}`}
            icon="💰"
          />
          <StatCard
            title="Promedio por Transacción"
            value={`$${stats.promedioMonto.toFixed(2)}`}
            icon="📊"
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <TransactionChart transactions={transactions} />
            </div>
            <TransactionTable transactions={transactions} />
          </>
        )}
      </div>
    </Layout>
  );
} 