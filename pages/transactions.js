import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TransactionTable from '../components/TransactionTable';
import { TransactionService } from '../services/TransactionService';

// Clave para almacenar las fechas en localStorage
const STORAGE_KEY = 'banquito_transaction_date_range';

// Formatear una fecha para input type="date"
const formatDateForInput = (date) => {
  return date.toISOString().split('T')[0];
};

// Formatear fecha como YYYY-MM-DD (formato para input date)
const formatDate = (date) => {
  return date.toISOString().split('T')[0];
};

// Función para parsear la fecha y hora de entrada de forma exacta
const parseDateTimeInput = (dateString, timeString) => {
  console.log('Parseando fecha y hora en formato 24H:', { dateString, timeString });
  
  try {
    // Extraer componentes de fecha y hora
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours, minutes] = timeString.split(':').map(Number);
    
    // Validar que los componentes sean correctos
    if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
      throw new Error('Componentes de fecha u hora inválidos');
    }
    
    // Validar el rango de horas (formato 24h: 0-23)
    if (hours < 0 || hours > 23) {
      throw new Error(`Hora fuera de rango (0-23): ${hours}`);
    }
    
    // Validar el rango de minutos (0-59)
    if (minutes < 0 || minutes > 59) {
      throw new Error(`Minutos fuera de rango (0-59): ${minutes}`);
    }
    
    console.log('Componentes extraídos en formato 24h:', { year, month, day, hours, minutes });
    
    // CRÍTICO: Crear el objeto Date sin ajustes de zona horaria
    // Usamos el constructor directo para evitar conversiones automáticas
    // Importante: los meses en JavaScript son 0-indexed (0-11), por lo que restamos 1
    const dateObj = new Date(year, month - 1, day, hours, minutes, 0);
    
    console.log('Objeto Date creado con componentes EXACTOS en formato 24h:', {
      original: `${year}-${month}-${day}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`,
      isoString: dateObj.toISOString(),
      localString: dateObj.toLocaleString(),
      componentes: {
        year: dateObj.getFullYear(),
        month: dateObj.getMonth() + 1, // Ajustar para mostrar 1-12 en lugar de 0-11
        day: dateObj.getDate(),
        hours: dateObj.getHours(),
        minutes: dateObj.getMinutes()
      }
    });
    
    return dateObj;
  } catch (error) {
    console.error('Error al parsear fecha y hora:', error, { dateString, timeString });
    // En caso de error, devolver la fecha actual como fallback
    return new Date();
  }
};

// Función para determinar la marca según el número de tarjeta
function obtenerMarcaPorNumero(numeroTarjeta) {
  if (!numeroTarjeta) return 'VISA';
  
  if (numeroTarjeta.startsWith('4')) return 'VISA';
  if (numeroTarjeta.startsWith('5')) return 'MASTERCARD';
  if (numeroTarjeta.startsWith('34') || numeroTarjeta.startsWith('37')) return 'AMEX';
  if (numeroTarjeta.startsWith('6011') || numeroTarjeta.startsWith('644') || 
      numeroTarjeta.startsWith('65')) return 'DISCOVER';
  
  return 'VISA'; // Por defecto
}

