
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

const Header = () => {
  return (
    <header className="border-b sticky top-0 bg-white z-50">
      <div className="container mx-auto py-4 px-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-8 w-8 text-pdf-blue" />
          <span className="text-2xl font-bold text-gray-800">PDF Craft Pro</span>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <a href="/" className="text-gray-600 hover:text-pdf-blue transition-colors">Home</a>
          <a href="/tools" className="text-gray-600 hover:text-pdf-blue transition-colors">All Tools</a>
          <a href="/about" className="text-gray-600 hover:text-pdf-blue transition-colors">About</a>
        </nav>
        <div>
          <Button className="bg-pdf-blue hover:bg-pdf-lightBlue">Sign In</Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
