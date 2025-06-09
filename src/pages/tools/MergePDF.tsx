
import { useState, useCallback } from "react";
import { PDFDocument } from "pdf-lib";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FileUploader from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { File, Download, ArrowLeft, Merge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MergePDF = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    // Validate that all files are PDFs
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length !== selectedFiles.length) {
      toast({
        variant: "destructive",
        title: "Invalid files",
        description: "Please select only PDF files."
      });
    }
    
    setFiles(pdfFiles);
    // Clear previous result when files change
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
      setMergedPdfUrl(null);
    }
  }, [mergedPdfUrl, toast]);

  const mergePDFs = async () => {
    if (files.length < 2) {
      toast({
        variant: "destructive",
        title: "Not enough files",
        description: "Please upload at least two PDF files to merge."
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Create a new PDF document
      const mergedPdf = await PDFDocument.create();
      
      // Process each PDF file
      for (const file of files) {
        try {
          // Convert File to ArrayBuffer
          const fileBuffer = await file.arrayBuffer();
          
          // Load the PDF document
          const pdfDoc = await PDFDocument.load(fileBuffer);
          
          // Copy all pages from the current PDF to the merged PDF
          const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
          copiedPages.forEach((page) => {
            mergedPdf.addPage(page);
          });
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          toast({
            variant: "destructive",
            title: "Error processing file",
            description: `Could not process ${file.name}. It may be corrupted or password-protected.`
          });
        }
      }
      
      // Serialize the merged PDF to bytes
      const mergedPdfBytes = await mergedPdf.save();
      
      // Create a Blob from the PDF bytes
      const blob = new Blob([mergedPdfBytes], { type: "application/pdf" });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Set the URL for download
      setMergedPdfUrl(url);
      
      toast({
        title: "Success!",
        description: "Your PDFs have been merged successfully."
      });
    } catch (error) {
      console.error("Error merging PDFs:", error);
      toast({
        variant: "destructive",
        title: "Error merging PDFs",
        description: "An error occurred while merging your PDFs. Please try again."
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTool = () => {
    if (mergedPdfUrl) {
      URL.revokeObjectURL(mergedPdfUrl);
    }
    setFiles([]);
    setMergedPdfUrl(null);
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
                  <Merge className="h-8 w-8 text-pdf-blue" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Merge PDF</h1>
                  <p className="text-gray-600">Combine multiple PDF files into a single document</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              {!mergedPdfUrl ? (
                <>
                  <FileUploader 
                    onFilesSelected={handleFilesSelected}
                    accept=".pdf"
                    multiple={true}
                  />
                  
                  {files.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold mb-4">Selected Files ({files.length})</h3>
                      <div className="space-y-2 mb-6">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <span className="font-medium">{file.name}</span>
                            <span className="text-sm text-gray-500">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-center">
                        <Button 
                          onClick={mergePDFs}
                          disabled={isProcessing || files.length < 2}
                          className="bg-pdf-blue hover:bg-pdf-lightBlue"
                        >
                          {isProcessing ? "Processing..." : "Merge PDFs"}
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
                  
                  <h3 className="text-xl font-semibold mb-2">Your PDF is ready!</h3>
                  <p className="text-gray-600 mb-6">The files have been successfully merged.</p>
                  
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild className="bg-pdf-blue hover:bg-pdf-lightBlue">
                      <a href={mergedPdfUrl} download="merged_document.pdf">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </a>
                    </Button>
                    
                    <Button variant="outline" onClick={resetTool}>
                      Merge Another PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">How to Merge PDF Files</h3>
              
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">1</div>
                  <p>Upload two or more PDF files that you want to combine into a single PDF.</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">2</div>
                  <p>Review the order of files in the list (they will be merged in this order).</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">3</div>
                  <p>Click the "Merge PDFs" button to combine all the uploaded files.</p>
                </li>
                <li className="flex gap-3">
                  <div className="bg-pdf-blue text-white rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">4</div>
                  <p>Download your merged PDF file once processing is complete.</p>
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

export default MergePDF;
