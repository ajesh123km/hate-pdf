import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { ArrowLeft, FileText, FileDown, Pen, Image, Stamp } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileUploader from "@/components/FileUploader";
import PDFEditor from "@/components/PDFEditor";
import EditorToolbar from "@/components/EditorToolbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const EditPDF = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [activeTab, setActiveTab] = useState("preview");
  const [editorMode, setEditorMode] = useState<string>("text");
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<any>(null);
  const { toast } = useToast();

  const handleFileSelected = async (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      
      try {
        // Read the PDF file
        const fileArrayBuffer = await files[0].arrayBuffer();
        // Convert ArrayBuffer to Uint8Array to fix build error
        const uint8Array = new Uint8Array(fileArrayBuffer);
        
        const pdfDoc = await PDFDocument.load(uint8Array);
        
        // Get total pages
        const pages = pdfDoc.getPageCount();
        setTotalPages(pages);
        setCurrentPage(1);
        
        setPdfBytes(uint8Array);
        
        toast({
          title: "PDF Loaded Successfully",
          description: `Loaded ${pages} page${pages !== 1 ? 's' : ''}`,
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

  // Handle PDF updates from the editor (when pages are added)
  const handlePdfUpdate = (newPdfBytes: Uint8Array, newTotalPages: number) => {
    setPdfBytes(newPdfBytes);
    setTotalPages(newTotalPages);
    
    toast({
      title: "PDF Updated",
      description: `PDF now has ${newTotalPages} page${newTotalPages !== 1 ? 's' : ''}`,
    });
  };

  const handleSaveAndDownload = async () => {
    if (!editorRef.current || !file) return;
    
    setIsSaving(true);
    try {
      // Get edited PDF content from the editor
      let editedPdfBytes;
      
      if (editorMode === "watermark") {
        // Apply watermark to all pages
        editedPdfBytes = await editorRef.current.applyWatermarkToAllPages();
      } else if (editorMode === "rearrange") {
        // Apply page rearrangement
        editedPdfBytes = await editorRef.current.applyPageRearrangement();
      } else if (editorMode === "addpages") {
        // For add pages mode, the PDF is already updated in the component
        // Just get the current state
        editedPdfBytes = await editorRef.current.saveChanges();
      } else {
        // Get edited content for current page only
        editedPdfBytes = await editorRef.current.saveChanges();
      }
      
      if (editedPdfBytes) {
        // Create a blob from the edited PDF bytes
        const editedBlob = new Blob([editedPdfBytes], { type: "application/pdf" });
        
        // Generate filename
        const filename = file.name.replace(".pdf", "");
        const suffix = editorMode === "watermark" ? "-watermarked" : 
                      editorMode === "rearrange" ? "-rearranged" : 
                      editorMode === "addpages" ? "-with-pages" : "-edited";
        saveAs(editedBlob, `${filename}${suffix}.pdf`);
        
        toast({
          title: "PDF Saved Successfully",
          description: `Your ${editorMode === "watermark" ? "watermarked" : 
                             editorMode === "rearrange" ? "rearranged" : 
                             editorMode === "addpages" ? "PDF with new pages" : "edited"} PDF has been downloaded.`,
        });
      }
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

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const resetTool = () => {
    setFile(null);
    setPdfBytes(null);
    setCurrentPage(1);
    setTotalPages(0);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Helmet>
        <title>Edit PDF | PDF Craft Pro</title>
        <meta name="description" content="Edit text and images in your existing PDFs" />
      </Helmet>

      <div className="mb-8">
        <Link to="/" className="inline-flex items-center text-pdf-blue hover:underline mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Tools
        </Link>
        <h1 className="text-3xl font-bold">Edit PDF</h1>
        <p className="text-gray-600 mt-2">
          Add text, highlight, draw, insert images, signatures and more to your PDF documents
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
                    {isSaving ? "Saving..." : 
                     editorMode === "watermark" ? "Apply Watermark & Download" :
                     editorMode === "rearrange" ? "Apply Changes & Download" : 
                     editorMode === "addpages" ? "Save with New Pages & Download" : "Save & Download"}
                  </Button>
                </div>
              </div>
              
              <Tabs defaultValue="preview" onValueChange={(value) => setActiveTab(value)}>
                <div className="flex justify-between items-center mb-4">
                  <TabsList>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="edit">Edit</TabsTrigger>
                  </TabsList>
                  
                  {activeTab === "edit" && (
                    <EditorToolbar activeMode={editorMode} onModeChange={setEditorMode} />
                  )}
                </div>
                
                <TabsContent value="preview" className="mt-0">
                  <div className="bg-gray-50 p-4 rounded-md shadow-inner min-h-[600px] flex items-center justify-center">
                    {pdfBytes && (
                      <iframe 
                        src={URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))}
                        className="w-full h-[600px] border border-gray-200 rounded-md"
                        title="PDF Preview"
                      />
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="edit" className="mt-0">
                  {pdfBytes && (
                    <div className="bg-gray-50 p-4 rounded-md shadow-inner min-h-[600px]">
                      <PDFEditor
                        ref={editorRef}
                        pdfBytes={pdfBytes}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        editorMode={editorMode}
                        onPdfUpdate={handlePdfUpdate}
                      />
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EditPDF;
