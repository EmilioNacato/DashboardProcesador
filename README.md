# Dashboard de Transacciones Bancarias

Este microservicio proporciona una interfaz gráfica para visualizar el historial de transacciones procesadas por el sistema Banquito.

## Características

- Visualización del historial de transacciones
- Filtrado por estado (completas, pendientes, fallidas)
- Estadísticas generales del procesamiento de transacciones
- Gráficos de actividad y volumen de transacciones

## Tecnologías

- Frontend: Next.js / React
- Comunicación con microservicios: Axios / Fetch API

## Estructura del Proyecto

- `/pages`: Rutas y componentes principales de Next.js
- `/components`: Componentes reutilizables de React
- `/services`: Servicios para comunicarse con otros microservicios
- `/styles`: Estilos CSS/SCSS para la aplicación
- `/utils`: Funciones de utilidad y helpers

## Configuración

Para ejecutar el proyecto localmente:

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en modo producción
npm start
```

## Integración con Otros Microservicios

Este dashboard se comunica con:
- Microservicio de procesamiento de transacciones: Para obtener el historial de transacciones
- Otros microservicios del sistema según sea necesario

## API Endpoints Utilizados

- `GET /api/v1/transacciones` - Obtiene todas las transacciones
- `GET /api/v1/transacciones/{id}` - Obtiene detalles de una transacción específica
- `GET /api/v1/transacciones/estado/{estado}` - Filtra transacciones por estado 