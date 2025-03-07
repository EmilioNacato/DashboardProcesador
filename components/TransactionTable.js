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
        <table className="min-w-full bg-white border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Fecha</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Estado</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Monto</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Tarjeta</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">Referencia</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider border-b">País</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTransactions && currentTransactions.map((transaction, index) => (
              <tr key={transaction.id || index} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 text-sm text-gray-900 border-b border-gray-100 min-w-[180px]">
                  <div className="font-medium truncate">{transaction.codTransaccion || transaction.id}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100 min-w-[150px]">
                  <div>{formatDate(transaction.fechaCreacion || transaction.fechaTransaccion)}</div>
                </td>
                <td className="px-6 py-4 border-b border-gray-100 min-w-[120px]">
                  <span className={`px-3 py-1 inline-flex text-sm leading-5 font-medium rounded-full ${getStatusColor(transaction.estado)}`}>
                    {getStatusName(transaction.estado)}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100 min-w-[100px]">
                  <div className="font-medium">{formatAmount(transaction.monto)}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100 min-w-[200px]">
                  <div>
                    <span className="font-medium">{formatCardNumber(transaction.numeroTarjeta)}</span>
                    {transaction.marca && (
                      <span className="ml-2 text-gray-500">({transaction.marca})</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100 min-w-[200px]">
                  <div className="truncate max-w-[250px]">{transaction.referencia}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 border-b border-gray-100 min-w-[80px]">
                  <div>{transaction.pais || 'N/A'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!currentTransactions || currentTransactions.length === 0) && (
          <div className="text-center py-8 text-gray-500">
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
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          padding: 24px;
          margin-bottom: 30px;
          overflow-x: auto;
        }
        
        .filters {
          display: flex;
          margin-bottom: 24px;
          gap: 16px;
        }
        
        .search-input, .status-filter {
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          width: 100%;
          max-width: 400px;
          transition: all 0.2s;
        }
        
        .search-input:focus, .status-filter:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .status-filter {
          max-width: 200px;
        }

        table {
          border-collapse: separate;
          border-spacing: 0;
          width: 100%;
        }

        th {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        td {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 24px;
          gap: 16px;
        }
        
        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: white;
          color: #4b5563;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .page-info {
          color: #6b7280;
          font-size: 14px;
        }
        
        @media (max-width: 768px) {
          .filters {
            flex-direction: column;
          }
          
          .search-input, .status-filter {
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionTable; 