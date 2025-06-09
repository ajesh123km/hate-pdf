
import { FileText } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-pdf-blue" />
              <span className="text-xl font-bold text-gray-800">PDF Craft Pro</span>
            </div>
            <p className="text-gray-600">
              Advanced PDF tools for all your document needs. Edit, convert, and manage PDFs with ease.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">PDF Tools</h3>
            <ul className="space-y-2">
              <li><a href="/tools/merge" className="text-gray-600 hover:text-pdf-blue transition-colors">Merge PDF</a></li>
              <li><a href="/tools/split" className="text-gray-600 hover:text-pdf-blue transition-colors">Split PDF</a></li>
              <li><a href="/tools/compress" className="text-gray-600 hover:text-pdf-blue transition-colors">Compress PDF</a></li>
              <li><a href="/tools/convert" className="text-gray-600 hover:text-pdf-blue transition-colors">Convert PDF</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">More Tools</h3>
            <ul className="space-y-2">
              <li><a href="/tools/edit" className="text-gray-600 hover:text-pdf-blue transition-colors">Edit PDF</a></li>
              <li><a href="/tools/organize" className="text-gray-600 hover:text-pdf-blue transition-colors">Organize Pages</a></li>
              <li><a href="/tools/watermark" className="text-gray-600 hover:text-pdf-blue transition-colors">Add Watermark</a></li>
              <li><a href="/tools/protect" className="text-gray-600 hover:text-pdf-blue transition-colors">Protect PDF</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="/help" className="text-gray-600 hover:text-pdf-blue transition-colors">Help Center</a></li>
              <li><a href="/contact" className="text-gray-600 hover:text-pdf-blue transition-colors">Contact Us</a></li>
              <li><a href="/policy" className="text-gray-600 hover:text-pdf-blue transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="text-gray-600 hover:text-pdf-blue transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t mt-12 pt-8 text-center text-gray-600">
          <p>© {new Date().getFullYear()} PDF Craft Pro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
