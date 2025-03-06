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
      const date = new Date(dateString);
      return date.toLocaleString('es-ES');
    } catch (e) {
      return dateString;
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

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETADA':
      case 'COM':
        return 'bg-green-100 text-green-800';
      case 'PENDIENTE':
      case 'PEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
      case 'ERR':
      case 'FALLIDA':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarjeta</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referencia</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">País</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTransactions && currentTransactions.map((transaction, index) => (
              <tr key={transaction.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.codTransaccion || transaction.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(transaction.fechaCreacion || transaction.fechaTransaccion)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(transaction.estado)}`}>
                    {transaction.estado}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${transaction.monto?.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.numeroTarjeta} ({transaction.marca})
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.referencia}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {transaction.pais || 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!currentTransactions || currentTransactions.length === 0) && (
          <div className="text-center py-4 text-gray-500">
            No se encontraron transacciones
          </div>
        )}
      </div>

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