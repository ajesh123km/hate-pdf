
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { saveAs } from "file-saver";
import { ArrowLeft, FileText, FileDown, Droplets } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const WatermarkPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [opacity, setOpacity] = useState(0.5);
  const [position, setPosition] = useState<"center" | "diagonal" | "bottom-right">("diagonal");
  const [isProcessing, setIsProcessing] = useState(false);
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
          description: `File "${files[0].name}" is ready for watermarking`,
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

  const addWatermark = async () => {
    if (!pdfBytes || !file || !watermarkText.trim()) return;
    
    setIsProcessing(true);
    try {
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      
      pages.forEach((page) => {
        const { width, height } = page.getSize();
        
        let x, y, rotation;
        
        switch (position) {
          case "center":
            x = width / 2;
            y = height / 2;
            rotation = 0;
            break;
          case "diagonal":
            x = width / 2;
            y = height / 2;
            rotation = -45;
            break;
          case "bottom-right":
            x = width - 100;
            y = 50;
            rotation = 0;
            break;
        }
        
        page.drawText(watermarkText, {
          x,
          y,
          size: 48,
          font,
          color: rgb(0.7, 0.7, 0.7),
          opacity,
          rotate: rotation ? { type: 'degrees', angle: rotation } : undefined,
        });
      });
      
      const watermarkedPdfBytes = await pdfDoc.save();
      const blob = new Blob([watermarkedPdfBytes], { type: "application/pdf" });
      
      const filename = file.name.replace(".pdf", "");
      saveAs(blob, `${filename}-watermarked.pdf`);
      
      toast({
        title: "Watermark Applied Successfully",
        description: "Your watermarked PDF has been downloaded.",
      });
      
      resetTool();
    } catch (error) {
      console.error("Error adding watermark:", error);
      toast({
        variant: "destructive",
        title: "Error Adding Watermark",
        description: "There was an error adding the watermark to your PDF file.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setPdfBytes(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Helmet>
        <title>Add Watermark to PDF | PDF Craft Pro</title>
        <meta name="description" content="Add custom watermarks to your PDF documents" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Add Watermark to PDF</h1>
        <p className="text-gray-600 mt-2">Add custom watermarks to your PDF documents</p>
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
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FileText className="h-10 w-10 text-pdf-blue mr-3" />
                  <div>
                    <h3 className="font-semibold">{file.name}</h3>
                    <p className="text-sm text-gray-500">Ready for watermarking</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={resetTool}>
                  Change File
                </Button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="watermark-text">Watermark Text</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="Enter watermark text"
                    />
                  </div>

                  <div>
                    <Label htmlFor="opacity">Opacity ({Math.round(opacity * 100)}%)</Label>
                    <input
                      id="opacity"
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={opacity}
                      onChange={(e) => setOpacity(parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Select value={position} onValueChange={(value: any) => setPosition(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="diagonal">Diagonal</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-8">
                  <div className="text-center">
                    <Droplets className="h-16 w-16 text-pdf-blue mx-auto mb-4" />
                    <p className="text-gray-600">Preview will show watermark placement</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-center">
                <Button 
                  onClick={addWatermark} 
                  disabled={isProcessing || !watermarkText.trim()} 
                  size="lg"
                  className="bg-pdf-blue hover:bg-pdf-lightBlue"
                >
                  <FileDown className="mr-2 h-5 w-5" />
                  {isProcessing ? "Adding Watermark..." : "Add Watermark & Download"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WatermarkPDF;
