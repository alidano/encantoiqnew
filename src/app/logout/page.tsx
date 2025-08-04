"use client";

import AppLayout from "@/components/layout/AppLayout";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    // Simulate logout process
    const timer = setTimeout(() => {
      // In a real app, you would clear session/token here
      router.push('/'); // Redirect to login page
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <CardTitle>Logging Out</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">You are being logged out. Please wait...</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
