
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Unlock, Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  password: string;
  showPassword: boolean;
  onPasswordChange: (password: string) => void;
  onTogglePasswordVisibility: () => void;
}

const PasswordInput = ({ 
  password, 
  showPassword, 
  onPasswordChange, 
  onTogglePasswordVisibility 
}: PasswordInputProps) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center mb-4">
          <Unlock className="h-5 w-5 text-pdf-blue mr-2" />
          <h3 className="text-lg font-semibold">Enter Password</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Enter the PDF password"
                className="pr-10"
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
        </div>
      </CardContent>
    </Card>
  );
};

export default PasswordInput;
