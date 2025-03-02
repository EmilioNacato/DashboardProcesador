import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TransactionChart = ({ data, chartType = 'line' }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  
  useEffect(() => {
    // Destruir el gráfico existente si hay uno
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Asegurarse de que tenemos datos para mostrar
    if (!data || !data.labels || !data.completadas || !data.pendientes || !data.fallidas) {
      console.error('Datos de gráfico no válidos:', data);
      
      // Usar datos mínimos por defecto en caso de no tener datos válidos
      data = {
        labels: [],
        completadas: [],
        pendientes: [],
        fallidas: []
      };
    }
    
    // Si no hay datos, mostrar un mensaje
    if (data.labels.length === 0) {
      const ctx = chartRef.current.getContext('2d');
      ctx.font = '16px Arial';
      ctx.fillStyle = '#777';
      ctx.textAlign = 'center';
      ctx.fillText('No hay transacciones para mostrar en el período seleccionado', chartRef.current.width / 2, chartRef.current.height / 2);
      return;
    }

    // Encontrar el valor máximo para ajustar la escala
    const maxValue = Math.max(
      ...data.completadas,
      ...data.pendientes,
      ...data.fallidas
    );
    
    // Determinar el valor máximo del eje Y: como mínimo 5, o un 30% más que el valor máximo
    const yAxisMax = Math.max(5, Math.ceil(maxValue * 1.3));

    // Crear un nuevo gráfico con los datos proporcionados
    const ctx = chartRef.current.getContext('2d');
    
    // Configuración del gráfico
    const chartConfig = {
      type: chartType,
      data: {
        labels: data.labels,
        datasets: [
          {
            label: 'Completadas',
            data: data.completadas,
            backgroundColor: 'rgba(46, 125, 50, 0.15)',
            borderColor: 'rgba(46, 125, 50, 1)',
            borderWidth: 3,
            tension: 0.3,
            fill: chartType === 'line',
            pointRadius: 6,
            pointHoverRadius: 9,
            pointBackgroundColor: 'rgba(46, 125, 50, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHitRadius: 12
          },
          {
            label: 'Pendientes',
            data: data.pendientes,
            backgroundColor: 'rgba(255, 143, 0, 0.15)',
            borderColor: 'rgba(255, 143, 0, 1)',
            borderWidth: 3,
            tension: 0.3,
            fill: chartType === 'line',
            pointRadius: 6,
            pointHoverRadius: 9,
            pointBackgroundColor: 'rgba(255, 143, 0, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHitRadius: 12
          },
          {
            label: 'Fallidas',
            data: data.fallidas,
            backgroundColor: 'rgba(198, 40, 40, 0.15)',
            borderColor: 'rgba(198, 40, 40, 1)',
            borderWidth: 3,
            tension: 0.3,
            fill: chartType === 'line',
            pointRadius: 6,
            pointHoverRadius: 9,
            pointBackgroundColor: 'rgba(198, 40, 40, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointHitRadius: 12
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 15,
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              font: {
                size: 13,
                weight: 'bold'
              }
            }
          },
          title: {
            display: true,
            text: chartType === 'line' ? 'Volumen de Transacciones por Fecha' : 'Transacciones por Fecha',
            font: {
              size: 16,
              weight: 'bold'
            },
            padding: {
              top: 10,
              bottom: 20
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#333',
            titleFont: {
              weight: 'bold'
            },
            bodyColor: '#666',
            borderColor: '#ddd',
            borderWidth: 1,
            cornerRadius: 4,
            padding: 10,
            usePointStyle: true,
            callbacks: {
              // Mostrar el total de transacciones por día en el tooltip
              footer: (tooltipItems) => {
                let total = 0;
                tooltipItems.forEach(item => {
                  total += item.parsed.y;
                });
                return 'Total: ' + total + ' transacciones';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(200, 200, 200, 0.3)',
              drawBorder: true,
              drawOnChartArea: true
            },
            border: {
              display: true,
              width: 1,
              color: 'rgba(0, 0, 0, 0.1)'
            },
            // Configurar máximo del eje Y para pocas transacciones
            max: yAxisMax,
            min: 0, // Forzar inicio en 0
            // Ajustar el step size para que tengamos suficientes líneas de cuadrícula
            ticks: {
              stepSize: Math.max(1, Math.ceil(yAxisMax / 5)),
              precision: 0,
              font: {
                size: 12,
                weight: 'bold'
              },
              color: '#666',
              padding: 10,
              // Mostrar etiqueta del cero
              includeBounds: true
            },
            title: {
              display: true,
              text: 'Número de Transacciones',
              font: {
                size: 13,
                weight: 'bold'
              },
              color: '#555',
              padding: {
                bottom: 10
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            // Importante: ajustar el espacio de inicio y fin para que el gráfico ocupe todo el ancho
            offset: false,
            ticks: {
              font: {
                size: 13,
                weight: 'bold'
              },
              color: '#555',
              padding: 10,
              // Si tenemos pocas fechas, mostrar todas
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false
            },
            title: {
              display: true,
              text: 'Fecha (DD/MM)',
              font: {
                size: 13,
                weight: 'bold'
              },
              color: '#555',
              padding: {
                top: 10
              }
            }
          }
        },
        layout: {
          padding: {
            left: 0,
            right: 30,
            top: 20,
            bottom: 10
          }
        },
        animations: {
          tension: {
            duration: 1000,
            easing: 'linear',
            from: 0.3,
            to: 0.3,
            loop: false
          }
        },
        elements: {
          line: {
            tension: 0.3
          },
          point: {
            // Aumentar el tamaño de los puntos para mejor visualización
            radius: 6,
            hoverRadius: 9
          }
        },
        // Plugins personalizados para mostrar etiquetas de valores
        plugins: [{
          id: 'valueLabels',
          afterDatasetsDraw: function(chart) {
            const ctx = chart.ctx;
            
            chart.data.datasets.forEach((dataset, datasetIndex) => {
              const meta = chart.getDatasetMeta(datasetIndex);
              if (!meta.hidden) {
                meta.data.forEach((element, index) => {
                  // Solo mostrar etiqueta si el valor es mayor que 0
                  const value = dataset.data[index];
                  if (value > 0) {
                    // Configurar estilos de texto
                    ctx.fillStyle = dataset.borderColor;
                    ctx.font = 'bold 13px Arial';
                    ctx.textAlign = 'center';
                    
                    // Posición para gráficos de línea
                    if (chart.config.type === 'line') {
                      ctx.fillText(value, element.x, element.y - 15);
                    }
                    // Posición para gráficos de barras
                    else if (chart.config.type === 'bar') {
                      ctx.fillText(value, element.x, element.y - 10);
                    }
                  }
                });
              }
            });
          }
        },
        // Añadir línea vertical en cada punto para mejorar legibilidad
        {
          id: 'verticalLines',
          beforeDatasetsDraw: function(chart) {
            // Dibujar líneas verticales desde el eje x hasta cada punto
            if (chart.config.type === 'line' && data.labels.length <= 7) {
              const ctx = chart.ctx;
              const xAxis = chart.scales.x;
              const yAxis = chart.scales.y;
              
              ctx.save();
              ctx.lineWidth = 1;
              ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
              ctx.setLineDash([5, 5]);
              
              // Dibujar línea para cada punto en el eje X
              xAxis.ticks.forEach((value, index) => {
                const x = xAxis.getPixelForTick(index);
                ctx.beginPath();
                ctx.moveTo(x, yAxis.top);
                ctx.lineTo(x, yAxis.bottom);
                ctx.stroke();
              });
              
              ctx.restore();
            }
          }
        }]
      }
    };

    // Si es un gráfico de barras, ajustar algunas propiedades
    if (chartType === 'bar') {
      chartConfig.data.datasets.forEach(dataset => {
        dataset.tension = 0;
        dataset.fill = false;
        dataset.borderWidth = 1;
        dataset.borderColor = dataset.backgroundColor.replace('0.15', '1');
        dataset.backgroundColor = dataset.backgroundColor.replace('0.15', '0.7');
      });
      
      // Ajustar opciones específicas para barras
      chartConfig.options.scales.x.stacked = false;
      chartConfig.options.scales.y.stacked = false;
      
      // Ajustar ancho de barras según cantidad de datos
      if (data.labels.length <= 3) {
        chartConfig.options.barPercentage = 0.5;
        chartConfig.options.categoryPercentage = 0.7;
      } else if (data.labels.length <= 7) {
        chartConfig.options.barPercentage = 0.7;
        chartConfig.options.categoryPercentage = 0.8;
      } else {
        chartConfig.options.barPercentage = 0.9;
        chartConfig.options.categoryPercentage = 0.8;
      }
      
      // Si son muy pocas fechas, centrar las barras
      if (data.labels.length <= 2) {
        chartConfig.options.scales.x.offset = true;
      }
    }
    
    // Crear el gráfico
    chartInstance.current = new Chart(ctx, chartConfig);
    
    // Limpiar al desmontar
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, chartType]);

  return (
    <div className="chart-container">
      <canvas ref={chartRef}></canvas>
      <style jsx>{`
        .chart-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-bottom: 30px;
          height: 400px;
          position: relative;
          width: 100%;
        }
      `}</style>
    </div>
  );
};

export default TransactionChart; 