
import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument, degrees } from "pdf-lib";
import { saveAs } from "file-saver";
import { ArrowLeft, FileText, FileDown, RotateCw, Move } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageInfo {
  pageNumber: number;
  rotation: number;
  originalIndex: number;
}

const OrganizePages = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [activeTab, setActiveTab] = useState("arrange");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      
      try {
        const fileArrayBuffer = await files[0].arrayBuffer();
        const uint8Array = new Uint8Array(fileArrayBuffer);
        
        const pdfDoc = await PDFDocument.load(uint8Array);
        const pageCount = pdfDoc.getPageCount();
        
        setTotalPages(pageCount);
        setPdfBytes(uint8Array);
        
        // Initialize pages array
        const initialPages: PageInfo[] = Array.from({ length: pageCount }, (_, index) => ({
          pageNumber: index + 1,
          rotation: 0,
          originalIndex: index
        }));
        setPages(initialPages);
        
        toast({
          title: "PDF Loaded Successfully",
          description: `Loaded ${pageCount} page${pageCount !== 1 ? 's' : ''}`,
        });
      } catch (error) {
        console.error("Error loading PDF:", error);
        toast({
          variant: "destructive",
          title: "Error Loading PDF",
          description: "There was an error loading your PDF file.",
        });
      }
    }
  };

  const handlePageReorder = (fromIndex: number, toIndex: number) => {
    const newPages = [...pages];
    const [movedPage] = newPages.splice(fromIndex, 1);
    newPages.splice(toIndex, 0, movedPage);
    setPages(newPages);
    
    toast({
      title: "Page Moved",
      description: `Page ${movedPage.pageNumber} moved to position ${toIndex + 1}`,
    });
  };

  const handlePageRotate = (pageIndex: number) => {
    const newPages = [...pages];
    newPages[pageIndex].rotation = (newPages[pageIndex].rotation + 90) % 360;
    setPages(newPages);
    
    toast({
      title: "Page Rotated",
      description: `Page ${newPages[pageIndex].pageNumber} rotated 90° clockwise`,
    });
  };

  const handleSaveAndDownload = async () => {
    if (!pdfBytes || !file) return;
    
    setIsSaving(true);
    try {
      const originalPdf = await PDFDocument.load(pdfBytes);
      const newPdf = await PDFDocument.create();
      
      // Add pages in the new order with rotations
      for (const pageInfo of pages) {
        const [copiedPage] = await newPdf.copyPages(originalPdf, [pageInfo.originalIndex]);
        
        // Apply rotation if needed
        if (pageInfo.rotation > 0) {
          copiedPage.setRotation(degrees(pageInfo.rotation));
        }
        
        newPdf.addPage(copiedPage);
      }
      
      const pdfBytesArray = await newPdf.save();
      const blob = new Blob([pdfBytesArray], { type: "application/pdf" });
      
      const filename = file.name.replace(".pdf", "");
      saveAs(blob, `${filename}-organized.pdf`);
      
      toast({
        title: "PDF Saved Successfully",
        description: "Your organized PDF has been downloaded.",
      });
    } catch (error) {
      console.error("Error saving PDF:", error);
      toast({
        variant: "destructive",
        title: "Error Saving PDF",
        description: "There was an error saving your PDF file.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetTool = () => {
    setFile(null);
    setPdfBytes(null);
    setTotalPages(0);
    setPages([]);
  };

  const movePageUp = (index: number) => {
    if (index > 0) {
      handlePageReorder(index, index - 1);
    }
  };

  const movePageDown = (index: number) => {
    if (index < pages.length - 1) {
      handlePageReorder(index, index + 1);
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Helmet>
        <title>Organize Pages | PDF Craft Pro</title>
        <meta name="description" content="Arrange and rotate pages in your PDF documents" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Organize Pages</h1>
        <p className="text-gray-600 mt-2">
          Arrange and rotate pages in your PDF documents
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
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <FileText className="h-10 w-10 text-pdf-blue mr-3" />
                  <div>
                    <h3 className="font-semibold">{file.name}</h3>
                    <p className="text-sm text-gray-500">
                      {totalPages} page{totalPages !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetTool}>
                    Change File
                  </Button>
                  <Button 
                    onClick={handleSaveAndDownload} 
                    disabled={isSaving} 
                    size="sm"
                    className="bg-pdf-blue hover:bg-pdf-lightBlue"
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes & Download"}
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="arrange" onValueChange={(value) => setActiveTab(value)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="arrange">Arrange Pages</TabsTrigger>
                  <TabsTrigger value="rotate">Rotate Pages</TabsTrigger>
                </TabsList>
                
                <TabsContent value="arrange" className="mt-0">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-semibold mb-4">Arrange Page Order</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {pages.map((pageInfo, index) => (
                        <div key={`arrange-${pageInfo.originalIndex}`} className="bg-white border rounded-lg p-3 shadow-sm">
                          <div className="text-center mb-2">
                            <div className="w-full h-24 bg-gray-100 border rounded flex items-center justify-center mb-2">
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">Page {pageInfo.pageNumber}</p>
                            <p className="text-xs text-gray-500">Position {index + 1}</p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => movePageUp(index)}
                              disabled={index === 0}
                              className="flex-1"
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => movePageDown(index)}
                              disabled={index === pages.length - 1}
                              className="flex-1"
                            >
                              ↓
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="rotate" className="mt-0">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-lg font-semibold mb-4">Rotate Pages</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {pages.map((pageInfo, index) => (
                        <div key={`rotate-${pageInfo.originalIndex}`} className="bg-white border rounded-lg p-3 shadow-sm">
                          <div className="text-center mb-2">
                            <div 
                              className="w-full h-24 bg-gray-100 border rounded flex items-center justify-center mb-2 transition-transform"
                              style={{ transform: `rotate(${pageInfo.rotation}deg)` }}
                            >
                              <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium">Page {pageInfo.pageNumber}</p>
                            <p className="text-xs text-gray-500">{pageInfo.rotation}° rotated</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePageRotate(index)}
                            className="w-full"
                          >
                            <RotateCw className="h-4 w-4 mr-1" />
                            Rotate 90°
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default OrganizePages;
