
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { User, Calendar, MapPin, Users } from 'lucide-react';
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

export const OrderCard = ({ order, isSelected = false, onSelectionChange, showCheckbox = false }: OrderCardProps) => {
  // Group line items by child and date for better display
  const groupedItems = order.order_line_items.reduce((acc, item) => {
    const key = `${item.child_name}-${item.delivery_date}`;
    if (!acc[key]) {
      acc[key] = {
        child_name: item.child_name,
        child_class: item.child_class,
        delivery_date: item.delivery_date,
        items: []
      };
    }
    acc[key].items.push(item);
    return acc;
  }, {} as any);

  const uniqueChildren = Array.from(new Set(order.order_line_items.map(item => item.child_name)));
  const uniqueDates = Array.from(new Set(order.order_line_items.map(item => item.delivery_date)));

  return (
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
                <Users className="h-5 w-5 mr-2 text-orange-600" />
                {uniqueChildren.length === 1 ? uniqueChildren[0] : `${uniqueChildren.length} Anak`}
              </CardTitle>
              <CardDescription className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {uniqueDates.length === 1 
                    ? `Pengiriman: ${formatDate(uniqueDates[0])}`
                    : `${uniqueDates.length} Tanggal Pengiriman`
                  }
                </div>
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
          {/* Order Items grouped by child and date */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Detail Pesanan:</h4>
            {Object.values(groupedItems).map((group: any, groupIndex: number) => (
              <div key={groupIndex} className="border rounded-lg p-3 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm text-orange-600">
                      <User className="h-4 w-4 inline mr-1" />
                      {group.child_name}
                    </p>
                    {group.child_class && (
                      <p className="text-xs text-gray-600">Kelas {group.child_class}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {formatDate(group.delivery_date)}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {group.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded">
                      <div className="flex items-center space-x-2">
                        <img
                          src={item.menu_items?.image_url || '/placeholder.svg'}
                          alt={item.menu_items?.name || 'Unknown Item'}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <div>
                          <p className="font-medium text-xs">{item.menu_items?.name || 'Unknown Item'}</p>
                          <p className="text-xs text-gray-600">
                            {formatPrice(item.unit_price)} per item
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-xs">{item.quantity}x</p>
                        <p className="text-xs text-gray-600">
                          {formatPrice(item.total_price || (item.unit_price * item.quantity))}
                        </p>
                      </div>
                    </div>
                  ))}
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
              <span>Total {order.order_line_items.length} Item:</span>
              <span>{formatPrice(order.total_amount)}</span>
            </div>
            <div className="flex justify-between items-center font-semibold text-lg">
              <span>Total Pembayaran:</span>
              <span className="text-orange-600">
                {formatPrice(order.total_amount)}
              </span>
            </div>
          </div>

          {/* Order Information */}
          {order.midtrans_order_id && (
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
                <strong>Status:</strong> Menunggu pembayaran - klik untuk melanjutkan pembayaran.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
