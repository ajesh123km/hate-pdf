import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Upload, Download, RotateCw, Plus } from "lucide-react";
import { fabric } from "fabric";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PDFEditorProps {
  pdfBytes: Uint8Array;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  editorMode: string;
  onPdfUpdate?: (newPdfBytes: Uint8Array, newTotalPages: number) => void;
}

interface TextSettings {
  fontSize: number;
  fontColor: string;
  fontFamily: string;
}

interface DrawingSettings {
  brushSize: number;
  brushColor: string;
  brushType: "pen" | "highlighter";
}

interface WatermarkSettings {
  type: "text" | "image";
  text: string;
  position: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
  opacity: number;
  fontSize: number;
  rotation: number;
  imageUrl: string;
  repeat: boolean;
  applyToAllPages: boolean;
}

const PDFEditor = forwardRef<any, PDFEditorProps>(
  ({ pdfBytes, currentPage, totalPages, onPageChange, editorMode, onPdfUpdate }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
    const [pageImages, setPageImages] = useState<string[]>([]);
    const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageOrder, setPageOrder] = useState<number[]>([]);
    const [currentPdfBytes, setCurrentPdfBytes] = useState<Uint8Array>(pdfBytes);
    
    const [textSettings, setTextSettings] = useState<TextSettings>({
      fontSize: 20,
      fontColor: "#000000",
      fontFamily: "Arial",
    });
    
    const [drawingSettings, setDrawingSettings] = useState<DrawingSettings>({
      brushSize: 3,
      brushColor: "#000000",
      brushType: "pen",
    });
    
    const [detectingElements, setDetectingElements] = useState(false);
    const [watermarkSettings, setWatermarkSettings] = useState<WatermarkSettings>({
      type: "text" as "text" | "image",
      text: "CONFIDENTIAL",
      position: "center" as "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right",
      opacity: 30,
      fontSize: 48,
      rotation: 45,
      imageUrl: "",
      repeat: false,
      applyToAllPages: false
    });
    const [showWatermarkPreview, setShowWatermarkPreview] = useState(false);

    const watermarkForm = useForm({
      defaultValues: watermarkSettings
    });

    // Initialize page order
    useEffect(() => {
      if (totalPages > 0) {
        setPageOrder(Array.from({ length: totalPages }, (_, i) => i + 1));
      }
    }, [totalPages]);

    // Update currentPdfBytes when pdfBytes prop changes
    useEffect(() => {
      setCurrentPdfBytes(pdfBytes);
    }, [pdfBytes]);

    // Initialize PDF and convert pages to images
    useEffect(() => {
      const initPDF = async () => {
        try {
          setIsLoading(true);
          // Load the PDF document with ignoreEncryption option to handle encrypted PDFs
          const pdfDocument = await PDFDocument.load(currentPdfBytes, { 
            ignoreEncryption: true 
          });
          setPdfDoc(pdfDocument);

          // Convert all PDF pages to images
          const images = [];
          for (let i = 0; i < pdfDocument.getPageCount(); i++) {
            const img = await renderPageAsImage(pdfDocument, i);
            images.push(img);
          }
          setPageImages(images);
        } catch (error) {
          console.error("Error initializing PDF:", error);
        } finally {
          setIsLoading(false);
        }
      };

      initPDF();
    }, [currentPdfBytes]);

    // Create fabric.js canvas for the current page
    useEffect(() => {
      if (pageImages.length > 0 && canvasRef.current) {
        // Initialize fabric canvas
        const canvas = new fabric.Canvas(canvasRef.current);
        setFabricCanvas(canvas);

        // Load current page image as background
        fabric.Image.fromURL(pageImages[currentPage - 1], (img) => {
          canvas.setWidth(img.width as number);
          canvas.setHeight(img.height as number);
          canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
            scaleX: 1,
            scaleY: 1,
          });
          
          // Configure canvas based on editor mode
          setupCanvasForMode(canvas, editorMode);
        });

        return () => {
          canvas.dispose();
        };
      }
    }, [pageImages, currentPage]);

    // Handle mode changes
    useEffect(() => {
      if (!fabricCanvas) return;
      setupCanvasForMode(fabricCanvas, editorMode);
    }, [editorMode, fabricCanvas, showWatermarkPreview]);

    const setupCanvasForMode = (canvas: fabric.Canvas, mode: string) => {
      // Reset canvas settings
      canvas.isDrawingMode = false;
      canvas.selection = true;
      
      switch (mode) {
        case "text":
          canvas.selection = true;
          break;
        case "highlight":
          canvas.isDrawingMode = true;
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = "rgba(255, 255, 0, 0.3)";
            canvas.freeDrawingBrush.width = 20;
          }
          break;
        case "draw":
          canvas.isDrawingMode = true;
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = drawingSettings.brushColor;
            canvas.freeDrawingBrush.width = drawingSettings.brushSize;
          }
          break;
        case "erase":
          canvas.isDrawingMode = true;
          if (canvas.freeDrawingBrush) {
            canvas.freeDrawingBrush.color = "#FFFFFF";
            canvas.freeDrawingBrush.width = 20;
          }
          break;
        case "forms":
          detectFormFields(canvas);
          break;
        case "rearrange":
          // Rearrange mode will be handled separately
          break;
        case "watermark":
          if (showWatermarkPreview) {
            addWatermarkToCanvas(canvas);
          }
          break;
      }
    };

    // Add text functionality
    const addText = () => {
      if (!fabricCanvas) return;
      
      const textbox = new fabric.Textbox("Click to edit", {
        left: 100,
        top: 100,
        width: 200,
        fontSize: textSettings.fontSize,
        fill: textSettings.fontColor,
        fontFamily: textSettings.fontFamily,
        editable: true
      });
      
      fabricCanvas.add(textbox);
      fabricCanvas.setActiveObject(textbox);
      fabricCanvas.renderAll();
    };

    // Add shapes functionality
    const addShape = (shapeType: "rectangle" | "circle" | "line") => {
      if (!fabricCanvas) return;
      
      let shape;
      
      switch (shapeType) {
        case "rectangle":
          shape = new fabric.Rect({
            left: 100,
            top: 100,
            width: 100,
            height: 80,
            fill: "transparent",
            stroke: "#000000",
            strokeWidth: 2
          });
          break;
        case "circle":
          shape = new fabric.Circle({
            left: 100,
            top: 100,
            radius: 50,
            fill: "transparent",
            stroke: "#000000",
            strokeWidth: 2
          });
          break;
        case "line":
          shape = new fabric.Line([50, 100, 200, 100], {
            stroke: "#000000",
            strokeWidth: 2
          });
          break;
      }
      
      if (shape) {
        fabricCanvas.add(shape);
        fabricCanvas.setActiveObject(shape);
        fabricCanvas.renderAll();
      }
    };

    // Detect form fields (simplified)
    const detectFormFields = (canvas: fabric.Canvas) => {
      setDetectingElements(true);
      
      // Create sample form fields
      const formFields = [
        { x: 100, y: 150, width: 200, height: 30, placeholder: "Name" },
        { x: 100, y: 200, width: 200, height: 30, placeholder: "Email" },
        { x: 100, y: 250, width: 300, height: 60, placeholder: "Address" }
      ];
      
      formFields.forEach((field, index) => {
        const rect = new fabric.Rect({
          left: field.x,
          top: field.y,
          width: field.width,
          height: field.height,
          fill: "rgba(200, 200, 255, 0.3)",
          stroke: "#0000FF",
          strokeWidth: 1,
          rx: 5,
          ry: 5
        });
        
        const textbox = new fabric.Textbox("", {
          left: field.x + 5,
          top: field.y + 5,
          width: field.width - 10,
          fontSize: 14,
          fontFamily: "Arial",
          editable: true
        });
        
        const group = new fabric.Group([rect, textbox], {
          left: field.x,
          top: field.y,
          selectable: true,
          data: { type: 'form-field', placeholder: field.placeholder }
        });
        
        canvas.add(group);
      });
      
      canvas.renderAll();
      setDetectingElements(false);
    };

    // Signature functionality
    const addSignature = () => {
      if (!fabricCanvas) return;
      
      // Create a signature placeholder
      const signatureArea = new fabric.Rect({
        left: 100,
        top: 400,
        width: 200,
        height: 60,
        fill: "rgba(0, 255, 0, 0.1)",
        stroke: "#00AA00",
        strokeWidth: 2,
        strokeDashArray: [5, 5],
        rx: 5,
        ry: 5
      });
      
      const signatureText = new fabric.Text("Click to add signature", {
        left: 200,
        top: 430,
        originX: 'center',
        originY: 'center',
        fontSize: 12,
        fill: "#666666",
        fontStyle: "italic"
      });
      
      const group = new fabric.Group([signatureArea, signatureText], {
        left: 100,
        top: 400,
        selectable: true,
        data: { type: 'signature-placeholder' }
      });
      
      group.on('selected', function() {
        document.getElementById('signature-upload')?.click();
      });
      
      fabricCanvas.add(group);
      fabricCanvas.renderAll();
    };

    // Handle signature upload
    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!fabricCanvas || !e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) return;
        
        fabric.Image.fromURL(event.target.result.toString(), (img) => {
          img.scaleToWidth(200);
          img.set({
            left: 100,
            top: 400,
            data: { type: 'signature' }
          });
          
          // Remove any signature placeholders
          const objects = [...fabricCanvas.getObjects()];
          objects.forEach(obj => {
            if (obj.data?.type === 'signature-placeholder') {
              fabricCanvas.remove(obj);
            }
          });
          
          fabricCanvas.add(img);
          fabricCanvas.setActiveObject(img);
          fabricCanvas.renderAll();
        });
      };
      
      reader.readAsDataURL(file);
    };

    // Page rearrangement functionality
    const movePageUp = (pageIndex: number) => {
      if (pageIndex > 0) {
        const newOrder = [...pageOrder];
        [newOrder[pageIndex], newOrder[pageIndex - 1]] = [newOrder[pageIndex - 1], newOrder[pageIndex]];
        setPageOrder(newOrder);
      }
    };

    const movePageDown = (pageIndex: number) => {
      if (pageIndex < pageOrder.length - 1) {
        const newOrder = [...pageOrder];
        [newOrder[pageIndex], newOrder[pageIndex + 1]] = [newOrder[pageIndex + 1], newOrder[pageIndex]];
        setPageOrder(newOrder);
      }
    };

    // Render a PDF page as an image
    const renderPageAsImage = async (pdf: PDFDocument, pageIndex: number): Promise<string> => {
      const page = pdf.getPages()[pageIndex];
      
      // Create a canvas to render the PDF page
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create canvas context");
      
      // Set dimensions
      const { width, height } = page.getSize();
      const scale = 2; // Higher scale for better quality
      canvas.width = width * scale;
      canvas.height = height * scale;
      
      // Use pdf.js to render the page (simplified for this example)
      // In a real-world scenario, you'd use pdf.js's rendering capabilities
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);
      
      // Return the data URL
      return canvas.toDataURL("image/png");
    };

    // Image upload handler
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!fabricCanvas || !e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) return;
        
        // Get the currently selected object
        const activeObject = fabricCanvas.getActiveObject();
        
        if (activeObject && activeObject.type === 'group' && 
            (activeObject as any).data && (activeObject as any).data.type === 'image-placeholder') {
          // Replace the placeholder with the actual image
          const imgElement = new Image();
          imgElement.src = event.target.result.toString();
          
          imgElement.onload = () => {
            // Get position and size from the placeholder
            const { left, top, width, height } = activeObject;
            
            // Remove the placeholder
            fabricCanvas.remove(activeObject);
            
            // Add the new image
            const img = new fabric.Image(imgElement, {
              left,
              top,
              scaleX: width ? width / imgElement.width : 1,
              scaleY: height ? height / imgElement.height : 1
            });
            
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
          };
        } else {
          // If no placeholder is selected, just add the image
          fabric.Image.fromURL(event.target.result.toString(), (img) => {
            const maxSize = 300;
            if (img.width && img.height) {
              if (img.width > img.height) {
                if (img.width > maxSize) {
                  img.scaleToWidth(maxSize);
                }
              } else {
                if (img.height > maxSize) {
                  img.scaleToHeight(maxSize);
                }
              }
            }
            
            fabricCanvas.add(img);
            fabricCanvas.setActiveObject(img);
            fabricCanvas.renderAll();
          });
        }
      };
      
      reader.readAsDataURL(file);
    };

    // Watermark image upload handler
    const handleWatermarkImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || !e.target.files[0]) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (!event.target?.result) return;
        
        setWatermarkSettings(prev => ({
          ...prev,
          imageUrl: event.target.result.toString(),
          type: "image"
        }));
        
        watermarkForm.setValue("imageUrl", event.target.result.toString());
        watermarkForm.setValue("type", "image");
      };
      
      reader.readAsDataURL(file);
    };

    // Get position coordinates based on selected position
    const getPositionCoordinates = (position: string, canvasWidth: number, canvasHeight: number, objectWidth: number, objectHeight: number) => {
      const positions: Record<string, {x: number, y: number}> = {
        "top-left": { x: objectWidth / 2, y: objectHeight / 2 },
        "top-center": { x: canvasWidth / 2, y: objectHeight / 2 },
        "top-right": { x: canvasWidth - objectWidth / 2, y: objectHeight / 2 },
        "center-left": { x: objectWidth / 2, y: canvasHeight / 2 },
        "center": { x: canvasWidth / 2, y: canvasHeight / 2 },
        "center-right": { x: canvasWidth - objectWidth / 2, y: canvasHeight / 2 },
        "bottom-left": { x: objectWidth / 2, y: canvasHeight - objectHeight / 2 },
        "bottom-center": { x: canvasWidth / 2, y: canvasHeight - objectHeight / 2 },
        "bottom-right": { x: canvasWidth - objectWidth / 2, y: canvasHeight - objectHeight / 2 }
      };
      
      return positions[position] || positions["center"];
    };

    // Add watermark to canvas
    const addWatermarkToCanvas = (canvas: fabric.Canvas) => {
      if (!canvas) return;
      
      // Remove any existing watermarks
      const existingObjects = canvas.getObjects().filter(obj => obj.data?.type === 'watermark');
      existingObjects.forEach(obj => canvas.remove(obj));
      
      const canvasWidth = canvas.getWidth() || 800;
      const canvasHeight = canvas.getHeight() || 600;
      
      if (watermarkSettings.type === "text") {
        // Create text watermark
        const text = new fabric.Text(watermarkSettings.text, {
          fontSize: watermarkSettings.fontSize,
          fill: `rgba(0, 0, 0, ${watermarkSettings.opacity / 100})`,
          fontFamily: 'Arial',
          angle: watermarkSettings.rotation,
          originX: 'center',
          originY: 'center',
          selectable: false,
          data: { type: 'watermark' }
        });
        
        // Calculate position
        const { x, y } = getPositionCoordinates(
          watermarkSettings.position, 
          canvasWidth, 
          canvasHeight,
          text.width || 100, 
          text.height || 30
        );
        
        text.set({ left: x, top: y });
        canvas.add(text);
        
        // For repeating watermark
        if (watermarkSettings.repeat) {
          const spacingX = (text.width || 200) * 2;
          const spacingY = (text.height || 30) * 2;
          
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (i === 0 && j === 0) continue;
              
              const clonedText = fabric.util.object.clone(text);
              clonedText.set({
                left: x + (spacingX * i),
                top: y + (spacingY * j),
                data: { type: 'watermark' }
              });
              
              canvas.add(clonedText);
            }
          }
        }
      } else if (watermarkSettings.type === "image" && watermarkSettings.imageUrl) {
        // Create image watermark
        fabric.Image.fromURL(watermarkSettings.imageUrl, (img) => {
          const maxSize = 300;
          
          if (img.width && img.height) {
            const aspectRatio = img.width / img.height;
            let newWidth = Math.min(canvasWidth * 0.3, maxSize);
            let newHeight = newWidth / aspectRatio;
            
            img.scaleToWidth(newWidth);
          }
          
          img.set({
            originX: 'center',
            originY: 'center',
            opacity: watermarkSettings.opacity / 100,
            angle: watermarkSettings.rotation,
            selectable: false,
            data: { type: 'watermark' }
          });
          
          // Calculate position
          const { x, y } = getPositionCoordinates(
            watermarkSettings.position, 
            canvasWidth, 
            canvasHeight,
            (img.width || 100) * (img.scaleX || 1), 
            (img.height || 100) * (img.scaleY || 1)
          );
          
          img.set({ left: x, top: y });
          canvas.add(img);
          
          // For repeating watermark
          if (watermarkSettings.repeat) {
            const spacingX = ((img.width || 100) * (img.scaleX || 1)) * 1.5;
            const spacingY = ((img.height || 100) * (img.scaleY || 1)) * 1.5;
            
            let pendingImages = 0;
            
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue;
                
                pendingImages++;
                fabric.Image.fromURL(watermarkSettings.imageUrl, (clonedImg) => {
                  clonedImg.set({
                    left: x + (spacingX * i),
                    top: y + (spacingY * j),
                    originX: 'center',
                    originY: 'center',
                    opacity: watermarkSettings.opacity / 100,
                    angle: watermarkSettings.rotation,
                    scaleX: img.scaleX,
                    scaleY: img.scaleY,
                    selectable: false,
                    data: { type: 'watermark' }
                  });
                  
                  canvas.add(clonedImg);
                  pendingImages--;
                  if (pendingImages === 0) {
                    setTimeout(() => canvas.renderAll(), 100);
                  }
                });
              }
            }
            
            if (pendingImages === 0) {
              canvas.renderAll();
            }
          } else {
            canvas.renderAll();
          }
        });
      }
      
      canvas.renderAll();
    };

    // Handle watermark settings changes
    const handleWatermarkChange = (settings: any) => {
      setWatermarkSettings({
        ...watermarkSettings,
        ...settings
      });
      
      if (showWatermarkPreview && fabricCanvas) {
        addWatermarkToCanvas(fabricCanvas);
      }
    };

    // Handle text settings change
    const handleTextSettingsChange = (setting: string, value: any) => {
      setTextSettings(prev => ({ ...prev, [setting]: value }));
      
      if (fabricCanvas) {
        const activeObject = fabricCanvas.getActiveObject();
        if (activeObject && activeObject.type === 'textbox') {
          switch (setting) {
            case 'fontSize':
              activeObject.set({ fontSize: value });
              break;
            case 'fontColor':
              activeObject.set({ fill: value });
              break;
            case 'fontFamily':
              activeObject.set({ fontFamily: value });
              break;
          }
          fabricCanvas.renderAll();
        }
      }
    };

    // Add new state for page management
    const [addPageSettings, setAddPageSettings] = useState({
      position: "after" as "before" | "after" | "end",
      pageSize: "letter" as "letter" | "a4" | "legal",
      count: 1
    });

    // Updated function to handle adding pages
    const handleAddPages = async () => {
      if (!pdfDoc) return;
      
      try {
        const newPdf = await PDFDocument.load(currentPdfBytes);
        
        // Define page dimensions based on selected size
        const pageSizes = {
          letter: { width: 612, height: 792 },
          a4: { width: 595, height: 842 },
          legal: { width: 612, height: 1008 }
        };
        
        const { width, height } = pageSizes[addPageSettings.pageSize];
        
        // If position is not "end", we need to rearrange pages
        if (addPageSettings.position !== "end") {
          const finalPdf = await PDFDocument.create();
          const originalPages = newPdf.getPages();
          
          let insertIndex = addPageSettings.position === "before" ? 
            currentPage - 1 : currentPage;
          
          // Copy pages before insertion point
          for (let i = 0; i < insertIndex; i++) {
            const [copiedPage] = await finalPdf.copyPages(newPdf, [i]);
            finalPdf.addPage(copiedPage);
          }
          
          // Add new blank pages
          for (let i = 0; i < addPageSettings.count; i++) {
            const page = finalPdf.addPage([width, height]);
            page.drawRectangle({
              x: 10,
              y: 10,
              width: width - 20,
              height: height - 20,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1,
            });
          }
          
          // Copy remaining pages
          for (let i = insertIndex; i < originalPages.length; i++) {
            const [copiedPage] = await finalPdf.copyPages(newPdf, [i]);
            finalPdf.addPage(copiedPage);
          }
          
          const updatedBytes = await finalPdf.save();
          
          // Update the component state with new PDF
          setCurrentPdfBytes(updatedBytes);
          const newPdfDoc = await PDFDocument.load(updatedBytes);
          setPdfDoc(newPdfDoc);
          
          // Convert all pages to images again
          const images = [];
          for (let i = 0; i < newPdfDoc.getPageCount(); i++) {
            const img = await renderPageAsImage(newPdfDoc, i);
            images.push(img);
          }
          setPageImages(images);
          
          // Notify parent component about the PDF update
          if (onPdfUpdate) {
            onPdfUpdate(updatedBytes, newPdfDoc.getPageCount());
          }
          
          // Navigate to the first newly added page
          onPageChange(insertIndex + 1);
        } else {
          // For "end" position, just add pages to the end
          for (let i = 0; i < addPageSettings.count; i++) {
            const page = newPdf.addPage([width, height]);
            page.drawRectangle({
              x: 10,
              y: 10,
              width: width - 20,
              height: height - 20,
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1,
            });
          }
          
          const updatedBytes = await newPdf.save();
          setCurrentPdfBytes(updatedBytes);
          const newPdfDoc = await PDFDocument.load(updatedBytes);
          setPdfDoc(newPdfDoc);
          
          // Convert all pages to images again
          const images = [];
          for (let i = 0; i < newPdfDoc.getPageCount(); i++) {
            const img = await renderPageAsImage(newPdfDoc, i);
            images.push(img);
          }
          setPageImages(images);
          
          // Notify parent component about the PDF update
          if (onPdfUpdate) {
            onPdfUpdate(updatedBytes, newPdfDoc.getPageCount());
          }
        }
        
      } catch (error) {
        console.error("Error adding pages:", error);
      }
    };

    useImperativeHandle(ref, () => ({
      saveChanges: async () => {
        if (!pdfDoc || !fabricCanvas) return null;

        try {
          // Create a copy of the original PDF
          const editedPdf = await PDFDocument.load(currentPdfBytes);
          
          // Get the canvas as image data
          const canvasDataUrl = fabricCanvas.toDataURL({
            format: 'png',
            quality: 1
          });
          
          // Convert data URL to bytes
          const base64Data = canvasDataUrl.split(',')[1];
          const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
          
          // Embed the image in the PDF
          const image = await editedPdf.embedPng(imageBytes);
          
          // Get the page and draw the image on it
          const page = editedPdf.getPages()[currentPage - 1];
          const { width, height } = page.getSize();
          
          // Draw the edited canvas as an image over the original page
          page.drawImage(image, {
            x: 0,
            y: 0,
            width: width,
            height: height,
          });
          
          // Save and return the edited PDF
          return await editedPdf.save();
        } catch (error) {
          console.error("Error saving PDF:", error);
          return null;
        }
      },

      applyPageRearrangement: async () => {
        if (!pdfDoc) return null;
        
        try {
          const newPdf = await PDFDocument.create();
          const originalPdf = await PDFDocument.load(currentPdfBytes);
          
          // Copy pages in the new order
          for (const pageNum of pageOrder) {
            const [copiedPage] = await newPdf.copyPages(originalPdf, [pageNum - 1]);
            newPdf.addPage(copiedPage);
          }
          
          return await newPdf.save();
        } catch (error) {
          console.error("Error rearranging pages:", error);
          return null;
        }
      },

      applyWatermarkToAllPages: async () => {
        if (!pdfDoc) return null;
        
        try {
          const editedPdf = await PDFDocument.load(currentPdfBytes);
          const pages = editedPdf.getPages();
          
          if (watermarkSettings.applyToAllPages) {
            // Apply watermark to all pages
            for (let i = 0; i < pages.length; i++) {
              const page = pages[i];
              const { width, height } = page.getSize();
              
              if (watermarkSettings.type === "text") {
                // Add text watermark
                const font = await editedPdf.embedFont(StandardFonts.Helvetica);
                const { x, y } = getPositionCoordinates(
                  watermarkSettings.position,
                  width,
                  height,
                  watermarkSettings.fontSize * watermarkSettings.text.length * 0.6,
                  watermarkSettings.fontSize
                );
                
                page.drawText(watermarkSettings.text, {
                  x: x - (watermarkSettings.fontSize * watermarkSettings.text.length * 0.3),
                  y: y - (watermarkSettings.fontSize * 0.3),
                  size: watermarkSettings.fontSize,
                  font: font,
                  color: rgb(0, 0, 0),
                  opacity: watermarkSettings.opacity / 100,
                  rotate: degrees(watermarkSettings.rotation)
                });
                
                // Add repeating watermarks if enabled
                if (watermarkSettings.repeat) {
                  const spacingX = watermarkSettings.fontSize * watermarkSettings.text.length * 1.5;
                  const spacingY = watermarkSettings.fontSize * 2;
                  
                  for (let offsetX = -spacingX; offsetX <= width + spacingX; offsetX += spacingX) {
                    for (let offsetY = -spacingY; offsetY <= height + spacingY; offsetY += spacingY) {
                      if (offsetX === 0 && offsetY === 0) continue;
                      
                      const repeatX = x + offsetX - (watermarkSettings.fontSize * watermarkSettings.text.length * 0.3);
                      const repeatY = y + offsetY - (watermarkSettings.fontSize * 0.3);
                      
                      if (repeatX > -100 && repeatX < width + 100 && repeatY > -50 && repeatY < height + 50) {
                        page.drawText(watermarkSettings.text, {
                          x: repeatX,
                          y: repeatY,
                          size: watermarkSettings.fontSize,
                          font: font,
                          color: rgb(0, 0, 0),
                          opacity: watermarkSettings.opacity / 100,
                          rotate: degrees(watermarkSettings.rotation)
                        });
                      }
                    }
                  }
                }
              } else if (watermarkSettings.type === "image" && watermarkSettings.imageUrl) {
                // Add image watermark
                try {
                  // Convert data URL to bytes
                  const base64Data = watermarkSettings.imageUrl.split(',')[1];
                  const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                  
                  // Determine image format
                  let image;
                  if (watermarkSettings.imageUrl.includes('data:image/png')) {
                    image = await editedPdf.embedPng(imageBytes);
                  } else {
                    image = await editedPdf.embedJpg(imageBytes);
                  }
                  
                  const imageDims = image.scale(0.3); // Scale down the image
                  const { x, y } = getPositionCoordinates(
                    watermarkSettings.position,
                    width,
                    height,
                    imageDims.width,
                    imageDims.height
                  );
                  
                  page.drawImage(image, {
                    x: x - imageDims.width / 2,
                    y: y - imageDims.height / 2,
                    width: imageDims.width,
                    height: imageDims.height,
                    opacity: watermarkSettings.opacity / 100,
                    rotate: degrees(watermarkSettings.rotation)
                  });
                  
                  // Add repeating watermarks if enabled
                  if (watermarkSettings.repeat) {
                    const spacingX = imageDims.width * 1.5;
                    const spacingY = imageDims.height * 1.5;
                    
                    for (let offsetX = -spacingX; offsetX <= width + spacingX; offsetX += spacingX) {
                      for (let offsetY = -spacingY; offsetY <= height + spacingY; offsetY += spacingY) {
                        if (offsetX === 0 && offsetY === 0) continue;
                        
                        const repeatX = x + offsetX - imageDims.width / 2;
                        const repeatY = y + offsetY - imageDims.height / 2;
                        
                        if (repeatX > -imageDims.width && repeatX < width + imageDims.width && 
                            repeatY > -imageDims.height && repeatY < height + imageDims.height) {
                          page.drawImage(image, {
                            x: repeatX,
                            y: repeatY,
                            width: imageDims.width,
                            height: imageDims.height,
                            opacity: watermarkSettings.opacity / 100,
                            rotate: degrees(watermarkSettings.rotation)
                          });
                        }
                      }
                    }
                  }
                } catch (imageError) {
                  console.error("Error embedding watermark image:", imageError);
                }
              }
            }
          } else {
            // Apply watermark to current page only
            const page = pages[currentPage - 1];
            const { width, height } = page.getSize();
            
            if (watermarkSettings.type === "text") {
              const font = await editedPdf.embedFont(StandardFonts.Helvetica);
              const { x, y } = getPositionCoordinates(
                watermarkSettings.position,
                width,
                height,
                watermarkSettings.fontSize * watermarkSettings.text.length * 0.6,
                watermarkSettings.fontSize
              );
              
              page.drawText(watermarkSettings.text, {
                x: x - (watermarkSettings.fontSize * watermarkSettings.text.length * 0.3),
                y: y - (watermarkSettings.fontSize * 0.3),
                size: watermarkSettings.fontSize,
                font: font,
                color: rgb(0, 0, 0),
                opacity: watermarkSettings.opacity / 100,
                rotate: degrees(watermarkSettings.rotation)
              });
            } else if (watermarkSettings.type === "image" && watermarkSettings.imageUrl) {
              try {
                const base64Data = watermarkSettings.imageUrl.split(',')[1];
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                
                let image;
                if (watermarkSettings.imageUrl.includes('data:image/png')) {
                  image = await editedPdf.embedPng(imageBytes);
                } else {
                  image = await editedPdf.embedJpg(imageBytes);
                }
                
                const imageDims = image.scale(0.3);
                const { x, y } = getPositionCoordinates(
                  watermarkSettings.position,
                  width,
                  height,
                  imageDims.width,
                  imageDims.height
                );
                
                page.drawImage(image, {
                  x: x - imageDims.width / 2,
                  y: y - imageDims.height / 2,
                  width: imageDims.width,
                  height: imageDims.height,
                  opacity: watermarkSettings.opacity / 100,
                  rotate: degrees(watermarkSettings.rotation)
                });
              } catch (imageError) {
                console.error("Error embedding watermark image:", imageError);
              }
            }
          }
          
          return await editedPdf.save();
        } catch (error) {
          console.error("Error applying watermark:", error);
          return null;
        }
      }
    }));

    return (
      <div className="pdf-editor">
        {isLoading || detectingElements ? (
          <div className="flex flex-col items-center justify-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pdf-blue mb-4"></div>
            <p className="text-gray-600">
              {isLoading ? "Loading PDF..." : "Detecting elements..."}
            </p>
          </div>
        ) : (
          <>
            {/* Tool-specific controls */}
            {editorMode === "text" && (
              <div className="bg-white p-3 mb-4 border rounded-md shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                  <Button onClick={addText} size="sm">Add Text</Button>
                  <div>
                    <Label htmlFor="fontSize" className="mr-2">Font Size</Label>
                    <Input 
                      id="fontSize"
                      type="number" 
                      className="w-20 inline-block"
                      value={textSettings.fontSize} 
                      onChange={(e) => handleTextSettingsChange('fontSize', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fontColor" className="mr-2">Color</Label>
                    <Input 
                      id="fontColor"
                      type="color" 
                      className="w-10 h-10 p-1"
                      value={textSettings.fontColor} 
                      onChange={(e) => handleTextSettingsChange('fontColor', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fontFamily" className="mr-2">Font</Label>
                    <select 
                      id="fontFamily"
                      className="border border-input bg-background px-3 py-2 text-base rounded-md"
                      value={textSettings.fontFamily}
                      onChange={(e) => handleTextSettingsChange('fontFamily', e.target.value)}
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  
                  <p className="text-sm text-gray-500">Click on text to edit content and style</p>
                </div>
              </div>
            )}

            {editorMode === "draw" && (
              <div className="bg-white p-3 mb-4 border rounded-md shadow-sm">
                <div className="flex flex-wrap gap-4 items-center">
                  <div>
                    <Label htmlFor="brushSize" className="mr-2">Brush Size</Label>
                    <Slider
                      id="brushSize"
                      min={1}
                      max={20}
                      step={1}
                      value={[drawingSettings.brushSize]}
                      onValueChange={(value) => setDrawingSettings(prev => ({ ...prev, brushSize: value[0] }))}
                      className="w-24"
                    />
                  </div>
                  <div>
                    <Label htmlFor="brushColor" className="mr-2">Color</Label>
                    <Input 
                      id="brushColor"
                      type="color" 
                      className="w-10 h-10 p-1"
                      value={drawingSettings.brushColor} 
                      onChange={(e) => setDrawingSettings(prev => ({ ...prev, brushColor: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {editorMode === "shapes" && (
              <div className="bg-white p-3 mb-4 border rounded-md shadow-sm">
                <div className="flex gap-2">
                  <Button onClick={() => addShape("rectangle")} size="sm">Rectangle</Button>
                  <Button onClick={() => addShape("circle")} size="sm">Circle</Button>
                  <Button onClick={() => addShape("line")} size="sm">Line</Button>
                </div>
              </div>
            )}

            {editorMode === "signature" && (
              <div className="bg-white p-3 mb-4 border rounded-md shadow-sm">
                <div className="flex gap-2">
                  <Button onClick={addSignature} size="sm">Add Signature Area</Button>
                  <Button onClick={() => document.getElementById('signature-upload')?.click()} size="sm">
                    Upload Signature
                  </Button>
                </div>
                <input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSignatureUpload}
                />
              </div>
            )}

            {editorMode === "rearrange" && (
              <div className="bg-white p-4 mb-4 border rounded-md shadow-sm">
                <h3 className="text-lg font-medium mb-3">Page Order</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {pageOrder.map((pageNum, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-2 text-center">
                        <div className="text-sm font-medium mb-2">Page {pageNum}</div>
                        <div className="flex justify-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => movePageUp(index)}
                            disabled={index === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => movePageDown(index)}
                            disabled={index === pageOrder.length - 1}
                          >
                            ↓
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {editorMode === "watermark" && (
              <div className="bg-white p-4 mb-4 border rounded-md shadow-sm">
                <div className="flex flex-wrap gap-4">
                  <div className="w-full">
                    <h3 className="text-lg font-medium mb-2">Watermark Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="mb-1 block">Apply Watermark To</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center">
                            <input 
                              type="radio" 
                              id="apply-current-page" 
                              name="apply-to"
                              className="mr-2"
                              checked={!watermarkSettings.applyToAllPages}
                              onChange={() => handleWatermarkChange({ applyToAllPages: false })}
                            />
                            <Label htmlFor="apply-current-page">Current page only</Label>
                          </div>
                          <div className="flex items-center">
                            <input 
                              type="radio" 
                              id="apply-all-pages" 
                              name="apply-to"
                              className="mr-2"
                              checked={watermarkSettings.applyToAllPages}
                              onChange={() => handleWatermarkChange({ applyToAllPages: true })}
                            />
                            <Label htmlFor="apply-all-pages">All pages</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="mb-1 block">Watermark Type</Label>
                        <div className="flex gap-4">
                          <div className="flex items-center">
                            <input 
                              type="radio" 
                              id="watermark-text" 
                              name="watermark-type"
                              className="mr-2"
                              checked={watermarkSettings.type === "text"}
                              onChange={() => handleWatermarkChange({ type: "text" })}
                            />
                            <Label htmlFor="watermark-text">Text</Label>
                          </div>
                          <div className="flex items-center">
                            <input 
                              type="radio" 
                              id="watermark-image" 
                              name="watermark-type"
                              className="mr-2"
                              checked={watermarkSettings.type === "image"}
                              onChange={() => handleWatermarkChange({ type: "image" })}
                            />
                            <Label htmlFor="watermark-image">Image</Label>
                          </div>
                        </div>
                      </div>
                      
                      {watermarkSettings.type === "text" ? (
                        <div>
                          <Label htmlFor="watermark-text-input" className="mb-1 block">Watermark Text</Label>
                          <Input 
                            id="watermark-text-input"
                            value={watermarkSettings.text}
                            onChange={(e) => handleWatermarkChange({ text: e.target.value })}
                            placeholder="Enter watermark text"
                            className="mb-2"
                          />
                        </div>
                      ) : (
                        <div>
                          <Button 
                            variant="outline"
                            onClick={() => document.getElementById('watermark-image-upload')?.click()}
                            className="mb-2"
                          >
                            {watermarkSettings.imageUrl ? "Change Image" : "Upload Image"}
                          </Button>
                          <input 
                            id="watermark-image-upload"
                            type="file" 
                            accept="image/*"
                            className="hidden"
                            onChange={handleWatermarkImageUpload}
                          />
                          {watermarkSettings.imageUrl && (
                            <div className="mt-2">
                              <img 
                                src={watermarkSettings.imageUrl} 
                                alt="Watermark preview" 
                                className="max-h-24 max-w-full border rounded"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="watermark-position" className="mb-1 block">Position</Label>
                        <select
                          id="watermark-position"
                          className="w-full border border-input bg-background px-3 py-2 rounded-md"
                          value={watermarkSettings.position}
                          onChange={(e) => handleWatermarkChange({ position: e.target.value })}
                        >
                          <option value="top-left">Top Left</option>
                          <option value="top-center">Top Center</option>
                          <option value="top-right">Top Right</option>
                          <option value="center-left">Center Left</option>
                          <option value="center">Center</option>
                          <option value="center-right">Center Right</option>
                          <option value="bottom-left">Bottom Left</option>
                          <option value="bottom-center">Bottom Center</option>
                          <option value="bottom-right">Bottom Right</option>
                        </select>
                      </div>
                      
                      <div>
                        <Label htmlFor="watermark-opacity" className="mb-1 block">
                          Opacity: {watermarkSettings.opacity}%
                        </Label>
                        <Slider
                          id="watermark-opacity"
                          min={5}
                          max={100}
                          step={5}
                          value={[watermarkSettings.opacity]}
                          onValueChange={(value) => handleWatermarkChange({ opacity: value[0] })}
                          className="w-full"
                        />
                      </div>
                      
                      {watermarkSettings.type === "text" && (
                        <div>
                          <Label htmlFor="watermark-font-size" className="mb-1 block">
                            Font Size: {watermarkSettings.fontSize}
                          </Label>
                          <Slider
                            id="watermark-font-size"
                            min={12}
                            max={96}
                            step={2}
                            value={[watermarkSettings.fontSize]}
                            onValueChange={(value) => handleWatermarkChange({ fontSize: value[0] })}
                            className="w-full"
                          />
                        </div>
                      )}
                      
                      <div>
                        <Label htmlFor="watermark-rotation" className="mb-1 block">
                          Rotation: {watermarkSettings.rotation}°
                        </Label>
                        <Slider
                          id="watermark-rotation"
                          min={0}
                          max={359}
                          step={15}
                          value={[watermarkSettings.rotation]}
                          onValueChange={(value) => handleWatermarkChange({ rotation: value[0] })}
                          className="w-full"
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="watermark-repeat" 
                          checked={watermarkSettings.repeat}
                          onCheckedChange={(checked) => 
                            handleWatermarkChange({ repeat: checked === true })
                          }
                        />
                        <Label htmlFor="watermark-repeat">
                          Repeat watermark across page
                        </Label>
                      </div>
                      
                      <div className="flex space-x-2 pt-2">
                        <Button
                          type="button"
                          onClick={() => setShowWatermarkPreview(!showWatermarkPreview)}
                        >
                          {showWatermarkPreview ? "Hide Preview" : "Show Preview"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {editorMode === "addpages" && (
              <div className="bg-white p-4 mb-4 border rounded-md shadow-sm">
                <h3 className="text-lg font-medium mb-3">Add New Pages</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Position</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="position-before" 
                          name="position"
                          className="mr-2"
                          checked={addPageSettings.position === "before"}
                          onChange={() => setAddPageSettings(prev => ({ ...prev, position: "before" }))}
                        />
                        <Label htmlFor="position-before">Before current page</Label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="position-after" 
                          name="position"
                          className="mr-2"
                          checked={addPageSettings.position === "after"}
                          onChange={() => setAddPageSettings(prev => ({ ...prev, position: "after" }))}
                        />
                        <Label htmlFor="position-after">After current page</Label>
                      </div>
                      <div className="flex items-center">
                        <input 
                          type="radio" 
                          id="position-end" 
                          name="position"
                          className="mr-2"
                          checked={addPageSettings.position === "end"}
                          onChange={() => setAddPageSettings(prev => ({ ...prev, position: "end" }))}
                        />
                        <Label htmlFor="position-end">At the end</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="page-size" className="mb-2 block">Page Size</Label>
                    <select
                      id="page-size"
                      className="w-full border border-input bg-background px-3 py-2 rounded-md"
                      value={addPageSettings.pageSize}
                      onChange={(e) => setAddPageSettings(prev => ({ 
                        ...prev, 
                        pageSize: e.target.value as "letter" | "a4" | "legal" 
                      }))}
                    >
                      <option value="letter">Letter (8.5" × 11")</option>
                      <option value="a4">A4 (210mm × 297mm)</option>
                      <option value="legal">Legal (8.5" × 14")</option>
                    </select>
                  </div>
                  
                  <div>
                    <Label htmlFor="page-count" className="mb-2 block">Number of Pages</Label>
                    <Input 
                      id="page-count"
                      type="number"
                      min="1"
                      max="10"
                      value={addPageSettings.count}
                      onChange={(e) => setAddPageSettings(prev => ({ 
                        ...prev, 
                        count: Math.max(1, Math.min(10, parseInt(e.target.value) || 1))
                      }))}
                      className="w-24"
                    />
                  </div>
                  
                  <Button onClick={handleAddPages} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add {addPageSettings.count} Page{addPageSettings.count !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            )}

            <div className="relative bg-gray-100 border rounded-md shadow-sm overflow-hidden" style={{ minHeight: '70vh' }}>
              <canvas ref={canvasRef} className="w-full h-full"></canvas>
              
              {/* Navigation controls */}
              {totalPages > 1 && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <span className="flex items-center bg-white px-3 py-1 rounded-md text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
              
              {/* Image upload input (hidden) */}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
          </>
        )}
      </div>
    );
  }
);

PDFEditor.displayName = "PDFEditor";

export default PDFEditor;
