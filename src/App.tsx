
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import MergePDF from "./pages/tools/MergePDF";
import SplitPDF from "./pages/tools/SplitPDF";
import PDFToImage from "./pages/tools/PDFToImage";
import ImageToPDF from "./pages/tools/ImageToPDF";
import CompressPDF from "./pages/tools/CompressPDF";
import EditPDF from "./pages/tools/EditPDF";
import ProtectPDF from "./pages/tools/ProtectPDF";
import UnlockPDF from "./pages/tools/UnlockPDF";
import OrganizePages from "./pages/tools/OrganizePages";
import WatermarkPDF from "./pages/tools/WatermarkPDF";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tools/merge" element={<MergePDF />} />
          <Route path="/tools/split" element={<SplitPDF />} />
          <Route path="/tools/pdf-to-image" element={<PDFToImage />} />
          <Route path="/tools/image-to-pdf" element={<ImageToPDF />} />
          <Route path="/tools/compress" element={<CompressPDF />} />
          <Route path="/tools/edit" element={<EditPDF />} />
          <Route path="/tools/protect" element={<ProtectPDF />} />
          <Route path="/tools/unlock" element={<UnlockPDF />} />
          <Route path="/tools/organize" element={<OrganizePages />} />
          <Route path="/tools/watermark" element={<WatermarkPDF />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
