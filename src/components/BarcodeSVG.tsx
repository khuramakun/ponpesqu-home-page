import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeSVGProps {
  value: string;
  width?: string | number;
  height?: string | number;
  className?: string;
}

export function BarcodeSVG({ value, width = "130", height = "36", className = "barcode-svg" }: BarcodeSVGProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          width: 2,
          height: 40,
          displayValue: false,
          margin: 4,
          background: "#ffffff",
          lineColor: "#000000"
        });
      } catch (err) {
        console.error("Failed to generate barcode via JsBarcode:", err);
      }
    }
  }, [value]);

  return (
    <svg 
      ref={svgRef}
      className={className}
      style={{ width: typeof width === 'number' ? `${width}px` : width, height: typeof height === 'number' ? `${height}px` : height }}
    />
  );
}
