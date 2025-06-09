
import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet";
import { ArrowLeft, FileUp, Download, Grid, Image, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { saveAs } from "file-saver";

const ImageToPDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const previewContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up URLs when component unmounts
    return () => {
      imageUrls.forEach(url => URL.revokeObjectURL(url));
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [imageUrls, pdfUrl]);

  const handleFileSelected = (selectedFiles: File[]) => {
    // Filter out non-image files
    const imageFiles = selectedFiles.filter(file => file.type.startsWith("image/"));
    
    if (imageFiles.length !== selectedFiles.length) {
      toast({
        variant: "destructive",
        title: "Invalid files",
        description: "Only image files are allowed."
      });
    }
    
    setFiles(imageFiles);
    
    // Create URLs for previews
    const urls = imageFiles.map(file => URL.createObjectURL(file));
    setImageUrls(urls);
    
    // Reset the PDF preview when new files are selected
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // Revoke the URL to prevent memory leaks
    URL.revokeObjectURL(imageUrls[index]);
    
    const newUrls = [...imageUrls];
    newUrls.splice(index, 1);
    setImageUrls(newUrls);
  };

  const convertImagesToPDF = async () => {
    if (files.length === 0) {
      toast({
        title: "No Images Selected",
        description: "Please select at least one image to convert."
      });
      return;
    }
    
    setGenerating(true);
    
    try {
      // Create a new PDF document
      const pdfDoc = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const imageArrayBuffer = await file.arrayBuffer();
        
        let image;
        // Determine the image type and embed accordingly
        if (file.type === "image/jpeg" || file.type === "image/jpg") {
          image = await pdfDoc.embedJpg(imageArrayBuffer);
        } else if (file.type === "image/png") {
          image = await pdfDoc.embedPng(imageArrayBuffer);
        } else {
          // Skip unsupported formats
          continue;
        }
        
        // Add a new page with the image dimensions (with some margins)
        const page = pdfDoc.addPage([image.width + 40, image.height + 40]);
        
        // Draw the image on the page (centered)
        page.drawImage(image, {
          x: 20,
          y: 20,
          width: image.width,
          height: image.height,
        });
      }
      
      // Save the PDF
      const pdfBytes = await pdfDoc.save();
      
      // Create a Blob from the PDF
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      
      // Create a URL for the blob
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      toast({
        title: "Conversion Complete",
        description: "Your images have been converted to PDF!"
      });
      
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: "An error occurred during conversion. Please try again."
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadPDF = () => {
    if (pdfUrl) {
      saveAs(pdfUrl, "converted-images.pdf");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Helmet>
        <title>Image to PDF Converter | PDF Craft Pro</title>
        <meta name="description" content="Convert images to PDF easily" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Image to PDF</h1>
        <p className="text-gray-600 mt-2">Convert your images into a single PDF document</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Upload Images</h2>
            <FileUploader
              onFilesSelected={handleFileSelected}
              accept="image/*"
              multiple={true}
              maxFiles={1000}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">Actions</h2>
            <div className="space-y-4">
              <Button 
                onClick={convertImagesToPDF} 
                disabled={files.length === 0 || generating} 
                className="w-full bg-pdf-blue hover:bg-pdf-lightBlue"
              >
                <FileUp className="mr-2 h-4 w-4" />
                {generating ? "Converting..." : "Convert to PDF"}
              </Button>
              
              {pdfUrl && (
                <Button 
                  onClick={downloadPDF} 
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              )}
              
              {files.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                  {files.length} image{files.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {imageUrls.length > 0 && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Selected Images</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setFiles([])}
              >
                Clear All
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" ref={previewContainerRef}>
              {imageUrls.map((url, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square overflow-hidden border rounded-md bg-gray-50">
                    <img 
                      src={url} 
                      alt={`Image ${index + 1}`} 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <button 
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="text-xs text-center mt-1 text-gray-500">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pdfUrl && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <h2 className="text-xl font-semibold mb-4">PDF Preview</h2>
            <div className="aspect-[8.5/11] w-full border rounded-md overflow-hidden">
              <iframe 
                src={pdfUrl} 
                className="w-full h-full" 
                title="PDF Preview" 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageToPDF;
