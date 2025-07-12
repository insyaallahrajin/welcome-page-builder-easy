
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Calendar, MapPin } from 'lucide-react';
import { Order } from '@/types/order';
import { 
  getStatusColor, 
  getPaymentStatusColor, 
  getStatusText, 
  getPaymentStatusText,
  formatPrice,
  formatDate 
} from '@/utils/orderUtils';

interface OrderCardProps {
  order: Order;
  isSelected?: boolean;
  onSelectionChange?: (orderId: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export const OrderCard = ({ order, isSelected = false, onSelectionChange, showCheckbox = false }: OrderCardProps) => (
  <Card className={`hover:shadow-lg transition-shadow ${isSelected ? 'ring-2 ring-orange-500' : ''}`}>
    <CardHeader>
      <div className="flex justify-between items-start">
        <div className="flex items-start space-x-3 flex-1">
          {showCheckbox && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelectionChange?.(order.id, !!checked)}
              className="mt-1"
            />
          )}
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2 text-orange-600" />
              {order.child_name}
            </CardTitle>
            <CardDescription className="space-y-1">
              <div className="flex items-center text-sm text-gray-600">
                <span>Kelas {order.child_class}</span>
              </div>
              {order.delivery_date && (
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  Tanggal Pengiriman: {formatDate(order.delivery_date)}
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1" />
                Dipesan: {formatDate(order.created_at)}
              </div>
            </CardDescription>
          </div>
        </div>
        <div className="text-right space-y-1">
          <Badge className={getStatusColor(order.status)}>
            {getStatusText(order.status)}
          </Badge>
          <Badge className={getPaymentStatusColor(order.payment_status)}>
            {getPaymentStatusText(order.payment_status)}
          </Badge>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        {/* Order Items */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-gray-700">Detail Pesanan:</h4>
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <img
                  src={item.menu_items?.image_url || '/placeholder.svg'}
                  alt={item.menu_items?.name || 'Unknown Item'}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.menu_items?.name || 'Unknown Item'}</p>
                  <p className="text-xs text-gray-600">
                    {formatPrice(item.price)} per item
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm">{item.quantity}x</p>
                <p className="text-xs text-gray-600">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Catatan:</strong> {order.notes}
            </p>
          </div>
        )}

        {/* Order Summary */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatPrice(order.total_amount)}</span>
          </div>
          <div className="flex justify-between items-center font-semibold text-lg">
            <span>Total Pembayaran:</span>
            <span className="text-orange-600">
              {formatPrice(order.total_amount)}
            </span>
          </div>
        </div>

        {/* Batch Payment Information */}
        {order.midtrans_order_id && order.midtrans_order_id.startsWith('BATCH-') && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Batch Payment ID:</strong> {order.midtrans_order_id}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Pesanan ini merupakan bagian dari pembayaran batch
            </p>
          </div>
        )}

        {/* Regular Payment Information */}
        {order.midtrans_order_id && !order.midtrans_order_id.startsWith('BATCH-') && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Order ID:</strong> {order.midtrans_order_id}
            </p>
          </div>
        )}

        {/* Payment Status Note */}
        {order.payment_status === 'pending' && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Status:</strong> Menunggu pembayaran - pilih pesanan ini untuk pembayaran batch atau bayar individual.
            </p>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);
