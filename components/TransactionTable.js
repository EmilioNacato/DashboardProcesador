import React, { useState } from 'react';
import Link from 'next/link';

const TransactionTable = ({ transactions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const itemsPerPage = 10;

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

  // Filtrar transacciones basado en búsqueda y estado
  const filteredTransactions = transactions.filter(transaction => {
    // Para la búsqueda, verificar en varios campos
    const searchFields = [
      transaction.codTransaccion,
      transaction.numeroTarjeta,
      transaction.marca,
      transaction.referencia,
      getStatusName(transaction.estado)
    ].filter(Boolean).join(' ').toLowerCase();
    
    const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
    
    // Para el filtro de estado, comparar con el estado mapeado
    const transactionStatus = transaction.estado;
    const matchesStatus = statusFilter === '' || 
      (statusFilter === 'COMPLETADA' && (transactionStatus === 'COMPLETADA' || transactionStatus === 'COM')) ||
      (statusFilter === 'PENDIENTE' && (transactionStatus === 'PENDIENTE' || transactionStatus === 'PEN')) ||
      (statusFilter === 'FALLIDA' && (transactionStatus === 'FALLIDA' || transactionStatus === 'ERR' || 
                                     transactionStatus === 'ERROR' || transactionStatus === 'RECHAZADA'));
    
    return matchesSearch && matchesStatus;
  });

  // Calcular paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // Funciones para la paginación
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      // Si la cadena de fecha ya está en formato legible, retornarla directamente
      // Por ejemplo, si ya viene como "DD/MM/YYYY, HH:MM:SS"
      if (typeof dateString === 'string' && 
          /\d{2}\/\d{2}\/\d{4}, \d{2}:\d{2}:\d{2}/.test(dateString)) {
        return dateString;
      }
      
      // Si tenemos formato PostgreSQL directo "YYYY-MM-DD HH:MM:SS.mmm"
      // Convertirlo a formato legible sin perder la fecha original
      if (typeof dateString === 'string' && 
          /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(dateString)) {
        console.log(`Fecha PostgreSQL detectada: ${dateString}`);
        const parts = dateString.split(/[- :\.]/);
        
        // Formato español DD/MM/YYYY, HH:MM:SS - SIN CREAR OBJETO DATE INTERMEDIO
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        const hour = parts.length > 3 ? parts[3] : "00";
        const minute = parts.length > 4 ? parts[4] : "00";
        const second = parts.length > 5 ? parts[5] : "00";
        
        return `${day}/${month}/${year}, ${hour}:${minute}:${second}`;
      }
      
      // IMPORTANTE: Para ISO strings y otros formatos, mantener la conversión simple sin cambiar la fecha
      if (typeof dateString === 'string') {
        if (dateString.includes('T')) {
          // Es un ISO string
          const dateObj = new Date(dateString);
          const day = dateObj.getDate().toString().padStart(2, '0');
          const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
          const year = dateObj.getFullYear();
          const hours = dateObj.getHours().toString().padStart(2, '0');
          const minutes = dateObj.getMinutes().toString().padStart(2, '0');
          const seconds = dateObj.getSeconds().toString().padStart(2, '0');
          
          return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
        } else {
          // Otros formatos - intentar conservar la fecha original
          return dateString;
        }
      }
      
      // Si todo lo demás falla, usar el valor original para no perder información
      return dateString.toString();
    } catch (e) {
      console.error(`Error formateando fecha: ${dateString}`, e);
      return dateString || 'N/A'; // Devolver el valor original si hay error
    }
  };

  // Formatear número de tarjeta (mostrar solo últimos 4 dígitos)
  const formatCardNumber = (cardNumber) => {
    if (!cardNumber || cardNumber === 'N/A') return 'N/A';
    // Si es un número de 16 dígitos, mostrar solo los últimos 4
    if (cardNumber.length >= 12) {
      return `•••• ${cardNumber.slice(-4)}`;
    }
    return cardNumber;
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

  // Formatear monto con 2 decimales y símbolo $
  const formatAmount = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return '$0.00';
    
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(numericAmount);
  };

  return (
    <div className="transaction-table-container">
      <div className="filters">
        <input
          type="text"
          placeholder="Buscar por código, marca, tarjeta o referencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">Todos los estados</option>
          <option value="COMPLETADA">Completada</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="FALLIDA">Fallida</option>
        </select>
      </div>

      <table className="transaction-table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Fecha</th>
            <th>Marca</th>
            <th>Tarjeta</th>
            <th>Monto</th>
            <th>Referencia</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentTransactions.length > 0 ? (
            currentTransactions.map((transaction) => (
              <tr key={transaction.id || transaction.codTransaccion}>
                <td title={transaction.codTransaccion}>
                  {transaction.codTransaccion}
                </td>
                <td>{formatDate(transaction.fechaCreacion)}</td>
                <td>{transaction.marca || 'VISA'}</td>
                <td>{formatCardNumber(transaction.numeroTarjeta)}</td>
                <td>{formatAmount(transaction.monto)}</td>
                <td title={transaction.referencia}>{transaction.referencia || 'N/A'}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(transaction.estado)}`}>
                    {getStatusName(transaction.estado)}
                  </span>
                </td>
                <td>
                  <Link href={`/transaction/${transaction.codTransaccion}`} legacyBehavior>
                    <a>
                      <button className="view-btn">Ver</button>
                    </a>
                  </Link>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="8" className="no-data">
                No se encontraron transacciones
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => goToPage(currentPage - 1)} 
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Anterior
          </button>
          
          <span className="page-info">
            Página {currentPage} de {totalPages}
          </span>
          
          <button 
            onClick={() => goToPage(currentPage + 1)} 
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Siguiente
          </button>
        </div>
      )}

      <style jsx>{`
        .transaction-table-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .filters {
          display: flex;
          margin-bottom: 20px;
          gap: 10px;
        }
        
        .search-input, .status-filter {
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .search-input {
          flex-grow: 1;
        }
        
        .transaction-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .transaction-table th {
          background-color: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #ddd;
        }
        
        .transaction-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: 500;
          display: inline-block;
        }
        
        .status-success {
          background-color: #e6f7e6;
          color: #2e7d32;
        }
        
        .status-warning {
          background-color: #fff8e1;
          color: #ff8f00;
        }
        
        .status-info {
          background-color: #e3f2fd;
          color: #1565c0;
        }
        
        .status-danger {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .view-btn {
          background-color: #3f51b5;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        
        .view-btn:hover {
          background-color: #303f9f;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
        }
        
        .pagination-btn {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 8px 16px;
          cursor: pointer;
          font-size: 14px;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background-color: #e0e0e0;
        }
        
        .pagination-btn:disabled {
          color: #aaa;
          cursor: not-allowed;
        }
        
        .page-info {
          margin: 0 15px;
          font-size: 14px;
        }
        
        .no-data {
          text-align: center;
          padding: 30px;
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default TransactionTable; 