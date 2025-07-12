
import { Button } from '@/components/ui/button';
import { CheckSquare, Square } from 'lucide-react';
import { Order } from '@/types/order';

interface OrderSelectionControlsProps {
  orders: Order[];
  selectedOrders: Order[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectPending: () => void;
}

export const OrderSelectionControls = ({ 
  orders, 
  selectedOrders, 
  onSelectAll, 
  onDeselectAll, 
  onSelectPending 
}: OrderSelectionControlsProps) => {
  const pendingOrders = orders.filter(order => order.payment_status === 'pending');
  const allSelected = orders.length > 0 && selectedOrders.length === orders.length;
  const someSelected = selectedOrders.length > 0;
  const pendingSelected = pendingOrders.every(order => 
    selectedOrders.some(selected => selected.id === order.id)
  );

  return (
    <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Pilih pesanan:</span>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="flex items-center gap-1"
      >
        {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
        {allSelected ? 'Batalkan Semua' : 'Pilih Semua'}
      </Button>

      {pendingOrders.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectPending}
          className="flex items-center gap-1"
        >
          {pendingSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
          Pilih Belum Bayar ({pendingOrders.length})
        </Button>
      )}

      {someSelected && (
        <div className="flex items-center text-sm text-gray-600">
          <span>{selectedOrders.length} pesanan dipilih</span>
        </div>
      )}
    </div>
  );
};
