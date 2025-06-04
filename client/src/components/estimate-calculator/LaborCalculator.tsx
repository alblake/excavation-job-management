import { useEffect, useState } from "react";

interface LaborCalculatorProps {
  estimatedHours: number;
}

export default function LaborCalculator({ estimatedHours = 0 }: LaborCalculatorProps) {
  const [highlight, setHighlight] = useState(false);
  
  // Calculate labor cost for 250 series excavator at $250/hour
  const EXCAVATOR_250_RATE = 250;
  const excavator250Cost = estimatedHours * EXCAVATOR_250_RATE;
  
  // Calculate labor cost for 200 series excavator at $200/hour
  const EXCAVATOR_200_RATE = 200;
  const excavator200Cost = estimatedHours * EXCAVATOR_200_RATE;
  
  // Calculate labor cost for 320 series loader at $200/hour
  const LOADER_RATE = 200;
  const loaderCost = estimatedHours * LOADER_RATE;
  
  // Calculate crew costs
  const PIPE_GUY_RATE = 45;
  const TOP_GUY_RATE = 40;
  const pipeGuyCost = estimatedHours * PIPE_GUY_RATE;
  const topGuyCost = estimatedHours * TOP_GUY_RATE;
  
  // Calculate total costs
  const totalEquipmentCost = excavator250Cost + excavator200Cost + loaderCost;
  const totalCrewCost = pipeGuyCost + topGuyCost;
  
  // Visual feedback animation when values change
  useEffect(() => {
    setHighlight(true);
    const timer = setTimeout(() => {
      setHighlight(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [estimatedHours]);

  return (
    <div className="mt-6 bg-primary-50 p-4 rounded-md">
      <h3 className="text-lg font-bold text-gray-900 mb-3">Labor Cost Calculation</h3>
      
      {/* Labor Information */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-bold text-gray-900">Estimated Hours:</span>
          <span className="text-md font-semibold text-blue-600">
            {estimatedHours.toFixed(1)} hours
          </span>
        </div>
      </div>

      {/* Labor Cost */}
      <div className="mt-4 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">250 Series Excavator:</span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {estimatedHours.toFixed(1)} hours × $250.00
            </div>
            <span 
              className={`text-lg font-bold ${highlight ? 'text-green-500' : 'text-green-600'} transition-colors duration-300`}
            >
              ${excavator250Cost.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-900">200 Series Excavator:</span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {estimatedHours.toFixed(1)} hours × $200.00
            </div>
            <span 
              className={`text-lg font-bold ${highlight ? 'text-green-500' : 'text-green-600'} transition-colors duration-300`}
            >
              ${excavator200Cost.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <span className="text-sm font-bold text-gray-900">320 Series Loader:</span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {estimatedHours.toFixed(1)} hours × $200.00
            </div>
            <span 
              className={`text-lg font-bold ${highlight ? 'text-green-500' : 'text-green-600'} transition-colors duration-300`}
            >
              ${loaderCost.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-200">
          <span className="text-sm font-bold text-gray-900">Total Equipment Cost:</span>
          <span className="text-xl font-bold text-blue-600">
            ${totalEquipmentCost.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Crew Costs Section */}
      <div className="mt-6 bg-orange-50 p-4 rounded-md">
        <h4 className="text-lg font-bold text-gray-900 mb-3">Crew Costs</h4>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">Pipe Guy:</span>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {estimatedHours.toFixed(1)} hours × $45.00
              </div>
              <span 
                className={`text-lg font-bold ${highlight ? 'text-orange-500' : 'text-orange-600'} transition-colors duration-300`}
              >
                ${pipeGuyCost.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-2 border-t border-orange-100">
            <span className="text-sm font-bold text-gray-900">Top Guy:</span>
            <div className="text-right">
              <div className="text-xs text-gray-500">
                {estimatedHours.toFixed(1)} hours × $40.00
              </div>
              <span 
                className={`text-lg font-bold ${highlight ? 'text-orange-500' : 'text-orange-600'} transition-colors duration-300`}
              >
                ${topGuyCost.toFixed(2)}
              </span>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-3 mt-2 border-t border-orange-200">
            <span className="text-sm font-bold text-gray-900">Total Crew Cost:</span>
            <span className="text-xl font-bold text-orange-700">
              ${totalCrewCost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Combined Total */}
      <div className="mt-4 bg-gray-100 p-4 rounded-md">
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-gray-900">Combined Labor Total:</span>
          <span className="text-2xl font-bold text-purple-700">
            ${(totalEquipmentCost + totalCrewCost).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}