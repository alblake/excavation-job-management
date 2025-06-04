import { useEffect, useState } from "react";

interface VolumeCalculatorProps {
  cubicFeet: number;
  cubicYards: number;
  materialWeight?: number; // Material weight in pounds per cubic foot
  importUnitCost?: number; // Import unit cost per ton
}

export default function VolumeCalculator({ 
  cubicFeet, 
  cubicYards, 
  materialWeight = 145, // Default to 145 if not provided
  importUnitCost = 24.50 // Default to $24.50 if not provided
}: VolumeCalculatorProps) {
  const [highlight, setHighlight] = useState(false);
  
  // Calculate haul off and disposal charge ($37.50 per cubic yard)
  const HAUL_OFF_RATE = 37.50;
  const haulOffCharge = cubicYards * HAUL_OFF_RATE;
  
  // Calculate price per ton
  // Formula: (pounds per cubic foot × 27) ÷ 2000 = tons per cubic yard
  const tonsPerCubicYard = (materialWeight * 27) / 2000;
  
  // Calculate total weight in tons
  const totalTons = tonsPerCubicYard * cubicYards;
  
  // Calculate import cost (unit cost × total weight in tons)
  const importCost = importUnitCost * totalTons;

  // Visual feedback animation when values change
  useEffect(() => {
    setHighlight(true);
    const timer = setTimeout(() => {
      setHighlight(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [cubicFeet, cubicYards]);

  return (
    <div className="mt-6 bg-primary-50 p-4 rounded-md">
      {/* Weight Calculation Section */}
      <div className="mb-4 pb-4 border-b border-gray-200">
        <div className="flex justify-between items-center mt-3">
          <span className="text-sm font-bold text-gray-900">Weight per Cubic Yard:</span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              ({materialWeight} lbs/ft³ × 27) ÷ 2000 = tons per yd³
            </div>
            <span className="text-md font-semibold text-blue-600">
              {tonsPerCubicYard.toFixed(2)} tons per cubic yard
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-bold text-gray-900">Total Weight:</span>
          <span className="text-md font-semibold text-blue-600">
            {(tonsPerCubicYard * cubicYards).toFixed(2)} tons
          </span>
        </div>
      </div>

      {/* Volume Information */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">Total Volume:</span>
        <span className="text-sm text-gray-500">{cubicFeet.toFixed(2)} cubic feet</span>
      </div>
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm font-bold text-gray-900">Total Volume (cubic yards):</span>
        <span 
          className={`text-lg font-bold ${highlight ? 'text-primary-600' : 'text-primary-700'} transition-colors duration-300`}
        >
          {cubicYards.toFixed(2)}
        </span>
      </div>
      
      {/* Import Cost section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">Import Cost:</span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {totalTons.toFixed(2)} tons × ${importUnitCost.toFixed(2)}
            </div>
            <span className="text-lg font-bold text-green-600">
              ${importCost.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Haul Off and Disposal section */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <span className="text-sm font-bold text-gray-900">Haul Off and Disposal:</span>
          <div className="text-right">
            <div className="text-xs text-gray-500">
              {cubicYards.toFixed(2)} cubic yards × $37.50
            </div>
            <span className="text-lg font-bold text-green-600">
              ${haulOffCharge.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}