export default function Transactions() {
  // Obtener fecha de hoy
  const today = new Date();
  
  // Inicialización del estado del componente
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Estado para guardar el rango de fechas seleccionado
  // Por defecto, últimos 7 días
  const getDefaultDateRange = () => {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    return {
      desde: {
        fecha: formatDate(sevenDaysAgo),
        hora: '00:00'
      },
      hasta: {
        fecha: formatDate(today),
        hora: '23:59'
      }
    };
  };
  
  const [dateRange, setDateRange] = useState(getDefaultDateRange());
  
  // Cargar fechas guardadas del localStorage al iniciar
  useEffect(() => {
    console.log('Componente Transactions montado - cargando filtros...');
    setIsLoading(true);
    
    // Función para cargar fechas desde localStorage de forma segura
    const loadSavedDates = () => {
      try {
        const savedDates = localStorage.getItem(STORAGE_KEY);
        if (savedDates) {
          try {
            const parsedDates = JSON.parse(savedDates);
            console.log('Filtros recuperados de localStorage (VALORES ORIGINALES EXACTOS):', JSON.stringify(parsedDates, null, 2));
            
            // CRUCIAL: Asegurarse de que los valores de las fechas son válidos
            // Y NO MODIFICARLOS de ninguna manera
            if (parsedDates?.desde?.fecha && parsedDates?.hasta?.fecha &&
                parsedDates?.desde?.hora && parsedDates?.hasta?.hora) {
              
              // CRÍTICO: Aplicar los filtros exactamente como están, sin ninguna modificación
              console.log('Aplicando filtros EXACTOS desde localStorage:', JSON.stringify(parsedDates, null, 2));
              
              // Importante: utilizar los valores exactos sin manipulación
              setDateRange({
                desde: {
                  fecha: parsedDates.desde.fecha,
                  hora: parsedDates.desde.hora
                },
                hasta: {
                  fecha: parsedDates.hasta.fecha,
                  hora: parsedDates.hasta.hora
                }
              });
              
              // Buscar transacciones con estos valores exactos
              setTimeout(() => {
                // Crear objetos Date a partir de los valores exactos
                const desdeObj = parseDateTimeInput(
                  parsedDates.desde.fecha,
                  parsedDates.desde.hora
                );
                const hastaObj = parseDateTimeInput(
                  parsedDates.hasta.fecha,
                  parsedDates.hasta.hora
                );
                
                console.log('Buscando transacciones con valores EXACTOS de localStorage:', {
                  desde: {
                    fecha: parsedDates.desde.fecha,
                    hora: parsedDates.desde.hora
                  },
                  hasta: {
                    fecha: parsedDates.hasta.fecha,
                    hora: parsedDates.hasta.hora
                  }
                });
                
                // Realizar búsqueda directamente con estos valores
                TransactionService.getTransactionsByDateRange(desdeObj, hastaObj)
                  .then(data => {
                    console.log(`Se encontraron ${data.length} transacciones usando filtros exactos de localStorage`);
                    setTransactions(data);
                    setLastUpdated(new Date().toLocaleString());
                    setIsLoading(false);
                  })
                  .catch(error => {
                    console.error('Error al cargar transacciones con fechas de localStorage:', error);
                    setError('Error al cargar las transacciones');
                    setTransactions([]);
                    setIsLoading(false);
                  });
              }, 100);
              
              return true;
            } else {
              console.warn('Filtros guardados incompletos, usando valores predeterminados');
            }
          } catch (parseError) {
            console.error('Error al parsear filtros guardados:', parseError);
          }
        } else {
          console.log('No se encontraron filtros guardados, usando valores predeterminados');
        }
      } catch (err) {
        console.error('Error al acceder a localStorage:', err);
      }
      return false;
    };
    
    // Verificar si hay parámetros en la URL (tiene prioridad sobre localStorage)
    const checkURLParams = () => {
      if (typeof window !== 'undefined') {
        // Verificar si hay parámetros en la URL
        const urlParams = new URLSearchParams(window.location.search);
        
        // Obtener todos los parámetros de la URL para mostrar en la consola
        const allParams = {};
        for (const [key, value] of urlParams.entries()) {
          allParams[key] = value;
        }
        console.log('Parámetros de URL detectados:', allParams);
        
        // Obtener los parámetros de fecha y hora
        const desdeDate = urlParams.get('desdeDate');
        const desdeTime = urlParams.get('desdeTime');
        const hastaDate = urlParams.get('hastaDate');
        const hastaTime = urlParams.get('hastaTime');
        const exact = urlParams.get('exact');
        
        // Verificar si todos los parámetros están presentes
        if (desdeDate && desdeTime && hastaDate && hastaTime) {
          console.log('Parámetros de búsqueda encontrados en URL:', {
            desdeDate,
            desdeTime,
            hastaDate,
            hastaTime,
            exact
          });
          
          // Importante: usar directamente los valores de la URL sin modificarlos
          const urlDateRange = {
            desde: {
              fecha: desdeDate,
              hora: desdeTime
            },
            hasta: {
              fecha: hastaDate,
              hora: hastaTime
            }
          };
          
          console.log('Rango de fechas construido EXACTAMENTE desde URL:', urlDateRange);
          
          // Guardar en localStorage tal cual están (sin modificar)
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(urlDateRange));
            console.log('Filtros guardados en localStorage con valores exactos de URL');
          } catch (error) {
            console.error('Error al guardar filtros en localStorage:', error);
          }
          
          // Actualizar el estado con los parámetros exactos de la URL
          setDateRange(urlDateRange);
          
          // Buscar con los valores exactos de la URL
          const desdeObj = parseDateTimeInput(desdeDate, desdeTime);
          const hastaObj = parseDateTimeInput(hastaDate, hastaTime);
          
          console.log('Objetos de fecha creados desde URL sin modificar:', {
            desde: desdeObj,
            hasta: hastaObj
          });
          
          // Usar directamente las fechas de la URL para buscar transacciones
          TransactionService.getTransactionsByDateRange(desdeObj, hastaObj)
            .then(data => {
              console.log(`Se encontraron ${data.length} transacciones en el período especificado por URL`);
              setTransactions(data);
              setLastUpdated(new Date().toLocaleString());
              setIsLoading(false);
            })
            .catch(error => {
              console.error('Error al cargar transacciones con fechas de URL:', error);
              setError('Error al cargar las transacciones');
              setTransactions([]);
              setIsLoading(false);
            });
          
          return true;
        }
        
        return false;
      }
      return false;
    };
    
    // Primero intentamos cargar desde la URL, luego desde localStorage
    const paramsFromURL = checkURLParams();
    
    if (!paramsFromURL) {
      // Si no hay parámetros en la URL, intentar cargar desde localStorage
      const fromLocalStorage = loadSavedDates();
      
      // Solo se ejecuta fetchTransactions si no hay valores ni en URL ni en localStorage
      if (!fromLocalStorage) {
        // En este caso usamos los valores por defecto
        console.log('No hay filtros definidos, usando valores predeterminados');
        setDateRange(getDefaultDateRange());
        setTimeout(() => {
          fetchTransactions();
          setIsLoading(false);
        }, 300);
      }
    }
    
    // Esta función de limpieza se ejecuta al desmontar el componente
    return () => {
      console.log('Componente Transactions desmontado');
    };
  }, []);
  
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // IMPORTANTE: No consultar ni modificar localStorage aquí, usar exactamente los valores actuales
      console.log('Estado actual de dateRange antes de la búsqueda (VALORES EXACTOS):', JSON.stringify(dateRange, null, 2));
      
      // VALIDACIÓN CRÍTICA: Asegurarnos de que las fechas y horas tienen el formato correcto
      if (!dateRange.desde.fecha || !dateRange.desde.hora || !dateRange.hasta.fecha || !dateRange.hasta.hora) {
        console.error('Valores de fecha/hora incompletos en dateRange:', dateRange);
        setError('Error en los filtros de fecha. Por favor, verifica los valores.');
        setIsLoading(false);
        return;
      }
      
      // IMPORTANTE: Usar exactamente los valores que están en dateRange sin modificarlos
      // No consultar localStorage ni reemplazar con valores por defecto
      
      // Construir objetos Date directamente de los valores actuales sin manipulación
      const desdeDate = parseDateTimeInput(dateRange.desde.fecha, dateRange.desde.hora);
      const hastaDate = parseDateTimeInput(dateRange.hasta.fecha, dateRange.hasta.hora);
      
      console.log(`BÚSQUEDA DIRECTA CON VALORES EXACTOS:`, {
        desdeFecha: dateRange.desde.fecha,
        desdeHora: dateRange.desde.hora,
        hastaFecha: dateRange.hasta.fecha,
        hastaHora: dateRange.hasta.hora,
        desdeObj: desdeDate.toString(),
        hastaObj: hastaDate.toString(),
        // Valores exactos para la API:
        apiDesdeExacto: `${dateRange.desde.fecha}T${dateRange.desde.hora}:00`,
        apiHastaExacto: `${dateRange.hasta.fecha}T${dateRange.hasta.hora}:59`,
      });
      
      // Verificar que los objetos Date contienen exactamente los valores esperados
      console.log('Verificación final de Date objects para API (COMPONENTES EXACTOS):', {
        desdeYear: desdeDate.getFullYear(),
        desdeMonth: (desdeDate.getMonth() + 1).toString().padStart(2, '0'),
        desdeDay: desdeDate.getDate().toString().padStart(2, '0'),
        desdeHours: desdeDate.getHours().toString().padStart(2, '0'),
        desdeMinutes: desdeDate.getMinutes().toString().padStart(2, '0'),
        hastaYear: hastaDate.getFullYear(),
        hastaMonth: (hastaDate.getMonth() + 1).toString().padStart(2, '0'),
        hastaDay: hastaDate.getDate().toString().padStart(2, '0'),
        hastaHours: hastaDate.getHours().toString().padStart(2, '0'),
        hastaMinutes: hastaDate.getMinutes().toString().padStart(2, '0'),
      });
      
      console.log('Llamando a getTransactionsByDateRange con valores exactos sin manipulación...');
      
      // URL esperada con valores exactos:
      const expectedUrl = `https://procesatransaccion-alb-785318717.us-east-2.elb.amazonaws.com/api/v1/transacciones/recientes?desde=${encodeURIComponent(`${dateRange.desde.fecha}T${dateRange.desde.hora}:00`)}&hasta=${encodeURIComponent(`${dateRange.hasta.fecha}T${dateRange.hasta.hora}:59`)}`;
      console.log(`URL esperada con valores 100% exactos: ${expectedUrl}`);
      
      // Obtener transacciones con los valores exactos
      const historialData = await TransactionService.getTransactionsByDateRange(desdeDate, hastaDate);
      
      console.log(`Se encontraron ${historialData.length} transacciones en el período exacto seleccionado`);
      
      // IMPORTANTE: No manipular los datos recibidos
      setTransactions(historialData);
      setLastUpdated(new Date().toLocaleString());
      setIsLoading(false);
    } catch (err) {
      console.error('Error obteniendo transacciones:', err);
      setError('No se pudieron cargar las transacciones. Por favor verifica que el microservicio esté funcionando correctamente.');
      setTransactions([]); // Reset transactions en caso de error
      setIsLoading(false);
    }
  };
  
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
    
    // CRÍTICO: Guardar exactamente los valores que el usuario ha seleccionado en el form
    const exactDateRange = {
      desde: {
        fecha: dateRange.desde.fecha, 
        hora: dateRange.desde.hora
      },
      hasta: {
        fecha: dateRange.hasta.fecha,
        hora: dateRange.hasta.hora
      }
    };
    
    // Guardar en localStorage exactamente los valores seleccionados
    try {
      console.log('Guardando valores exactos seleccionados por el usuario:', JSON.stringify(exactDateRange, null, 2));
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(exactDateRange));
      console.log('Valores EXACTOS guardados en localStorage exitosamente');
      
      // Verificar que se guardaron correctamente
      const savedFilters = localStorage.getItem(STORAGE_KEY);
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        console.log('Verificación de valores guardados (deben ser idénticos):', JSON.stringify(parsedFilters, null, 2));
        
        // Verificar que son iguales
        const fechasIguales = 
          parsedFilters.desde.fecha === exactDateRange.desde.fecha &&
          parsedFilters.desde.hora === exactDateRange.desde.hora &&
          parsedFilters.hasta.fecha === exactDateRange.hasta.fecha &&
          parsedFilters.hasta.hora === exactDateRange.hasta.hora;
        
        console.log('Verificación de integridad: ¿Los valores guardados son idénticos?', fechasIguales ? 'SÍ' : 'NO');
      }
    } catch (err) {
      console.error('Error al guardar valores exactos en localStorage:', err);
    }
    
    // Realizar la búsqueda con los valores exactos
    console.log('Iniciando búsqueda directa con valores exactos seleccionados:', JSON.stringify(exactDateRange, null, 2));
    fetchTransactions();
  };

  // Contar transacciones por estado
  const getStatusCounts = () => {
    return {
      total: transactions.length,
      completadas: transactions.filter(t => t.estado === 'COMPLETADA' || t.estado === 'COM').length,
      pendientes: transactions.filter(t => t.estado === 'PENDIENTE' || t.estado === 'PEN').length,
      fallidas: transactions.filter(t => t.estado === 'FALLIDA' || t.estado === 'ERR' || 
                                       t.estado === 'ERROR' || t.estado === 'RECHAZADA').length
    };
  };

  const counts = getStatusCounts();
  
  // Formatear fechas para mostrar en el mensaje de búsqueda
  const formatDateTimeForDisplay = (dateObj, timeStr, isEndTime = false) => {
    try {
      // Si dateObj ya está en formato YYYY-MM-DD, no necesitamos convertirlo
      const [year, month, day] = dateObj.split('-').map(num => parseInt(num, 10));
      const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
      
      // Formato DD/MM/YYYY, HH:MM:SS
      const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      // Para tiempo final, usar :59 segundos
      const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${isEndTime ? '59' : '00'}`;
      
      return `${formattedDate}, ${formattedTime}`;
    } catch (e) {
      console.error('Error al formatear fecha para mostrar:', e);
      return 'Fecha inválida';
    }
  };

  return (
    <Layout title="Transacciones">
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
          
          <div className="format-info">
            <small>* Usa formato de 24 horas (ejemplo: 14:00 en lugar de 2:00 PM)</small>
          </div>
          
          <button type="submit" className="search-button" disabled={isLoading}>
            {isLoading ? 'Buscando...' : 'Buscar'}
          </button>
        </form>
      </div>
      
      {isLoading ? (
        <div className="loading">Cargando transacciones...</div>
      ) : error ? (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={fetchTransactions} className="retry-button">
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <div className="transactions-header">
            <div className="info-text">
              Mostrando {transactions.length} transacciones 
              <span className="date-range">
                (desde {formatDateTimeForDisplay(dateRange.desde.fecha, dateRange.desde.hora, false)} hasta {formatDateTimeForDisplay(dateRange.hasta.fecha, dateRange.hasta.hora, true)})
              </span>
            </div>
            <div className="last-updated">
              Actualizado: {lastUpdated}
            </div>
          </div>

          {transactions.length > 0 ? (
            <>
              <div className="transactions-summary">
                <div className="summary-box">
                  <h3>Total de Transacciones</h3>
                  <p className="summary-number">{counts.total}</p>
                </div>
                <div className="summary-box">
                  <h3>Completadas</h3>
                  <p className="summary-number">{counts.completadas}</p>
                </div>
                <div className="summary-box">
                  <h3>Pendientes</h3>
                  <p className="summary-number">{counts.pendientes}</p>
                </div>
                <div className="summary-box">
                  <h3>Fallidas</h3>
                  <p className="summary-number">{counts.fallidas}</p>
                </div>
              </div>

              <TransactionTable transactions={transactions} />
            </>
          ) : (
            <div className="no-data">
              No hay transacciones disponibles en este periodo de tiempo.
            </div>
          )}
        </>
      )}

      <style jsx>{`
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
        
        .loading, .error-message, .no-data {
          text-align: center;
          padding: 20px;
          font-size: 1.1rem;
          margin-top: 20px;
        }
        
        .error-message {
          color: #e57373;
          background-color: #ffebee;
          border-radius: 4px;
          padding: 15px;
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
        
        .no-data {
          color: #666;
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 30px;
        }
        
        .transactions-header {
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
        
        .transactions-summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 20px;
        }
        
        .summary-box {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 15px 20px;
          flex: 1;
          text-align: center;
        }
        
        .summary-box h3 {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 5px;
          font-weight: 500;
        }
        
        .summary-number {
          font-size: 1.8rem;
          font-weight: bold;
          color: #333;
          margin: 0;
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
          }
          
          .transactions-summary {
            flex-direction: column;
          }
          
          .transactions-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </Layout>
  );
} 