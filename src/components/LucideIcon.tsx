import React from 'react';
import * as Icons from 'lucide-react';

export function LucideIcon({ name, className }: { name: string; className?: string }) {
  // Ubah kebab-case (misal: layout-dashboard) ke PascalCase (misal: LayoutDashboard)
  const pascalName = name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
    
  const IconComponent = 
    (Icons as any)[pascalName] || 
    (Icons as any)[name] || 
    Icons.HelpCircle;

  return <IconComponent className={className} />;
}
