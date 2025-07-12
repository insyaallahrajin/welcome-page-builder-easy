
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Calendar, User, CreditCard, Receipt } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && orderId) {
      fetchOrderDetail();
    }
  }, [user, orderId]);

  const fetchOrderDetail = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_line_items (
            id,
            order_id,
            child_id,
            child_name,
            child_class,
            menu_item_id,
            quantity,
            unit_price,
            total_price,
            delivery_date,
            order_date,
            notes,
            created_at,
            updated_at,
            menu_items (
              name,
              image_url,
              description
            )
          ),
          payments (
            id,
            amount,
            payment_method,
            status,
            transaction_id,
            created_at
          )
        `)
        .eq('id', orderId)
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error fetching order detail:', error);
        toast({
          title: "Error",
          description: "Gagal memuat detail pesanan",
          variant: "destructive",
        });
        return;
      }

      if (!data) {
        toast({
          title: "Pesanan Tidak Ditemukan",
          description: "Pesanan yang Anda cari tidak ditemukan",
          variant: "destructive",
        });
        navigate('/orders');
        return;
      }

      // Transform the data to match our interface
      const transformedOrder = {
        ...data,
        order_line_items: data.order_line_items.map((item: any) => ({
          ...item,
          menu_items: item.menu_items || { name: 'Unknown Item', image_url: '', description: '' }
        }))
      };

      setOrder(transformedOrder);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'paid':
      case 'success':
      case 'delivered':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const groupItemsByChild = () => {
    if (!order) return {};
    
    const grouped = order.order_line_items.reduce((acc: any, item) => {
      const childKey = `${item.child_name}_${item.child_class}`;
      if (!acc[childKey]) {
        acc[childKey] = {
          child_name: item.child_name,
          child_class: item.child_class,
          items: []
        };
      }
      acc[childKey].items.push(item);
      return acc;
    }, {});

    return grouped;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto p-3 md:p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Pesanan Tidak Ditemukan</h1>
          <Button onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali ke Riwayat Pesanan
          </Button>
        </div>
      </div>
    );
  }

  const groupedItems = groupItemsByChild();
  const paymentInfo = order.payments?.[0];

  return (
    <div className="max-w-4xl mx-auto p-3 md:p-6">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/orders')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Riwayat Pesanan
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Detail Pesanan
            </h1>
            <p className="text-gray-600">#{order.order_number}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Badge variant={getStatusBadgeVariant(order.status || '')}>
              {order.status?.toUpperCase() || 'PENDING'}
            </Badge>
            <Badge variant={getStatusBadgeVariant(order.payment_status || '')}>
              {order.payment_status?.toUpperCase() || 'PENDING'}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Ringkasan Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Nomor Pesanan</p>
                  <p className="font-semibold">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-gray-600">Tanggal Pesanan</p>
                  <p className="font-semibold">{formatDate(order.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-600">Total Pembayaran</p>
                  <p className="font-semibold text-lg text-orange-600">
                    {formatCurrency(order.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Status Pembayaran</p>
                  <Badge variant={getStatusBadgeVariant(order.payment_status || '')}>
                    {order.payment_status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
              </div>
              
              {order.parent_notes && (
                <>
                  <Separator className="my-4" />
                  <div>
                    <p className="text-gray-600 text-sm mb-2">Catatan Orang Tua</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-lg">{order.parent_notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Order Items by Child */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Detail Pesanan per Anak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(groupedItems).map(([childKey, childData]: [string, any]) => (
                  <div key={childKey} className="border rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{childData.child_name}</h3>
                        <p className="text-gray-600 text-sm">{childData.child_class}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {childData.items.map((item: any) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <div>
                              <p className="font-medium">{item.menu_items.name}</p>
                              <p className="text-sm text-gray-600">
                                📅 {formatDate(item.delivery_date)}
                              </p>
                              {item.menu_items.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {item.menu_items.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              {formatCurrency(item.unit_price)}
                            </p>
                            <p className="text-sm text-gray-600">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="my-3" />
                    <div className="flex justify-between items-center">
                      <p className="font-medium">Subtotal {childData.child_name}</p>
                      <p className="font-semibold text-orange-600">
                        {formatCurrency(
                          childData.items.reduce((sum: number, item: any) => 
                            sum + (item.total_price || item.unit_price * item.quantity), 0
                          )
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Informasi Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-gray-600">Status Pembayaran</p>
                  <Badge variant={getStatusBadgeVariant(order.payment_status || '')}>
                    {order.payment_status?.toUpperCase() || 'PENDING'}
                  </Badge>
                </div>
                
                {paymentInfo && (
                  <>
                    <div>
                      <p className="text-gray-600">Metode Pembayaran</p>
                      <p className="font-semibold capitalize">
                        {paymentInfo.payment_method || order.payment_method || 'Midtrans'}
                      </p>
                    </div>
                    
                    {paymentInfo.transaction_id && (
                      <div>
                        <p className="text-gray-600">ID Transaksi</p>
                        <p className="font-mono text-xs break-all">
                          {paymentInfo.transaction_id}
                        </p>
                      </div>
                    )}
                    
                    <div>
                      <p className="text-gray-600">Waktu Pembayaran</p>
                      <p className="font-semibold">
                        {formatDate(paymentInfo.created_at)}
                      </p>
                    </div>
                  </>
                )}
                
                {order.midtrans_order_id && (
                  <div>
                    <p className="text-gray-600">Order ID Midtrans</p>
                    <p className="font-mono text-xs break-all">
                      {order.midtrans_order_id}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Total Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Total Pembayaran</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-600">
                    {formatCurrency(order.total_amount)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
