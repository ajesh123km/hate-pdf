
import React from "react";
import { Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface PermissionsSettingsProps {
  permissions: {
    printing: boolean;
    modifying: boolean;
    copying: boolean;
    annotating: boolean;
  };
  onPermissionChange: (permission: string, value: boolean) => void;
}

const PermissionsSettings = ({ permissions, onPermissionChange }: PermissionsSettingsProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Shield className="h-5 w-5 text-pdf-blue mr-2" />
          <h3 className="text-lg font-semibold">Document Permissions</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="printing"
              checked={permissions.printing}
              onCheckedChange={(checked) =>
                onPermissionChange('printing', checked as boolean)
              }
            />
            <Label htmlFor="printing">Allow printing</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="modifying"
              checked={permissions.modifying}
              onCheckedChange={(checked) =>
                onPermissionChange('modifying', checked as boolean)
              }
            />
            <Label htmlFor="modifying">Allow modifying</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="copying"
              checked={permissions.copying}
              onCheckedChange={(checked) =>
                onPermissionChange('copying', checked as boolean)
              }
            />
            <Label htmlFor="copying">Allow copying text</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="annotating"
              checked={permissions.annotating}
              onCheckedChange={(checked) =>
                onPermissionChange('annotating', checked as boolean)
              }
            />
            <Label htmlFor="annotating">Allow annotations</Label>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded mt-4">
          <strong>Note:</strong> Permission settings will be embedded in the protected file metadata.
        </div>
      </CardContent>
    </Card>
  );
};

export default PermissionsSettings;
