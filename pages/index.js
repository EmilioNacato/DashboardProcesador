import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import TransactionChart from '../components/TransactionChart';
import { TransactionService } from '../services/TransactionService';

export default function Home() {
  const [stats, setStats] = useState({
    totalTransacciones: 0,
    completadas: 0,
    pendientes: 0,
    fallidas: 0,
    montoTotal: 0
  });

  const [chartData, setChartData] = useState({
    labels: [],
    completadas: [],
    pendientes: [],
    fallidas: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    desde: {
      fecha: formatDateForInput(new Date(new Date().setDate(new Date().getDate() - 1))),
      hora: '00:00'
    },
    hasta: {
      fecha: formatDateForInput(new Date()),
      hora: '23:59'
    }
  });
  
  // Formatear una fecha para input type="date"
  function formatDateForInput(date) {
    return date.toISOString().split('T')[0];
  }
  
  // Convertir fecha y hora de input a objeto Date
  function parseDateTimeInput(dateString, timeString) {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num, 10));
    const [hours, minutes] = timeString.split(':').map(num => parseInt(num, 10));
    
    // Mes en JavaScript es 0-indexado (0=enero, 11=diciembre)
    return new Date(year, month - 1, day, hours, minutes, 0);
  }
  
  // Formatear fechas para mostrar en el mensaje de búsqueda
  const formatDateTimeForDisplay = (dateObj, timeStr) => {
    try {
      // Crear la fecha a partir de los componentes para evitar problemas de zona horaria
      const [year, month, day] = dateObj.split('-').map(num => parseInt(num, 10));
      const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
      
      // Formato DD/MM/YYYY, HH:MM:SS
      const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      return `${formattedDate}, ${formattedTime}`;
    } catch (e) {
      console.error('Error al formatear fecha para mostrar:', e);
      return 'Fecha inválida';
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, []);
  
  // Manejar cambio en campos de fecha y hora
  const handleDateTimeChange = (event) => {
    const { name, value } = event.target;
    
    // El formato de name será "desde.fecha", "desde.hora", "hasta.fecha" o "hasta.hora"
    const [periodo, tipo] = name.split('.');
    
    setDateRange(prev => ({
      ...prev,
      [periodo]: {
        ...prev[periodo],
        [tipo]: value
      }
    }));
  };
  
  // Manejar búsqueda con nuevas fechas
  const handleSearch = (e) => {
    e.preventDefault();
    fetchData();
    setShowFilters(false); // Ocultar filtros después de buscar
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convertir fechas y horas a objetos Date
      const desdeDate = parseDateTimeInput(dateRange.desde.fecha, dateRange.desde.hora);
      const hastaDate = parseDateTimeInput(dateRange.hasta.fecha, dateRange.hasta.hora);
      
      console.log('Consultando datos desde:', desdeDate.toLocaleString(), 'hasta:', hastaDate.toLocaleString());
      
      // Obtener estadísticas
      const statsData = await TransactionService.getTransactionStats(desdeDate, hastaDate);
      
      if (!statsData) {
        throw new Error('No se pudieron obtener las estadísticas');
      }

      setStats(statsData);
      console.log('Estadísticas actualizadas:', statsData);

      // Obtener transacciones para el gráfico
      const transactions = await TransactionService.getTransactionsByDateRange(desdeDate, hastaDate);
      
      if (!transactions) {
        throw new Error('No se pudieron obtener las transacciones');
      }

      console.log('Transacciones obtenidas:', transactions.length);

      // Agrupar transacciones por fecha
      const transactionsByDay = transactions.reduce((acc, transaction) => {
        if (!transaction.fechaCreacion) return acc;
        
        try {
          const fecha = new Date(transaction.fechaCreacion);
          const fechaStr = fecha.toISOString().split('T')[0];
          
          if (!acc[fechaStr]) {
            acc[fechaStr] = {
              completadas: 0,
              pendientes: 0,
              fallidas: 0
            };
          }
          
          if (transaction.estado === 'COMPLETADA' || transaction.estado === 'COM') {
            acc[fechaStr].completadas++;
          } else if (transaction.estado === 'PENDIENTE' || transaction.estado === 'PEN') {
            acc[fechaStr].pendientes++;
          } else {
            acc[fechaStr].fallidas++;
          }
        } catch (e) {
          console.error('Error procesando fecha de transacción:', e);
        }
        
        return acc;
      }, {});

      // Convertir datos agrupados para el gráfico
      const fechas = Object.keys(transactionsByDay).sort();
      const chartData = {
        labels: fechas.map(fecha => {
          const [year, month, day] = fecha.split('-');
          return `${day}/${month}`;
        }),
        completadas: fechas.map(fecha => transactionsByDay[fecha].completadas),
        pendientes: fechas.map(fecha => transactionsByDay[fecha].pendientes),
        fallidas: fechas.map(fecha => transactionsByDay[fecha].fallidas)
      };

      setChartData(chartData);
      console.log('Datos del gráfico actualizados:', chartData);

      // Actualizar timestamp
      setLastUpdated(new Date().toLocaleString('es-ES'));
      
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setError(error.message || 'Error al cargar los datos');
    } finally {
      setIsLoading(false);
    }
  };

  // Formatear el monto total con separador de miles y 2 decimales
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Layout title="Dashboard">
      <div className="dashboard-actions">
        <button 
          className="filter-toggle-button"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ocultar filtros' : 'Seleccionar fechas'}
        </button>
        
        {showFilters && (
          <div className="date-filter-container">
            <form onSubmit={handleSearch} className="date-filter-form">
              <div className="date-inputs">
                <div className="date-input-group">
                  <label htmlFor="desde.fecha">Desde:</label>
                  <div className="datetime-inputs">
                    <input 
                      type="date" 
                      id="desde.fecha" 
                      name="desde.fecha" 
                      value={dateRange.desde.fecha} 
                      onChange={handleDateTimeChange}
                      className="date-input"
                    />
                    <input 
                      type="time" 
                      id="desde.hora" 
                      name="desde.hora" 
                      value={dateRange.desde.hora} 
                      onChange={handleDateTimeChange}
                      className="time-input"
                    />
                  </div>
                </div>
                
                <div className="date-input-group">
                  <label htmlFor="hasta.fecha">Hasta:</label>
                  <div className="datetime-inputs">
                    <input 
                      type="date" 
                      id="hasta.fecha" 
                      name="hasta.fecha" 
                      value={dateRange.hasta.fecha} 
                      onChange={handleDateTimeChange}
                      className="date-input"
                    />
                    <input 
                      type="time" 
                      id="hasta.hora" 
                      name="hasta.hora" 
                      value={dateRange.hasta.hora} 
                      onChange={handleDateTimeChange}
                      className="time-input"
                    />
                  </div>
                </div>
              </div>
              
              <button type="submit" className="search-button" disabled={isLoading}>
                {isLoading ? 'Buscando...' : 'Buscar'}
              </button>
            </form>
          </div>
        )}
      </div>
      
      {isLoading ? (
        <div className="loading">Cargando datos...</div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={fetchData} className="retry-button">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="dashboard-header">
            <div className="info-text">
              Resumen de operaciones
              <span className="date-range">
                (desde {formatDateTimeForDisplay(dateRange.desde.fecha, dateRange.desde.hora)} hasta {formatDateTimeForDisplay(dateRange.hasta.fecha, dateRange.hasta.hora)})
              </span>
            </div>
            <div className="last-updated">
              Actualizado: {lastUpdated}
            </div>
          </div>
          
          <div className="stats-grid">
            <StatCard 
              title="Transacciones Totales" 
              value={stats.totalTransacciones} 
              icon={<span className="material-icon">📊</span>}
              color="#3f51b5"
            />
            <StatCard 
              title="Transacciones Completadas" 
              value={stats.completadas} 
              icon={<span className="material-icon">✅</span>}
              color="#2e7d32"
            />
            <StatCard 
              title="Transacciones Pendientes" 
              value={stats.pendientes} 
              icon={<span className="material-icon">⏳</span>}
              color="#ff8f00"
            />
            <StatCard 
              title="Transacciones Fallidas" 
              value={stats.fallidas} 
              icon={<span className="material-icon">❌</span>}
              color="#c62828"
            />
            <StatCard 
              title="Monto Completado" 
              value={formatCurrency(stats.montoTotal)} 
              icon={<span className="material-icon">💰</span>}
              color="#0277bd"
            />
          </div>

          <div className="charts-section">
            <h3 className="section-title">Análisis de Transacciones</h3>
            <div className="chart-container central-chart">
              {chartData.labels.length > 0 ? (
                <TransactionChart data={chartData} chartType="line" />
              ) : (
                <div className="no-data-message">
                  No hay transacciones en el período seleccionado para mostrar en el gráfico.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .dashboard-actions {
          margin-bottom: 20px;
        }
        
        .filter-toggle-button {
          background-color: #3f51b5;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 1rem;
          cursor: pointer;
          margin-bottom: 10px;
        }
        
        .filter-toggle-button:hover {
          background-color: #303f9f;
        }
        
        .date-filter-container {
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }
        
        .date-filter-form {
          display: flex;
          align-items: center;
          gap: 20px;
        }
        
        .date-inputs {
          display: flex;
          gap: 20px;
          flex: 1;
        }
        
        .date-input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        
        .date-input-group label {
          font-weight: 500;
          color: #555;
          min-width: 60px;
        }
        
        .datetime-inputs {
          display: flex;
          gap: 5px;
          flex: 1;
        }
        
        .date-input, .time-input {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }
        
        .date-input {
          flex: 2;
        }
        
        .time-input {
          flex: 1;
        }
        
        .search-button {
          background-color: #3f51b5;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .search-button:hover {
          background-color: #303f9f;
        }
        
        .search-button:disabled {
          background-color: #9fa8da;
          cursor: not-allowed;
        }
      
        .loading, .error-message {
          text-align: center;
          padding: 20px;
          font-size: 1.1rem;
          margin-top: 20px;
        }
        
        .error-message {
          color: #e57373;
          background-color: #ffebee;
          border-radius: 4px;
          padding: 10px;
        }
        
        .error-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          margin-top: 30px;
        }
        
        .retry-button {
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .retry-button:hover {
          background-color: #1565c0;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .info-text {
          font-size: 1rem;
          color: #555;
        }
        
        .date-range {
          margin-left: 5px;
          font-weight: 500;
          color: #1976d2;
        }
        
        .last-updated {
          font-size: 0.9rem;
          color: #777;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .charts-section {
          margin-top: 30px;
        }
        
        .section-title {
          font-size: 1.2rem;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        .chart-container {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          height: 400px;
        }
        
        .central-chart {
          width: 100%;
        }
        
        .no-data-message {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: #777;
          font-style: italic;
        }
        
        @media (max-width: 768px) {
          .date-filter-form {
            flex-direction: column;
          }
          
          .date-inputs {
            flex-direction: column;
            width: 100%;
          }
          
          .date-input-group {
            width: 100%;
            flex-direction: column;
            align-items: flex-start;
          }
          
          .datetime-inputs {
            width: 100%;
          }
          
          .search-button {
            width: 100%;
            margin-top: 10px;
          }
          
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </Layout>
  );
} 