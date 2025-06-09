
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import { isProtectedPDF } from "@/utils/pdfProtection";
import UnlockPDFForm from "./UnlockPDFForm";

const UnlockPDFContainer = () => {
  const [file, setFile] = useState<File | null>(null);
  const [encryptedBytes, setEncryptedBytes] = useState<Uint8Array | null>(null);
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
          toast({
            variant: "destructive",
            title: "Invalid File",
            description: "Please select a valid PDF file.",
          });
          setFile(null);
          return;
        }
        
        // Check if PDF is password protected
        const isProtected = await isProtectedPDF(uint8Array);
        if (!isProtected) {
          toast({
            title: "PDF Not Protected",
            description: "This PDF doesn't appear to be password protected.",
          });
          setFile(null);
          return;
        }
        
        setEncryptedBytes(uint8Array);
        
        toast({
          title: "Protected PDF Loaded",
          description: `File "${files[0].name}" is ready for unlocking`,
        });
      } catch (error) {
        console.error("Error loading file:", error);
        toast({
          variant: "destructive",
          title: "Error Loading File",
          description: "There was an error loading your PDF file.",
        });
        setFile(null);
        setEncryptedBytes(null);
      }
    }
  };

  const resetTool = () => {
    setFile(null);
    setEncryptedBytes(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Helmet>
        <title>Unlock PDF | PDF Craft Pro</title>
        <meta name="description" content="Unlock password-protected PDF documents" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Unlock PDF</h1>
        <p className="text-gray-600 mt-2">
          Unlock password-protected PDF documents
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
        <UnlockPDFForm 
          file={file}
          encryptedBytes={encryptedBytes}
          onReset={resetTool}
        />
      )}
    </div>
  );
};

export default UnlockPDFContainer;
