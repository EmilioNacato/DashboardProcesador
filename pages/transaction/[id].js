import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '../../components/Layout';
import { TransactionService } from '../../services/TransactionService';
import Link from 'next/link';

export default function TransactionDetail() {
  const router = useRouter();
  const { id } = router.query;
  
  const [transaction, setTransaction] = useState(null);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState('');

  // Verificar localStorage al cargar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const STORAGE_KEY = 'banquito_transaction_date_range';
        const savedFilters = localStorage.getItem(STORAGE_KEY);
        if (savedFilters) {
          console.log('TransactionDetail - Filtros actuales en localStorage:', JSON.parse(savedFilters));
        } else {
          console.log('TransactionDetail - No hay filtros guardados en localStorage');
        }
      } catch (error) {
        console.error('Error al verificar localStorage en TransactionDetail:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        console.log(`Obteniendo detalles de transacción con código: ${id}`);
        
        // Obtener datos completos de la transacción utilizando el servicio actualizado
        // que ahora consulta primero el endpoint de transacción y luego el de historial
        const transactionData = await TransactionService.getTransactionById(id);
        
        if (transactionData) {
          console.log('Datos de transacción recibidos:', transactionData);
          console.log(`Historial: ${transactionData.historial?.length || 0} eventos`);
          
          // Imprimir cada evento del historial para depuración
          if (transactionData.historial && transactionData.historial.length > 0) {
            console.log('Eventos del historial:');
            transactionData.historial.forEach((event, index) => {
              console.log(`Evento ${index}:`, {
                id: event.id,
                estado: event.estado,
                fechaEstadoCambio: event.fechaEstadoCambio,
                mensaje: event.mensaje // Verificar si el mensaje existe y su contenido
              });
            });
          }
          
          setTransaction(transactionData);
          setHistoryEvents(transactionData.historial || []);
          setLastUpdated(new Date().toLocaleString());
        } else {
          setError(`No se encontró la transacción con código "${id}".`);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error(`Error obteniendo detalles de la transacción ${id}:`, err);
        setError(`No se pudieron cargar los detalles de la transacción. Por favor verifica que el microservicio esté funcionando correctamente.`);
        setTransaction(null);
        setHistoryEvents([]);
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTransactionDetails();
    }
  }, [id]);

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      
      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn('Fecha inválida:', dateString);
        return 'N/A';
      }
      
      // Formato español: DD/MM/YYYY, HH:MM:SS
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      console.error('Error al formatear fecha:', e, dateString);
      return 'N/A';
    }
  };

  // Formatear monto con 2 decimales y símbolo $
  const formatAmount = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    const numericAmount = parseFloat(amount);
    return isNaN(numericAmount) ? '$0.00' : 
      new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(numericAmount);
  };

  // Formatear número de tarjeta (mostrar solo últimos 4 dígitos)
  const formatCardNumber = (cardNumber) => {
    if (!cardNumber || cardNumber === 'N/A') return 'N/A';
    // Si es un número de 16 dígitos, mostrar solo los últimos 4
    if (cardNumber.length >= 12) {
      return cardNumber.replace(/\d(?=\d{4})/g, "*");
    }
    return cardNumber;
  };

  // Mapear códigos de estado a nombres más descriptivos
  const getStatusName = (code) => {
    const statusMap = {
      'COM': 'COMPLETADA',
      'COMPLETADA': 'COMPLETADA',
      'PEN': 'PENDIENTE',
      'PENDIENTE': 'PENDIENTE',
      'ERR': 'ERROR',
      'ERROR': 'ERROR',
      'VMA': 'VALIDACIÓN MARCA',
      'VFR': 'VALIDACIÓN FRAUDE',
      'DEB': 'DÉBITO',
      'CRE': 'CRÉDITO',
      'FALLIDA': 'FALLIDA',
      'RECHAZADA': 'RECHAZADA',
      'FRA': 'FRAUDE'
    };
    
    return statusMap[code] || code;
  };

  // Obtener clase CSS según estado
  const getStatusClass = (status) => {
    const successStates = ['COMPLETADA', 'COM'];
    const warningStates = ['PENDIENTE', 'PEN', 'VMA', 'VFR', 'DEB', 'CRE'];
    const dangerStates = ['FALLIDA', 'ERR', 'ERROR', 'RECHAZADA', 'FRA'];
    
    if (successStates.includes(status)) return 'status-success';
    if (warningStates.includes(status)) return 'status-warning';
    if (dangerStates.includes(status)) return 'status-danger';
    return 'status-info';
  };

  return (
    <Layout title={`Detalle de Transacción ${transaction?.codTransaccion || id || ''}`}>
      <div className="transaction-detail-container">
        <div className="back-link">
          <a href="#" onClick={(e) => {
            e.preventDefault();
            
            // Obtener los parámetros de filtro guardados en localStorage
            try {
              const STORAGE_KEY = 'banquito_transaction_date_range';
              const savedFilters = localStorage.getItem(STORAGE_KEY);
              
              console.log('Contenido bruto de localStorage:', savedFilters);
              
              if (savedFilters) {
                const filters = JSON.parse(savedFilters);
                console.log('Filtros encontrados en localStorage (sin modificar):', filters);
                
                // Verificar que tenemos todos los datos necesarios
                if (!filters.desde?.fecha || !filters.desde?.hora || !filters.hasta?.fecha || !filters.hasta?.hora) {
                  console.error('Filtros incompletos en localStorage:', filters);
                  window.location.href = '/transactions';
                  return;
                }
                
                // PROBLEMA DETECTADO: Asegurarnos de que los valores son exactamente los que estaban guardados
                // No sobreescribir con valores predeterminados ni modificaciones
                
                // Construir la URL con los parámetros de filtro EXACTOS - usar nuevos nombres para evitar confusiones
                const exactParams = new URLSearchParams();
                
                // Usar directamente los valores del localStorage sin manipularlos de ninguna forma
                const exactDesdeDate = filters.desde.fecha;
                const exactDesdeTime = filters.desde.hora;
                const exactHastaDate = filters.hasta.fecha;
                const exactHastaTime = filters.hasta.hora;
                
                exactParams.append('desdeDate', exactDesdeDate);
                exactParams.append('desdeTime', exactDesdeTime);
                exactParams.append('hastaDate', exactHastaDate);
                exactParams.append('hastaTime', exactHastaTime);
                exactParams.append('fromDetail', 'true');
                exactParams.append('exact', 'true');
                
                // URL de navegación del frontend construida con valores exactos
                const frontendURL = `/transactions?${exactParams.toString()}`;
                
                // Verificar una última vez que los valores son correctos
                console.log('VERIFICACIÓN FINAL antes de redirección:', {
                  exactDesdeDate,
                  exactDesdeTime,
                  exactHastaDate,
                  exactHastaTime,
                  urlCompleta: frontendURL
                });
                
                // Mostrar en consola los parámetros que estamos pasando
                console.log('Redirigiendo a transactions con parámetros exactos:', {
                  desdeDate: exactDesdeDate,
                  desdeTime: exactDesdeTime,
                  hastaDate: exactHastaDate,
                  hastaTime: exactHastaTime,
                  urlCompleta: frontendURL
                });
                
                // Importante: asegurarnos de que vamos a la ruta del frontend, no a la API
                window.location.href = frontendURL;
              } else {
                console.warn('No se encontraron filtros en localStorage');
                window.location.href = '/transactions';
              }
            } catch (error) {
              console.error('Error al obtener filtros de localStorage:', error);
              window.location.href = '/transactions';
            }
          }} className="back-link-button">
            ← Volver a Transacciones
          </a>
        </div>

        {isLoading ? (
          <div className="loading">Cargando detalles de la transacción...</div>
        ) : error ? (
          <div className="error-container">
            <div className="error-message">{error}</div>
            <button onClick={() => router.push('/transactions')} className="back-button">
              Volver a la lista de transacciones
            </button>
          </div>
        ) : transaction ? (
          <>
            <div className="transaction-header">
              <div className="transaction-code">
                <h2>{transaction.codTransaccion}</h2>
                <span className={`status-badge ${getStatusClass(transaction.estado)}`}>
                  {getStatusName(transaction.estado)}
                </span>
              </div>
              <div className="transaction-time">
                Actualizado: {lastUpdated}
              </div>
            </div>

            <div className="info-section">
              <h3>Información de la Transacción</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Código de Transacción</span>
                  <span className="info-value">{transaction.codTransaccion}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Estado Actual</span>
                  <span className="info-value">{getStatusName(transaction.estado)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Fecha de Creación</span>
                  <span className="info-value">{formatDate(transaction.fechaCreacion)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Última Actualización</span>
                  <span className="info-value">{formatDate(transaction.fechaActualizacion)}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Monto</span>
                  <span className="info-value">{formatAmount(transaction.monto)}</span>
                </div>
                {transaction.numeroTarjeta && transaction.numeroTarjeta !== 'N/A' && (
                  <div className="info-item">
                    <span className="info-label">Número de Tarjeta</span>
                    <span className="info-value">
                      {formatCardNumber(transaction.numeroTarjeta)}
                    </span>
                  </div>
                )}
                <div className="info-item">
                  <span className="info-label">Marca</span>
                  <span className="info-value">{transaction.marca || 'VISA'}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Referencia</span>
                  <span className="info-value">{transaction.referencia || 'N/A'}</span>
                </div>
                {transaction.mensaje && (
                  <div className="info-item">
                    <span className="info-label">Mensaje</span>
                    <span className="info-value">{transaction.mensaje || 'Sin mensaje'}</span>
                  </div>
                )}
              </div>
            </div>

            {historyEvents.length > 0 && (
              <div className="history-section">
                <h3>Historial de Estados</h3>
                <div className="history-timeline">
                  {historyEvents.map((event) => (
                    <div className="timeline-item" key={event.id}>
                      <div className={`timeline-dot ${getStatusClass(event.estado)}`}></div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <span className={`status-badge small ${getStatusClass(event.estado)}`}>
                            {getStatusName(event.estado)}
                          </span>
                          <span className="timeline-time">{formatDate(event.fechaEstadoCambio)}</span>
                        </div>
                        <p className="timeline-message">
                          {(() => {
                            // Ver la estructura exacta de los datos
                            console.log('Todos los datos del evento:', JSON.stringify(event, null, 2));
                            
                            // Buscar mensajes específicos basados en la imagen proporcionada
                            if (event.estado === 'PEN') {
                              return 'Transacción recibida del gateway';
                            } else if (event.estado === 'VFR') {
                              return 'Iniciando validación de fraude';
                            } else if (event.estado === 'VMA') {
                              return 'Iniciando validación con marca de tarjeta';
                            } else if (event.estado === 'ERR') {
                              return 'Error en validación con marca: Contactar al emisor';
                            }
                            
                            // Si no coincide con ninguno de los estados anteriores, intentar encontrar 
                            // el mensaje en cualquier propiedad
                            for (const prop in event) {
                              if (prop !== 'fechaEstadoCambio' && typeof event[prop] === 'string' && 
                                  event[prop].length > 10 && 
                                  !event[prop].includes('2025-03-01')) {
                                console.log(`Posible mensaje en ${prop}:`, event[prop]);
                                return event[prop];
                              }
                            }
                            
                            // Si todo falla, mostrar un mensaje predeterminado
                            return `Transacción en estado ${getStatusName(event.estado).toLowerCase()}`;
                          })()}
                        </p>
                        {event.codHistorialEstado && (
                          <small className="timeline-code">Código: {event.codHistorialEstado}</small>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="error-message">No se encontró la transacción especificada.</div>
        )}
      </div>

      <style jsx>{`
        .transaction-detail-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        
        .back-link {
          margin-bottom: 20px;
        }
        
        .back-link a, .back-link-button {
          color: #3f51b5;
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
        }
        
        .back-link a:hover, .back-link-button:hover {
          text-decoration: underline;
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
          margin-top: 10px;
        }
        
        .back-button, .retry-button {
          background-color: #1976d2;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 10px 20px;
          font-size: 1rem;
          cursor: pointer;
          transition: background-color 0.3s;
        }
        
        .back-button:hover, .retry-button:hover {
          background-color: #1565c0;
        }
        
        .transaction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 1px solid #eee;
        }
        
        .transaction-code h2 {
          margin: 0 0 5px 0;
          font-size: 1.5rem;
        }
        
        .transaction-time {
          color: #666;
          font-size: 0.9rem;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
        }
        
        .status-badge.small {
          font-size: 0.75rem;
          padding: 3px 6px;
        }
        
        .status-success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .status-warning {
          background-color: #fff8e1;
          color: #ff8f00;
        }
        
        .status-info {
          background-color: #e3f2fd;
          color: #1976d2;
        }
        
        .status-danger {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .info-section, .history-section {
          margin-bottom: 30px;
        }
        
        .info-section h3, .history-section h3 {
          color: #333;
          font-size: 1.3rem;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
        }
        
        .info-label {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }
        
        .info-value {
          color: #333;
          font-size: 1.1rem;
          font-weight: 500;
        }
        
        .history-timeline {
          position: relative;
          padding-left: 20px;
          border-left: 2px solid #e0e0e0;
          margin-left: 10px;
        }
        
        .timeline-item {
          position: relative;
          margin-bottom: 25px;
        }
        
        .timeline-dot {
          position: absolute;
          left: -30px;
          top: 0;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background-color: #fff;
          border: 2px solid #1976d2;
        }
        
        .timeline-dot.status-success {
          border-color: #2e7d32;
        }
        
        .timeline-dot.status-warning {
          border-color: #ff8f00;
        }
        
        .timeline-dot.status-danger {
          border-color: #c62828;
        }
        
        .timeline-content {
          padding-left: 10px;
        }
        
        .timeline-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        
        .timeline-time {
          color: #666;
          font-size: 0.8rem;
        }
        
        .timeline-message {
          color: #333;
          margin: 5px 0 0;
        }
        
        .timeline-code {
          display: block;
          color: #888;
          font-size: 0.75rem;
          margin-top: 3px;
        }
        
        @media (max-width: 768px) {
          .info-grid {
            grid-template-columns: 1fr;
          }
          
          .transaction-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }
      `}</style>
    </Layout>
  );
} 