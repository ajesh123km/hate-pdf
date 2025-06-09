
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolCard from "@/components/ToolCard";
import { Button } from "@/components/ui/button";
import { 
  FileText, 
  Scissors, 
  Merge, 
  FileDown, 
  FileUp, 
  Image, 
  FileEdit, 
  RotateCw, 
  Layers, 
  Lock,
  Shield
} from "lucide-react";

const pdfTools = [
  {
    title: "Merge PDF",
    description: "Combine multiple PDF documents into a single file",
    icon: Merge,
    path: "/tools/merge"
  },
  {
    title: "Split PDF",
    description: "Extract pages or split your PDF into multiple files",
    icon: Scissors,
    path: "/tools/split"
  },
  {
    title: "Compress PDF",
    description: "Reduce file size while maintaining quality",
    icon: FileDown,
    path: "/tools/compress"
  },
  {
    title: "PDF to Image",
    description: "Convert PDF pages to JPG, PNG or other image formats",
    icon: Image,
    path: "/tools/pdf-to-image"
  },
  {
    title: "Image to PDF",
    description: "Create PDF from images, screenshots or photos",
    icon: FileUp,
    path: "/tools/image-to-pdf"
  },
  {
    title: "Edit PDF",
    description: "Add text, images, shapes and annotations to your PDFs",
    icon: FileEdit,
    path: "/tools/edit"
  },
  {
    title: "Organize Pages",
    description: "Rearrange, rotate, and delete PDF pages",
    icon: RotateCw,
    path: "/tools/organize"
  },
  {
    title: "Add Watermark",
    description: "Insert text or image watermarks to your PDF pages",
    icon: Layers,
    path: "/tools/watermark"
  },
  {
    title: "Protect PDF",
    description: "Encrypt your PDFs with password protection",
    icon: Shield,
    path: "/tools/protect"
  },
  {
    title: "Unlock PDF",
    description: "Remove password protection from your PDFs",
    icon: Lock,
    path: "/tools/unlock"
  }
];

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-pdf-blue to-pdf-teal text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              All the PDF tools you'll ever need
            </h1>
            <p className="text-xl max-w-2xl mx-auto mb-8 opacity-90">
              Edit, merge, split, compress, convert, and secure PDF files with our powerful suite of PDF tools.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-white text-pdf-blue hover:bg-gray-100">
                <FileText className="mr-2 h-5 w-5" />
                Browse All Tools
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">
                Learn More
              </Button>
            </div>
          </div>
        </section>
        
        {/* Tools Grid Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">PDF Tools</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {pdfTools.map((tool, index) => (
                <ToolCard
                  key={index}
                  title={tool.title}
                  description={tool.description}
                  icon={tool.icon}
                  path={tool.path}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose PDF Craft Pro</h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="bg-blue-100 rounded-full p-4 inline-flex mb-4">
                  <Shield className="h-8 w-8 text-pdf-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Secure & Private</h3>
                <p className="text-gray-600">
                  Your files remain private. We process files in your browser and they never leave your computer.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-blue-100 rounded-full p-4 inline-flex mb-4">
                  <FileText className="h-8 w-8 text-pdf-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-3">High Quality</h3>
                <p className="text-gray-600">
                  Maintain the highest quality standards when processing your PDF documents.
                </p>
              </div>
              
              <div className="text-center p-6">
                <div className="bg-blue-100 rounded-full p-4 inline-flex mb-4">
                  <Layers className="h-8 w-8 text-pdf-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-3">All-in-One Solution</h3>
                <p className="text-gray-600">
                  Everything you need to work with PDFs in one convenient web application.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to transform your PDFs?</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Start using our powerful tools today to accomplish any PDF task with ease.
            </p>
            <Button size="lg" className="bg-pdf-blue hover:bg-pdf-lightBlue">
              Get Started Now
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
