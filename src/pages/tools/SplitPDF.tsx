
import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUploader from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { File, Download, ArrowLeft, Scissors } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

const SplitPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [splitPdfUrls, setSplitPdfUrls] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [splitPoint, setSplitPoint] = useState<number>(1);
  const { toast } = useToast();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    if (selectedFiles.length > 0) {
      setFile(selectedFiles[0]);
      // Clear previous results when new file is selected
      if (splitPdfUrls.length > 0) {
        splitPdfUrls.forEach(url => URL.revokeObjectURL(url));
        setSplitPdfUrls([]);
      }
      
      // Get total pages in the PDF
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result) {
          try {
            const pdfDoc = await PDFDocument.load(e.target.result as ArrayBuffer);
            const pages = pdfDoc.getPageCount();
            setTotalPages(pages);
            setSplitPoint(Math.floor(pages / 2)); // Set default split point to middle
          } catch (error) {
            console.error("Error loading PDF:", error);
            toast({
              variant: "destructive",
              title: "Error loading PDF",
              description: "The PDF file could not be loaded. It may be corrupted."
            });
          }
        }
      };
      reader.readAsArrayBuffer(selectedFiles[0]);
    }
  }, [splitPdfUrls, toast]);

  const splitPDF = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a PDF file to split."
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Read the PDF file
      const fileBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(fileBuffer);
      
      // Create two new PDF documents
      const firstPdfDoc = await PDFDocument.create();
      const secondPdfDoc = await PDFDocument.create();
      
      // Copy pages from the original PDF to the first new PDF
      for (let i = 0; i < splitPoint; i++) {
        const [page] = await firstPdfDoc.copyPages(pdfDoc, [i]);
        firstPdfDoc.addPage(page);
      }
      
      // Copy pages from the original PDF to the second new PDF
      for (let i = splitPoint; i < totalPages; i++) {
        const [page] = await secondPdfDoc.copyPages(pdfDoc, [i]);
        secondPdfDoc.addPage(page);
      }
      
      // Save the new PDFs to Blob objects
      const firstPdfBytes = await firstPdfDoc.save();
      const secondPdfBytes = await secondPdfDoc.save();
      
      // Create URLs for the Blob objects
      const firstPdfBlob = new Blob([firstPdfBytes], { type: "application/pdf" });
      const secondPdfBlob = new Blob([secondPdfBytes], { type: "application/pdf" });
      
      const firstPdfUrl = URL.createObjectURL(firstPdfBlob);
      const secondPdfUrl = URL.createObjectURL(secondPdfBlob);
      
      // Set the URLs for download
      setSplitPdfUrls([firstPdfUrl, secondPdfUrl]);
      
      toast({
        title: "Success!",
        description: "Your PDF has been split successfully into two parts."
      });
    } catch (error) {
      console.error("Error splitting PDF:", error);
      toast({
        variant: "destructive",
        title: "Error splitting PDF",
        description: "An error occurred while splitting your PDF. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    if (splitPdfUrls.length > 0) {
      splitPdfUrls.forEach(url => URL.revokeObjectURL(url));
    }
    setFile(null);
    setSplitPdfUrls([]);
    setTotalPages(0);
    setSplitPoint(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <Button variant="ghost" asChild className="mb-4">
                <a href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Tools
                </a>
              </Button>
              
              <div className="flex items-center mb-6">
                <div className="bg-blue-100 rounded-full p-3 mr-4">
                  <Scissors className="h-8 w-8 text-pdf-blue" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Split PDF</h1>
                  <p className="text-gray-600">Divide your PDF into separate files at specified pages</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              {!splitPdfUrls.length ? (
                <>
                  <FileUploader 
                    onFilesSelected={handleFilesSelected}
                    accept=".pdf"
                    multiple={false}
                  />
                  
                  {file && totalPages > 0 && (
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold mb-4">Split Options</h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mb-6">
                        <p className="text-sm text-gray-600 mb-2">
                          Choose the page where to split your document:
                        </p>
                        
                        <div className="flex flex-col mb-4 space-y-6">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Page {splitPoint} of {totalPages}</span>
                          </div>
                          
                          <Slider 
                            value={[splitPoint]} 
                            min={1} 
                            max={totalPages} 
                            step={1}
                            onValueChange={(values) => setSplitPoint(values[0])}
                            className="w-full"
                          />
                          
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>First Part: {splitPoint} pages</span>
                            <span>Second Part: {totalPages - splitPoint} pages</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex justify-center">
                        <Button 
                          onClick={splitPDF}
                          disabled={isProcessing}
                          className="bg-pdf-blue hover:bg-pdf-lightBlue"
                        >
                          {isProcessing ? "Processing..." : "Split PDF"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="bg-green-100 rounded-full p-4 inline-flex mb-6">
                    <File className="h-10 w-10 text-green-600" />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">Your PDFs are ready!</h3>
                  <p className="text-gray-600 mb-6">The file has been successfully split into two parts.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">First Part (Pages 1-{splitPoint})</h4>
                        <Button asChild className="w-full bg-pdf-blue hover:bg-pdf-lightBlue">
                          <a href={splitPdfUrls[0]} download={`${file?.name.replace('.pdf', '')}_part1.pdf`}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Part 1
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-medium mb-2">Second Part (Pages {splitPoint+1}-{totalPages})</h4>
                        <Button asChild className="w-full bg-pdf-blue hover:bg-pdf-lightBlue">
                          <a href={splitPdfUrls[1]} download={`${file?.name.replace('.pdf', '')}_part2.pdf`}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Part 2
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Button variant="outline" onClick={resetTool}>
                    Split Another PDF
                  </Button>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">How to Split a PDF File</h3>
              
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">1</div>
                  <p>Upload the PDF file you want to split into multiple documents.</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">2</div>
                  <p>Choose the page where you want to split the document.</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">3</div>
                  <p>Click the "Split PDF" button to divide your document.</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">4</div>
                  <p>Download the resulting PDF files.</p>
                </li>
              </ol>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SplitPDF;
