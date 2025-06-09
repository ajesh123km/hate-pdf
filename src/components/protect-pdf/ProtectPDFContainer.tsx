
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import ProtectPDFForm from "./ProtectPDFForm";

const ProtectPDFContainer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const { toast } = useToast();

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      
      try {
        const fileArrayBuffer = await files[0].arrayBuffer();
        const uint8Array = new Uint8Array(fileArrayBuffer);
        
        // Basic validation to ensure it's a PDF
        const pdfHeader = new TextDecoder().decode(uint8Array.slice(0, 4));
        if (pdfHeader !== '%PDF') {
          throw new Error('Invalid PDF file');
        }
        
        setPdfBytes(uint8Array);
        
        toast({
          title: "PDF Loaded Successfully",
          description: `File "${files[0].name}" is ready for password protection`,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          variant: "destructive",
          title: "Error Loading PDF",
          description: "Please ensure you've selected a valid PDF file.",
        });
        setFile(null);
        setPdfBytes(null);
      }
    }
  };

  const resetTool = () => {
    setFile(null);
    setPdfBytes(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Helmet>
        <title>Protect PDF | PDF Craft Pro</title>
        <meta name="description" content="Add password protection to your PDF documents" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Protect PDF</h1>
        <p className="text-gray-600 mt-2">
          Add strong password protection to your PDF documents. Protected PDFs will require the correct password to open.
        </p>
      </div>

      {!file ? (
        <Card>
          <CardContent className="pt-6">
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept=".pdf"
              multiple={false}
              maxFiles={1}
            />
          </CardContent>
        </Card>
      ) : (
        <ProtectPDFForm 
          file={file}
          pdfBytes={pdfBytes}
          onReset={resetTool}
        />
      )}
    </div>
  );
};

export default ProtectPDFContainer;
