
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ShoppingCart, X } from 'lucide-react';
import { CartItem } from '@/types/cart';
import { useCartOperations } from '@/hooks/useCartOperations';
import CartItemList from '@/components/cart/CartItemList';
import CheckoutForm from '@/components/cart/CheckoutForm';
import OrderSummary from '@/components/cart/OrderSummary';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
  cartOperations: ReturnType<typeof useCartOperations>;
}

const Cart = ({ isOpen, onClose, cartItems, onRemoveItem, onCheckout, cartOperations }: CartProps) => {
  const {
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading,
    fetchChildren,
    handleCheckout
  } = cartOperations;

  useEffect(() => {
    if (isOpen) {
      fetchChildren();
    }
  }, [isOpen, fetchChildren]);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity === 0) {
      onRemoveItem(itemId);
    } else {
      // Handle quantity update - this would need to be passed as a prop or handled differently
      console.log('Update quantity not implemented in this interface');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckoutClick = async () => {
    await handleCheckout(cartItems, () => {
      onCheckout();
      onClose();
      setSelectedChildId('');
      setNotes('');
    });
  };

  if (cartItems.length === 0) {
    return null;
  }

  const canCheckout = selectedChildId && children.length > 0;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Keranjang Belanja</SheetTitle>
          <SheetDescription>
            Review pesanan Anda dan pilih anak untuk pengiriman
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          {/* Cart Items */}
          <CartItemList
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={onRemoveItem}
            formatPrice={formatPrice}
          />

          {/* Checkout Form */}
          <CheckoutForm
            children={children}
            selectedChildId={selectedChildId}
            onChildSelect={setSelectedChildId}
            notes={notes}
            onNotesChange={setNotes}
          />

          {/* Order Summary */}
          <OrderSummary
            totalPrice={getTotalPrice()}
            formatPrice={formatPrice}
            onCheckout={handleCheckoutClick}
            loading={loading}
            canCheckout={canCheckout}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default Cart;
