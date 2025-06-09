
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import FileDisplay from "./FileDisplay";
import PasswordInput from "./PasswordInput";
import UnlockActions from "./UnlockActions";

interface UnlockPDFFormProps {
  file: File;
  encryptedBytes: Uint8Array | null;
  onReset: () => void;
}

const UnlockPDFForm = ({ file, encryptedBytes, onReset }: UnlockPDFFormProps) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setPassword("");
    onReset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FileDisplay fileName={file.name} onChangeFile={resetForm} />

          <PasswordInput
            password={password}
            showPassword={showPassword}
            onPasswordChange={setPassword}
            onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
          />

          <UnlockActions
            file={file}
            encryptedBytes={encryptedBytes}
            password={password}
            onSuccess={resetForm}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default UnlockPDFForm;
