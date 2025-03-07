import axios from 'axios';

// Obtener la URL base de la API desde variables de entorno
const HISTORIAL_API_URL = process.env.NEXT_PUBLIC_HISTORIAL_API_URL || 'https://procesatransaccion-alb-785318717.us-east-2.elb.amazonaws.com/api/v1/historial';
const TRANSACCION_API_URL = process.env.NEXT_PUBLIC_TRANSACCION_API_URL || 'https://procesatransaccion-alb-785318717.us-east-2.elb.amazonaws.com/api/v1/transacciones';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: TRANSACCION_API_URL,
  timeout: 10000, // 10 segundos de espera
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => {
    console.log('✅ Respuesta recibida de:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Error detallado:', {
      mensaje: error.message,
      url: error.config?.url,
      método: error.config?.method,
      estado: error.response?.status,
      datos: error.response?.data,
      código: error.code,
    });

    if (error.code === 'ERR_NETWORK') {
      console.error('⚠️ Error de red detectado, verifica la API.');
    }

    return Promise.reject(error);
  }
);

// Función para verificar si la API está accesible
const verificarAPI = async () => {
  try {
    const response = await fetch(TRANSACCION_API_URL, { method: 'HEAD' });
    if (!response.ok) throw new Error(`API no disponible (Status: ${response.status})`);
    console.log('✅ API accesible');
    return true;
  } catch (error) {
    console.error('❌ API no accesible:', error.message);
    return false;
  }
};

// Obtener transacciones por rango de fechas
export const getTransactionsByDateRange = async (desde, hasta) => {
  try {
    if (!(await verificarAPI())) throw new Error('La API no está disponible.');

    const desdeStr = new Date(desde).toISOString();
    const hastaStr = new Date(hasta).toISOString();
    const url = `${TRANSACCION_API_URL}/recientes?desde=${encodeURIComponent(desdeStr)}&hasta=${encodeURIComponent(hastaStr)}`;

    console.log('📡 Solicitando transacciones:', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('⚠️ Error al obtener transacciones:', error);
    return [];
  }
};

// Obtener todas las transacciones recientes (últimos 7 días)
export const getAllTransactions = async () => {
  const hoy = new Date();
  const hace7Dias = new Date(hoy);
  hace7Dias.setDate(hoy.getDate() - 7);
  return await getTransactionsByDateRange(hace7Dias, hoy);
};

// Obtener una transacción por ID
export const getTransactionById = async (id) => {
  try {
    if (!(await verificarAPI())) throw new Error('La API no está disponible.');

    const url = `${TRANSACCION_API_URL}/${id}`;
    console.log(`📡 Obteniendo transacción con ID ${id}: ${url}`);

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error(`⚠️ Error al obtener transacción ${id}:`, error);
    return null;
  }
};

// Obtener estadísticas de transacciones
export const getTransactionStats = async (desde, hasta) => {
  try {
    const transacciones = await getTransactionsByDateRange(desde, hasta);
    const completadas = transacciones.filter(t => t.estado === 'COMPLETADA').length;
    const pendientes = transacciones.filter(t => t.estado === 'PENDIENTE').length;
    const fallidas = transacciones.filter(t => t.estado === 'FALLIDA' || t.estado === 'ERROR').length;

    return {
      totalTransacciones: transacciones.length,
      completadas,
      pendientes,
      fallidas
    };
  } catch (error) {
    console.error('⚠️ Error al obtener estadísticas:', error);
    return {
      totalTransacciones: 0,
      completadas: 0,
      pendientes: 0,
      fallidas: 0
    };
  }
};

// Obtener transacciones fraudulentas
export const getFraudulentTransactions = async () => {
  try {
    const hasta = new Date();
    const desde = new Date();
    desde.setDate(hasta.getDate() - 30);

    const transacciones = await getTransactionsByDateRange(desde, hasta);
    return transacciones.filter(t => t.estado === 'FRAUDE');
  } catch (error) {
    console.error('⚠️ Error al obtener transacciones fraudulentas:', error);
    return [];
  }
};
