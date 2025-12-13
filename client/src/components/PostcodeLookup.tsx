import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Search, MapPin } from "lucide-react";

interface AddressData {
  postcode: string;
  address1: string;
  address2: string;
  city: string;
  county: string;
  country: string;
}

interface PostcodeLookupProps {
  onAddressFound: (address: AddressData) => void;
  initialPostcode?: string;
  className?: string;
}

export function PostcodeLookup({ onAddressFound, initialPostcode = "", className = "" }: PostcodeLookupProps) {
  const [postcode, setPostcode] = useState(initialPostcode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookupPostcode = async () => {
    if (!postcode.trim()) {
      setError("Please enter a postcode");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const cleanPostcode = postcode.replace(/\s+/g, "").toUpperCase();
      const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(cleanPostcode)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError("Postcode not found. Please check and try again.");
        } else {
          setError("Failed to lookup postcode. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      if (data.status === 200 && data.result) {
        const result = data.result;
        
        const addressData: AddressData = {
          postcode: result.postcode || postcode,
          address1: "",
          address2: result.admin_ward || "",
          city: result.admin_district || result.post_town || "",
          county: result.admin_county || result.region || "",
          country: result.country || "England",
        };

        onAddressFound(addressData);
        setError(null);
      } else {
        setError("Could not find address details for this postcode.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      lookupPostcode();
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={postcode}
            onChange={(e) => {
              setPostcode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter UK postcode (e.g. SW1A 1AA)"
            className="pl-10"
            data-testid="input-postcode-lookup"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={lookupPostcode}
          disabled={isLoading || !postcode.trim()}
          data-testid="button-lookup-postcode"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" data-testid="text-postcode-error">{error}</p>
      )}
    </div>
  );
}
