
import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { ArrowLeft, FileImage, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import JSZip from "jszip";

const PDFToImage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFormat, setImageFormat] = useState<"png" | "jpeg">("png");
  const [quality, setQuality] = useState(1);
  const { toast } = useToast();

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      
      // Validate file type
      if (selectedFile.type !== 'application/pdf') {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a PDF file."
        });
        return;
      }
      
      setFile(selectedFile);
      setImageUrls([]);
    }
  };

  const convertPDFToImages = async () => {
    if (!file) return;

    setConverting(true);
    setProgress(0);
    setImageUrls([]);

    try {
      const fileArrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileArrayBuffer);
      const pageCount = pdfDoc.getPageCount();
      
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Could not get canvas context");
      }
      
      const zip = new JSZip();
      const images: string[] = [];

      // Load PDF.js dynamically
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

      const pdf = await pdfjsLib.getDocument(fileArrayBuffer).promise;

      for (let i = 0; i < pageCount; i++) {
        setProgress(Math.round(((i + 1) / pageCount) * 100));

        const page = await pdf.getPage(i + 1);
        const viewport = page.getViewport({ scale: 2.0 });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        const imageUrl = canvas.toDataURL(`image/${imageFormat}`, quality);
        images.push(imageUrl);

        // Add image to zip
        const imgData = imageUrl.substring(imageUrl.indexOf(",") + 1);
        zip.file(`page-${i + 1}.${imageFormat}`, imgData, { base64: true });
      }

      setImageUrls(images);

      toast({
        title: "Conversion Complete",
        description: `Successfully converted ${pageCount} pages to ${imageFormat.toUpperCase()} images!`,
      });

      return zip;
    } catch (error) {
      console.error("Error converting PDF to images:", error);
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: "There was an error converting your PDF to images. Please ensure the PDF is not corrupted or password-protected.",
      });
      return null;
    } finally {
      setConverting(false);
    }
  };

  const downloadImages = async () => {
    if (!file) return;
    
    const zip = await convertPDFToImages();
    if (!zip) return;
    
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const filename = file.name.replace(".pdf", "");
    saveAs(zipBlob, `${filename}-images.zip`);
  };

  const resetTool = () => {
    setFile(null);
    setImageUrls([]);
    setProgress(0);
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <Helmet>
        <title>PDF to Image Converter | PDF Craft Pro</title>
        <meta name="description" content="Convert PDF pages to JPG, PNG or other image formats" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">PDF to Image</h1>
        <p className="text-gray-600 mt-2">Convert PDF pages to JPG, PNG or other image formats</p>
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
                <FileImage className="h-10 w-10 text-pdf-blue mr-3" />
                <div className="flex-1">
                  <h3 className="font-semibold">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={resetTool}>
                  Change File
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image Format
                  </label>
                  <div className="flex gap-4">
                    <Button
                      onClick={() => setImageFormat("png")}
                      variant={imageFormat === "png" ? "default" : "outline"}
                    >
                      PNG
                    </Button>
                    <Button
                      onClick={() => setImageFormat("jpeg")}
                      variant={imageFormat === "jpeg" ? "default" : "outline"}
                    >
                      JPEG
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Image Quality
                  </label>
                  <select
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="border rounded-md px-3 py-2 w-full"
                  >
                    <option value="1">High (100%)</option>
                    <option value="0.8">Medium (80%)</option>
                    <option value="0.5">Low (50%)</option>
                  </select>
                </div>

                <Button 
                  onClick={downloadImages} 
                  disabled={converting} 
                  className="w-full bg-pdf-blue hover:bg-pdf-lightBlue"
                >
                  <Download className="mr-2 h-4 w-4" />
                  {converting ? "Converting..." : "Convert and Download Images"}
                </Button>

                {converting && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-center text-gray-500">
                      Converting page {Math.round((progress / 100) * (imageUrls.length || 1))} of {imageUrls.length || "?"}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {imageUrls.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Preview</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="border rounded-md overflow-hidden">
                      <img 
                        src={url} 
                        alt={`Page ${index + 1}`}
                        className="w-full h-auto"
                      />
                      <div className="p-2 text-center text-sm border-t">
                        Page {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default PDFToImage;
