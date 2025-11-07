import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  type ProductFormData,
  type TokshopProduct,
} from "@shared/schema";
import { InventoryProductForm } from "@/components/inventory/inventory-product-form";

export default function EditProduct() {
  const [, params] = useRoute("/edit-product/:id");
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const productId = params?.id;

  // Fetch existing product data
  const { data: product, isLoading: loadingProduct, isError } = useQuery<TokshopProduct>({
    queryKey: ["external-product", productId],
    queryFn: async () => {
      if (!productId) throw new Error("Product ID required");
      
      const response = await fetch(
        `/api/products/${productId}?userId=${user?.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!productId,
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async (productData: ProductFormData) => {
      if (!productId) throw new Error("Product ID required");
      
      // Use admin endpoint if user is admin, otherwise use regular endpoint
      const endpoint = user?.admin 
        ? `/api/admin/products/${productId}` 
        : `/api/products/${productId}`;
      
      // Prepare the payload
      const payload: any = {
        ...productData,
        shippingProfile: productData.shippingProfile?.trim() ? productData.shippingProfile : null,
        tokshow: productData.tokshow && productData.tokshow !== "no-show" ? productData.tokshow : null,
        userId: user?.id,
      };
      
      // For auctions, ensure both price and startingPrice are sent, and preserve auction ID
      if (productData.listingType === 'auction') {
        if (productData.startingPrice !== undefined) {
          payload.price = productData.startingPrice;
          payload.startingPrice = productData.startingPrice;
        }
        // Include the auction ID if it exists
        if ((product as any)?.auction?._id) {
          payload.auction = (product as any).auction._id;
        }
      }
      
      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update product");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["external-products"] });
      queryClient.invalidateQueries({ queryKey: ["external-product", productId] });
      toast({
        title: "Product Updated",
        description: "Your product has been updated successfully.",
      });
      navigate("/inventory");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Update Product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!productId) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Invalid Product ID</h1>
          <p className="text-muted-foreground mt-2">No product ID provided.</p>
          <Button onClick={() => navigate("/inventory")} className="mt-4">
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  if (loadingProduct) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading product...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Product Not Found</h1>
          <p className="text-muted-foreground mt-2">The product you're trying to edit doesn't exist.</p>
          <Button onClick={() => navigate("/inventory")} className="mt-4">
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="page-edit-product">
      {/* Header */}
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => navigate("/inventory")}
          data-testid="button-back-to-inventory"
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="sm:inline">Back to Inventory</span>
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground" data-testid="text-page-title">
            Edit Product
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground" data-testid="text-page-description">
            Update product information: {product.name}
          </p>
        </div>
      </div>

      {/* Shared Form Component */}
      <InventoryProductForm
        mode="edit"
        product={product}
        onSubmit={(data) => updateProductMutation.mutate(data)}
        onCancel={() => navigate("/inventory")}
        isPending={updateProductMutation.isPending}
      />
    </div>
  );
}
