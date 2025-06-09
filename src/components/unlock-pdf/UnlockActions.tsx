
import React, { useState } from "react";
import { saveAs } from "file-saver";
import { FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { unlockPDF } from "@/utils/pdfProtection";

interface UnlockActionsProps {
  file: File;
  encryptedBytes: Uint8Array | null;
  password: string;
  onSuccess: () => void;
}

const UnlockActions = ({ file, encryptedBytes, password, onSuccess }: UnlockActionsProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleUnlockAndDownload = async () => {
    if (!encryptedBytes || !file) return;
    
    if (!password) {
      toast({
        variant: "destructive",
        title: "Password Required",
        description: "Please enter the password to unlock the PDF.",
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      console.log('Attempting to unlock PDF...');
      const unlockedBytes = await unlockPDF(encryptedBytes, password);
      
      if (!unlockedBytes) {
        toast({
          variant: "destructive",
          title: "Incorrect Password",
          description: "The password you entered is incorrect. Please try again.",
        });
        setIsProcessing(false);
        return;
      }
      
      console.log('PDF unlocked successfully');
      const blob = new Blob([unlockedBytes], { type: "application/pdf" });
      const filename = file.name.replace(/\.pdf$/i, "").replace(/-protected$/, "");
      saveAs(blob, `${filename}-unlocked.pdf`);
      
      toast({
        title: "PDF Unlocked Successfully",
        description: "Your unlocked PDF has been downloaded.",
      });
      
      // Reset form after successful unlock
      onSuccess();
    } catch (error) {
      console.error("Error unlocking PDF:", error);
      toast({
        variant: "destructive",
        title: "Error Unlocking PDF",
        description: "There was an error unlocking your PDF file. Please check your password and try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && password) {
      handleUnlockAndDownload();
    }
  };

  return (
    <div className="mt-6 text-center" onKeyDown={handleKeyDown}>
      <Button 
        onClick={handleUnlockAndDownload} 
        disabled={isProcessing || !password} 
        size="lg"
        className="bg-pdf-blue hover:bg-pdf-lightBlue"
      >
        <FileDown className="mr-2 h-5 w-5" />
        {isProcessing ? "Unlocking..." : "Unlock & Download PDF"}
      </Button>
    </div>
  );
};

export default UnlockActions;
