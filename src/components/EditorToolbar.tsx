
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Type, 
  Highlighter, 
  Pen, 
  Image, 
  Signature, 
  Square, 
  Circle, 
  Minus, 
  FileText,
  Eraser,
  Move,
  Stamp,
  FilePlus
} from "lucide-react";

interface EditorToolbarProps {
  activeMode: string;
  onModeChange: (mode: string) => void;
}

const EditorToolbar = ({ activeMode, onModeChange }: EditorToolbarProps) => {
  const tools = [
    { id: "text", label: "Add Text", icon: Type },
    { id: "highlight", label: "Highlight", icon: Highlighter },
    { id: "draw", label: "Draw", icon: Pen },
    { id: "image", label: "Add Image", icon: Image },
    { id: "shapes", label: "Shapes", icon: Square },
    { id: "signature", label: "Signature", icon: Signature },
    { id: "forms", label: "Fill Forms", icon: FileText },
    { id: "erase", label: "Erase", icon: Eraser },
    { id: "watermark", label: "Watermark", icon: Stamp },
    { id: "rearrange", label: "Rearrange", icon: Move },
    { id: "addpages", label: "Add Pages", icon: FilePlus }
  ];

  return (
    <div className="flex flex-wrap gap-2 p-3 bg-white border rounded-md shadow-sm">
      {tools.map((tool) => {
        const Icon = tool.icon;
        return (
          <Button
            key={tool.id}
            variant={activeMode === tool.id ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange(tool.id)}
            className="flex items-center gap-2"
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{tool.label}</span>
          </Button>
        );
      })}
    </div>
  );
};

export default EditorToolbar;
