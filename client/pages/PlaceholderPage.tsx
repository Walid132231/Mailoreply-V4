import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock, Shield, Construction } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  protected?: boolean;
  admin?: boolean;
}

export default function PlaceholderPage({ title, protected: isProtected, admin }: PlaceholderPageProps) {
  const Icon = admin ? Shield : isProtected ? Lock : Construction;
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" asChild className="p-0 h-auto text-brand-600 hover:text-brand-700">
            <Link to="/" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <Card className="border-dashed border-2 border-gray-300">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Icon className="h-8 w-8 text-gray-400" />
            </div>
            <CardTitle className="text-2xl text-gray-900">{title}</CardTitle>
            <CardDescription className="text-lg">
              {admin && "Admin-only page coming soon"}
              {isProtected && !admin && "Protected dashboard page coming soon"}
              {!isProtected && !admin && "Public page coming soon"}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              This page is part of the MailoReply AI application structure. 
              Continue prompting to have this page implemented with full functionality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild>
                <Link to="/">Return Home</Link>
              </Button>
              {isProtected && (
                <Button variant="outline" asChild>
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Page Context */}
        <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Page Context</h3>
          <p className="text-blue-800 text-sm">
            {admin && "This page will contain admin controls for managing encryption, webhooks, AI providers, and user roles."}
            {isProtected && !admin && "This page will be part of the user dashboard for managing templates, analytics, and AI features."}
            {!isProtected && !admin && "This page will provide important information and functionality for all users."}
          </p>
        </div>
      </div>
    </div>
  );
}
