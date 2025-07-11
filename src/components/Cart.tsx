
import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CartItemList } from '@/components/cart/CartItemList';
import { OrderSummary } from '@/components/cart/OrderSummary';
import { CheckoutForm } from '@/components/cart/CheckoutForm';
import { BatchCartModal } from '@/components/cart/BatchCartModal';
import { useCartOperations } from '@/hooks/useCartOperations';
import { useBatchCart } from '@/hooks/useBatchCart';
import { CartItem } from '@/types/cart';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

const Cart = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartProps) => {
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [showBatchModal, setShowBatchModal] = useState(false);
  
  const { 
    children, 
    loading: cartLoading, 
    fetchChildren, 
    handleCheckout 
  } = useCartOperations();
  
  const {
    batchOrders,
    loading: batchLoading,
    addToBatch,
    removeBatchOrder,
    getTotalBatchAmount,
    processBatchCheckout
  } = useBatchCart();

  useEffect(() => {
    if (isOpen) {
      fetchChildren();
    }
  }, [isOpen, fetchChildren]);

  const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);

  const handleSingleCheckout = () => {
    handleCheckout(items, () => {
      onClearCart();
      onClose();
    });
  };

  const handleAddToBatch = () => {
    if (!selectedChildId) {
      return;
    }
    
    addToBatch(selectedChildId, items, notes);
    onClearCart();
    setSelectedChildId('');
    setNotes('');
    onClose();
  };

  const handleBatchCheckout = () => {
    processBatchCheckout(() => {
      onClearCart();
      setShowBatchModal(false);
      onClose();
    });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <ShoppingCart className="h-5 w-5 mr-2" />
                Keranjang Belanja
              </span>
              <Badge variant="secondary" className="ml-2">
                {items.length} item
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-lg font-medium text-gray-500 mb-2">
                  Keranjang masih kosong
                </p>
                <p className="text-gray-400">
                  Tambahkan menu untuk memulai pesanan
                </p>
              </div>
            ) : (
              <>
                <CartItemList
                  items={items}
                  onUpdateQuantity={onUpdateQuantity}
                  onRemoveItem={onRemoveItem}
                />

                <OrderSummary totalAmount={totalAmount} />

                <CheckoutForm
                  children={children}
                  selectedChildId={selectedChildId}
                  onChildSelect={setSelectedChildId}
                  notes={notes}
                  onNotesChange={setNotes}
                />

                {/* Batch Information */}
                {batchOrders.length > 0 && (
                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-blue-600 mr-2" />
                          <div>
                            <p className="font-medium text-blue-800">
                              Batch Pesanan Aktif
                            </p>
                            <p className="text-sm text-blue-600">
                              {batchOrders.length} pesanan menunggu checkout
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => setShowBatchModal(true)}
                          variant="outline"
                          size="sm"
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          Lihat Batch
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleAddToBatch}
                      variant="outline"
                      disabled={!selectedChildId || cartLoading}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Tambah ke Batch
                    </Button>
                    <Button
                      onClick={handleSingleCheckout}
                      disabled={!selectedChildId || cartLoading}
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                    >
                      {cartLoading ? 'Memproses...' : 'Checkout Langsung'}
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-2">
                      💡 Tip: Gunakan batch untuk menghemat biaya admin
                    </p>
                    <Button
                      onClick={onClearCart}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Kosongkan Keranjang
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Batch Cart Modal */}
      <BatchCartModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        batchOrders={batchOrders}
        onRemoveOrder={removeBatchOrder}
        onCheckout={handleBatchCheckout}
        totalAmount={getTotalBatchAmount()}
        loading={batchLoading}
      />
    </>
  );
};

export default Cart;
