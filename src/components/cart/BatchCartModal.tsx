
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, ShoppingCart, Users } from 'lucide-react';
import { formatPrice } from '@/utils/orderUtils';

interface BatchOrder {
  id: string;
  child_id: string;
  child_name: string;
  child_class: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  notes: string;
  total: number;
}

interface BatchCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  batchOrders: BatchOrder[];
  onRemoveOrder: (batchId: string) => void;
  onCheckout: () => void;
  totalAmount: number;
  loading: boolean;
}

export const BatchCartModal = ({
  isOpen,
  onClose,
  batchOrders,
  onRemoveOrder,
  onCheckout,
  totalAmount,
  loading
}: BatchCartModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Batch Pesanan ({batchOrders.length} pesanan)
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {batchOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Belum ada pesanan dalam batch</p>
              <p className="text-sm">Tambahkan pesanan untuk menghemat biaya admin</p>
            </div>
          ) : (
            <>
              {batchOrders.map((order) => (
                <Card key={order.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{order.child_name}</h3>
                        <p className="text-sm text-gray-600">Kelas: {order.child_class}</p>
                        {order.notes && (
                          <p className="text-sm text-blue-600 mt-1">
                            Catatan: {order.notes}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-orange-600">
                          {formatPrice(order.total)}
                        </p>
                        <Button
                          onClick={() => onRemoveOrder(order.id)}
                          variant="outline"
                          size="sm"
                          className="mt-2"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Items:</h4>
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span className="text-sm">{item.name}</span>
                          <div className="text-right">
                            <Badge variant="secondary">{item.quantity}x</Badge>
                            <span className="text-sm ml-2">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Summary */}
              <Card className="bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">Total Batch</p>
                      <p className="text-sm text-gray-600">
                        {batchOrders.length} pesanan • Hemat biaya admin!
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatPrice(totalAmount)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-4">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={loading}
                >
                  Tutup
                </Button>
                <Button
                  onClick={onCheckout}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                  disabled={loading || batchOrders.length === 0}
                >
                  {loading ? 'Memproses...' : `Checkout Batch (${formatPrice(totalAmount)})`}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
