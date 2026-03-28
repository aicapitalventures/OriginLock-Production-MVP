import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search } from "lucide-react";

export function Verify() {
  const [certId, setCertId] = useState("");
  const [, setLocation] = useLocation();

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (certId.trim()) {
      setLocation(`/verify/${encodeURIComponent(certId.trim())}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-24 px-4 relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background -z-10" />
        
        <div className="max-w-xl w-full text-center">
          <h1 className="text-4xl font-display font-bold mb-4">Verify a Certificate</h1>
          <p className="text-muted-foreground mb-10">
            Enter an OriginLock Certificate ID to view the timestamped public proof record and verify file authenticity.
          </p>

          <Card className="p-8 border-white/10 shadow-2xl shadow-black/50 bg-card/50 backdrop-blur-xl">
            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-4">
              <Input 
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
                placeholder="e.g. OL-2024-ABCD-1234"
                className="h-14 text-lg bg-background border-white/10"
                required
              />
              <Button type="submit" size="lg" className="h-14 px-8 font-semibold">
                <Search className="w-5 h-5 mr-2" />
                Verify
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-6">
              Certificate IDs are typically found at the bottom of the PDF certificate or in the shareable link provided by the creator.
            </p>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
