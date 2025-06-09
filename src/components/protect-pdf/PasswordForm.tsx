
import React from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFormProps {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
  onTogglePasswordVisibility: () => void;
}

const PasswordForm = ({
  password,
  confirmPassword,
  showPassword,
  onPasswordChange,
  onConfirmPasswordChange,
  onTogglePasswordVisibility,
}: PasswordFormProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Lock className="h-5 w-5 text-pdf-blue mr-2" />
          <h3 className="text-lg font-semibold">Password Protection</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Password *</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter password (min. 4 characters)"
                className="pr-10"
                minLength={4}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={onTogglePasswordVisibility}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirm Password *</Label>
            <Input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => onConfirmPasswordChange(e.target.value)}
              placeholder="Confirm password"
              minLength={4}
            />
          </div>
          
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>Important:</strong> The protected PDF will be encrypted and cannot be opened without the correct password. Make sure to remember your password as it cannot be recovered.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordForm;
