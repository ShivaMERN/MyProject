import React, { useRef, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import {
  Bar,
  Line,
  Pie,
  Doughnut,
  Scatter
} from 'react-chartjs-2';
import axios from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ChartCanvas = ({ data, options: chartOptions, chartType: initialChartType = 'bar' }) => {
  const [chartType, setChartType] = useState(initialChartType);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const { user } = useAuth();
  const chartRef = useRef(null);

  // Transform data for Chart.js based on chart type
  const transformData = (rawData, type) => {
    if (!rawData || !rawData.data || rawData.data.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const excelData = rawData.data;
    const analysis = rawData.analysis;

    if (!analysis || !analysis.columns || analysis.columns.length === 0) {
      return {
        labels: [],
        datasets: []
      };
    }

    const columns = analysis.columns;
    const numericColumns = columns.filter(col => analysis.dataTypes[col]?.type === 'numeric');
    const categoricalColumns = columns.filter(col => analysis.dataTypes[col]?.type === 'categorical');

    let labels = [];
    let datasets = [];

    switch (type) {
      case 'bar':
      case 'line':
        if (categoricalColumns.length > 0 && numericColumns.length > 0) {
          labels = excelData.map(row => row[categoricalColumns[0]] || 'N/A');
          datasets = [{
            label: numericColumns[0],
            data: excelData.map(row => parseFloat(row[numericColumns[0]]) || 0),
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 1,
            fill: type === 'line' ? false : undefined
          }];
        }
        break;

      case 'pie':
      case 'doughnut':
        if (categoricalColumns.length > 0 && numericColumns.length > 0) {
          labels = excelData.map(row => row[categoricalColumns[0]] || 'N/A');
          datasets = [{
            data: excelData.map(row => parseFloat(row[numericColumns[0]]) || 0),
            backgroundColor: [
              'rgba(255, 99, 132, 0.6)',
              'rgba(54, 162, 235, 0.6)',
              'rgba(255, 206, 86, 0.6)',
              'rgba(75, 192, 192, 0.6)',
              'rgba(153, 102, 255, 0.6)',
              'rgba(255, 159, 64, 0.6)',
              'rgba(199, 199, 199, 0.6)',
              'rgba(83, 102, 255, 0.6)'
            ]
          }];
        }
        break;

      case 'scatter':
        if (numericColumns.length >= 2) {
          datasets = [{
            label: 'Data Points',
            data: excelData.map(row => ({
              x: parseFloat(row[numericColumns[0]]) || 0,
              y: parseFloat(row[numericColumns[1]]) || 0
            })),
            backgroundColor: 'rgba(59, 130, 246, 0.6)'
          }];
        }
        break;

      default:
        labels = excelData.map((_, index) => `Row ${index + 1}`);
        datasets = [{
          label: 'Data',
          data: excelData.map(row => Object.values(row)[0] || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.5)'
        }];
    }

    return {
      labels,
      datasets,
      title: chartOptions?.title || 'Chart'
    };
  };

  const chartData = transformData(data, chartType);

  const chartOptionsConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: chartOptions?.title || 'Chart',
      },
    },
    scales: chartType !== 'pie' && chartType !== 'doughnut' ? {
      x: {
        title: {
          display: true,
          text: chartOptions?.xAxisLabel || 'X Axis',
        },
      },
      y: {
        title: {
          display: true,
          text: chartOptions?.yAxisLabel || 'Y Axis',
        },
      },
    } : undefined,
  };

  const exportChart = async (format) => {
    if (!data || !user?.token) {
      setExportError('No data available for export or user not authenticated');
      return;
    }

    setExporting(true);
    setExportError(null);

    try {
      let response;

      if (format === 'pdf') {
        response = await axios.post('/api/enhanced-chart/export/pdf', {
          chartData,
          chartType,
          title: chartOptions?.title || 'Chart',
          width: 800,
          height: 600
        }, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          responseType: 'blob'
        });
      } else if (format === 'png') {
        response = await axios.post('/api/enhanced-chart/export/png', {
          chartData,
          chartType,
          title: chartOptions?.title || 'Chart',
          width: 800,
          height: 600
        }, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          responseType: 'blob'
        });
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${chartOptions?.title || 'chart'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Export error:', error);
      setExportError(`Failed to export ${format.toUpperCase()}: ${error.response?.data?.message || error.message}`);
    } finally {
      setExporting(false);
    }
  };

  const renderChart = () => {
    const commonProps = {
      ref: chartRef,
      data: chartData,
      options: chartOptionsConfig
    };

    switch (chartType) {
      case 'line':
        return <Line {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      case 'scatter':
        return <Scatter {...commonProps} />;
      default:
        return <Bar {...commonProps} />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'bar'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Bar Chart
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'line'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Line Chart
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'pie'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pie Chart
        </button>
        <button
          onClick={() => setChartType('doughnut')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'doughnut'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Doughnut Chart
        </button>
        <button
          onClick={() => setChartType('scatter')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'scatter'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Scatter Plot
        </button>
      </div>

      {/* Chart Display */}
      <div className="bg-white p-4 rounded-lg shadow">
        {chartData.labels.length > 0 ? (
          <div className="h-96">
            {renderChart()}
          </div>
        ) : (
          <div className="h-96 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No data available for chart generation</p>
              <p className="text-sm">Upload an Excel file to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Export Controls */}
      {chartData.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => exportChart('png')}
            disabled={exporting}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            Download PNG
          </button>

          <button
            onClick={() => exportChart('pdf')}
            disabled={exporting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {exporting ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            Download PDF
          </button>
        </div>
      )}

      {/* Export Error */}
      {exportError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{exportError}</p>
        </div>
      )}

      {/* Data Analysis Summary */}
      {data?.analysis && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Data Analysis</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Rows:</span> {data.analysis.rowCount}
            </div>
            <div>
              <span className="font-medium">Columns:</span> {data.analysis.columnCount}
            </div>
            <div>
              <span className="font-medium">Numeric:</span> {Object.keys(data.analysis.dataTypes).filter(col => data.analysis.dataTypes[col].type === 'numeric').length}
            </div>
            <div>
              <span className="font-medium">Categorical:</span> {Object.keys(data.analysis.dataTypes).filter(col => data.analysis.dataTypes[col].type === 'categorical').length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartCanvas;