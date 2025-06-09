
import React from "react";
import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
  color?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({
  title,
  description,
  icon: Icon,
  path,
  color = "text-pdf-blue"
}) => {
  const navigate = useNavigate();
  
  return (
    <div 
      className="pdf-tool-card h-full cursor-pointer animate-fade-in"
      onClick={() => navigate(path)}
    >
      <div className="p-6 h-full flex flex-col">
        <div className={`${color} mb-4`}>
          <Icon className="h-10 w-10" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm flex-grow">{description}</p>
        <div className="mt-4">
          <span className="text-pdf-blue text-sm font-medium hover:underline">
            Use Tool →
          </span>
        </div>
      </div>
    </div>
  );
};

export default ToolCard;
