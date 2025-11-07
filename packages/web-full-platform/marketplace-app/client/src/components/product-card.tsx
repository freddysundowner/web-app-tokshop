import { useLocation } from 'wouter';
import { ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: any;
}

export function ProductCard({ product }: ProductCardProps) {
  const [, setLocation] = useLocation();
  const productId = product._id || product.id;
  const images = product.images || product.productImages || [];
  const firstImage = images[0] || '/placeholder-product.png';
  const price = Number(product.price) || 0;
  const name = product.name || 'Untitled Product';
  const condition = product.condition || 'New';
  const quantity = Number(product.quantity) || 0;

  const handleClick = () => {
    setLocation(`/product/${productId}`);
  };

  return (
    <Card 
      className="hover-elevate active-elevate-2 cursor-pointer overflow-hidden flex-shrink-0 w-52 sm:w-60"
      onClick={handleClick}
    >
        <div className="relative aspect-square bg-muted">
          <img
            src={firstImage}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {quantity === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive">Sold Out</Badge>
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1">{name}</h3>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">${price.toFixed(0)}</p>
            <Badge variant="secondary" className="text-xs">{condition}</Badge>
          </div>
          {quantity > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {quantity} in stock
            </p>
          )}
        </CardContent>
    </Card>
  );
}
