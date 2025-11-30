import React from 'react';

const ChartControls = ({ options, onOptionsChange }) => {
  const handleChange = (e) => {
    onOptionsChange({ ...options, [e.target.name]: e.target.value });
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Customize Chart</h3>
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">Chart Title</label>
        <input type="text" name="title" value={options.title} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="xAxisLabel" className="block text-sm font-medium text-gray-700">X-Axis Label</label>
        <input type="text" name="xAxisLabel" value={options.xAxisLabel} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="yAxisLabel" className="block text-sm font-medium text-gray-700">Y-Axis Label</label>
        <input type="text" name="yAxisLabel" value={options.yAxisLabel} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="color" className="block text-sm font-medium text-gray-700">Chart Color</label>
        <input type="color" name="color" value={options.color} onChange={handleChange} className="mt-1 block w-full h-10 p-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label htmlFor="orientation" className="block text-sm font-medium text-gray-700">Orientation</label>
        <select name="orientation" value={options.orientation} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
          <option value="vertical">Vertical</option>
          <option value="horizontal">Horizontal</option>
        </select>
      </div>
    </div>
  );
};

export default ChartControls;