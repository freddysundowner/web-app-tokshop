import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { type ProductFormData } from "@shared/schema";
import { InventoryProductForm } from "@/components/inventory/inventory-product-form";

export default function AddProduct() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      const isGiveaway = productData.listingType === 'giveaway';
      
      // Use giveaways endpoint for giveaways, products endpoint for regular products
      const url = isGiveaway ? `/api/giveaways` : `/api/products/${user?.id}`;
      
      const response = await apiRequest("POST", url, productData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-products"] });
      toast({
        title: "Product Created",
        description: "Your product has been created successfully.",
      });
      navigate("/inventory");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-3 sm:space-y-6" data-testid="page-add-product">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 sm:flex-col sm:items-start sm:space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/inventory")}
          data-testid="button-back-to-inventory"
          className="h-9 w-9 sm:hidden -ml-2"
          aria-label="Back to inventory"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="outline"
          onClick={() => navigate("/inventory")}
          data-testid="button-back-to-inventory-desktop"
          className="hidden sm:inline-flex"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inventory
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base sm:text-2xl font-bold text-foreground truncate" data-testid="text-page-title">
            Add New Product
          </h1>
          <p className="hidden sm:block text-sm sm:text-base text-muted-foreground" data-testid="text-page-description">
            Create a new product for your inventory
          </p>
        </div>
      </div>

      {/* Shared Form Component */}
      <InventoryProductForm
        mode="create"
        onSubmit={(data) => createProductMutation.mutate(data)}
        onCancel={() => navigate("/inventory")}
        isPending={createProductMutation.isPending}
      />
    </div>
  );
}
