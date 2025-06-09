
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import FileDisplay from "./FileDisplay";
import PasswordForm from "./PasswordForm";
import PermissionsSettings from "./PermissionsSettings";
import ProtectPDFActions from "./ProtectPDFActions";

interface ProtectPDFFormProps {
  file: File;
  pdfBytes: Uint8Array | null;
  onReset: () => void;
}

const ProtectPDFForm = ({ file, pdfBytes, onReset }: ProtectPDFFormProps) => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [permissions, setPermissions] = useState({
    printing: true,
    modifying: true,
    copying: true,
    annotating: true,
  });
  const { toast } = useToast();

  const handlePermissionChange = (permission: string, value: boolean) => {
    setPermissions(prev => ({ ...prev, [permission]: value }));
  };

  const resetForm = () => {
    setPassword("");
    setConfirmPassword("");
    setPermissions({
      printing: true,
      modifying: true,
      copying: true,
      annotating: true,
    });
    onReset();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <FileDisplay fileName={file.name} onChangeFile={resetForm} />

          <div className="grid md:grid-cols-2 gap-6">
            <PasswordForm
              password={password}
              confirmPassword={confirmPassword}
              showPassword={showPassword}
              onPasswordChange={setPassword}
              onConfirmPasswordChange={setConfirmPassword}
              onTogglePasswordVisibility={() => setShowPassword(!showPassword)}
            />

            <PermissionsSettings
              permissions={permissions}
              onPermissionChange={handlePermissionChange}
            />
          </div>

          <ProtectPDFActions
            file={file}
            pdfBytes={pdfBytes}
            password={password}
            confirmPassword={confirmPassword}
            permissions={permissions}
            onSuccess={resetForm}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProtectPDFForm;
