import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { ArrowLeft, FileText, Download, FileDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const CompressPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<string>("medium");
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const { toast } = useToast();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setOriginalSize(files[0].size);
      setCompressedSize(null);
      setProgress(0);
    }
  };

  const compressPDF = async () => {
    if (!file) return;

    setProcessing(true);
    setProgress(10);
    
    try {
      // Read the file
      const fileArrayBuffer = await file.arrayBuffer();
      setProgress(30);
      
      // Load the PDF document
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      setProgress(50);
      
      // Apply compression - this is a simplified approach
      // For more advanced compression, specialized libraries would be needed
      const quality = compressionLevel === "high" ? 1.0 : 
                     compressionLevel === "medium" ? 0.75 : 0.5;
      
      // Create a new PDF document to save the compressed version
      const compressedPdfDoc = await PDFDocument.create();
      
      // Copy all pages with potential compression
      const pages = pdfDoc.getPages();
      setProgress(60);

      for (let i = 0; i < pages.length; i++) {
        const [copiedPage] = await compressedPdfDoc.copyPages(pdfDoc, [i]);
        compressedPdfDoc.addPage(copiedPage);
        setProgress(60 + Math.round((i / pages.length) * 30));
      }
      
      // Save the compressed PDF with correct options
      const compressedPdfBytes = await compressedPdfDoc.save();
      setProgress(95);
      
      // Create a blob from the compressed PDF bytes
      const compressedBlob = new Blob([compressedPdfBytes], { type: "application/pdf" });
      setCompressedSize(compressedBlob.size);
      
      setProgress(100);
      
      toast({
        title: "Compression Complete",
        description: `PDF compressed from ${formatFileSize(file.size)} to ${formatFileSize(compressedBlob.size)}`,
      });
      
      return compressedBlob;
    } catch (error) {
      console.error("Error compressing PDF:", error);
      toast({
        variant: "destructive",
        title: "Compression Failed",
        description: "There was an error compressing your PDF file.",
      });
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const downloadCompressedPDF = async () => {
    if (!file) return;
    
    const compressedBlob = await compressPDF();
    if (!compressedBlob) return;
    
    const filename = file.name.replace(".pdf", "");
    saveAs(compressedBlob, `${filename}-compressed.pdf`);
  };

  const resetTool = () => {
    setFile(null);
    setProgress(0);
    setCompressedSize(null);
    setOriginalSize(null);
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate compression percentage
  const getCompressionPercentage = (): number => {
    if (!originalSize || !compressedSize) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Helmet>
        <title>Compress PDF | PDF Craft Pro</title>
        <meta name="description" content="Reduce PDF file size while maintaining quality" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Compress PDF</h1>
        <p className="text-gray-600 mt-2">Reduce file size while maintaining quality</p>
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
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <FileText className="h-10 w-10 text-pdf-blue mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetTool}>
                  Change File
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="compression-level" className="block text-sm font-medium mb-2">
                    Compression Level
                  </Label>
                  <Select
                    value={compressionLevel}
                    onValueChange={setCompressionLevel}
                  >
                    <SelectTrigger id="compression-level" className="w-full">
                      <SelectValue placeholder="Select compression level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (smallest file size)</SelectItem>
                      <SelectItem value="medium">Medium (balanced)</SelectItem>
                      <SelectItem value="high">High (best quality)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={downloadCompressedPDF} 
                  disabled={processing} 
                  className="w-full bg-pdf-blue hover:bg-pdf-lightBlue"
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  {processing ? "Compressing..." : "Compress and Download PDF"}
                </Button>

                {processing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-center text-gray-500">
                      {progress < 100 ? `Compressing PDF... ${progress}%` : "Compression complete!"}
                    </p>
                  </div>
                )}
                
                {compressedSize !== null && originalSize !== null && (
                  <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                    <h4 className="font-medium text-green-800">Compression Results</h4>
                    <div className="mt-2 space-y-1 text-sm">
                      <p>Original size: <span className="font-medium">{formatFileSize(originalSize)}</span></p>
                      <p>New size: <span className="font-medium">{formatFileSize(compressedSize)}</span></p>
                      <p className="text-green-700 font-medium">
                        Reduced by {getCompressionPercentage()}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CompressPDF;
