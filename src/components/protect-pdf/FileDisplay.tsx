
import React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileDisplayProps {
  fileName: string;
  onChangeFile: () => void;
}

const FileDisplay = ({ fileName, onChangeFile }: FileDisplayProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center">
        <FileText className="h-10 w-10 text-pdf-blue mr-3" />
        <div>
          <h3 className="font-semibold">{fileName}</h3>
          <p className="text-sm text-gray-500">Ready to protect</p>
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onChangeFile}>
        Change File
      </Button>
    </div>
  );
};

export default FileDisplay;
