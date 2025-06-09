
import React, { useState } from "react";
import { saveAs } from "file-saver";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { protectPDFWithPassword, type ProtectionOptions } from "@/utils/pdfProtection";

interface ProtectPDFActionsProps {
  file: File;
  pdfBytes: Uint8Array | null;
  password: string;
  confirmPassword: string;
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
  };
  onSuccess: () => void;
}

const ProtectPDFActions = ({
  file,
  pdfBytes,
  password,
  confirmPassword,
  permissions,
  onSuccess
}: ProtectPDFActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleProtectAndDownload = async () => {
    if (!pdfBytes || !file) return;
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter a password to protect your PDF.",
      });
      return;
    }

    if (password.length < 4) {
      toast({
        variant: "destructive",
        title: "Password Too Short",
        description: "Password must be at least 4 characters long.",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Password Mismatch",
        description: "Please make sure both password fields match.",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      const protectionOptions: ProtectionOptions = {
        userPassword: password,
        permissions
      };
      
      console.log('Starting PDF protection process...');
      const protectedBytes = await protectPDFWithPassword(pdfBytes, protectionOptions);
      console.log('PDF protection completed successfully');
      
      const blob = new Blob([protectedBytes], { type: "application/pdf" });
      const filename = file.name.replace(/\.pdf$/i, "");
      saveAs(blob, `${filename}-protected.pdf`);
      
      toast({
        title: "PDF Protected Successfully",
        description: "Your PDF has been protected with password encryption. Use the 'Unlock PDF' tool to remove protection with the correct password.",
      });
      
      // Reset form after successful protection
      onSuccess();
    } catch (error) {
      console.error("Error protecting PDF:", error);
      toast({
        variant: "destructive",
        title: "Error Protecting PDF",
        description: "There was an error protecting your PDF file. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isDisabled = isProcessing || !password || password.length < 4 || password !== confirmPassword;

  return (
    <div className="mt-6 text-center">
      <Button 
        onClick={handleProtectAndDownload} 
        disabled={isDisabled} 
        size="lg"
        className="bg-pdf-blue hover:bg-pdf-lightBlue"
      >
        <FileDown className="mr-2 h-5 w-5" />
        {isProcessing ? "Protecting PDF..." : "Protect & Download PDF"}
      </Button>
    </div>
  );
};

export default ProtectPDFActions;
