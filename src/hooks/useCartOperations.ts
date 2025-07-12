
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { CartItem } from '@/types/cart';

declare global {
  interface Window {
    snap: {
      pay: (token: string, options?: {
        onSuccess?: (result: any) => void;
        onPending?: (result: any) => void;
        onError?: (result: any) => void;
        onClose?: () => void;
      }) => void;
    };
  }
}

interface Child {
  id: string;
  name: string;
  class_name: string;
}

export const useCartOperations = () => {
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchChildren = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setChildren(data || []);
    } catch (error) {
      console.error('Error fetching children:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data anak",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (
    cartItems: CartItem[],
    onSuccess?: () => void
  ) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChildId) {
      toast({
        title: "Error",
        description: "Silakan pilih anak terlebih dahulu",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Generate order number
      const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Get selected child info
      const selectedChild = children.find(child => child.id === selectedChildId);
      
      // Create main order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_number: orderNumber,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
          parent_notes: notes,
          child_name: selectedChild?.name || '',
          child_class: selectedChild?.class_name || ''
        })
        .select()
        .single();

      if (orderError || !orderData) {
        console.error('Error creating order:', orderError);
        throw new Error('Gagal membuat pesanan');
      }

      console.log('Order created:', orderData);

      // Create order line items
      const orderLineItems = cartItems.map(item => ({
        order_id: orderData.id,
        child_id: selectedChildId,
        child_name: selectedChild?.name || '',
        child_class: selectedChild?.class_name || '',
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        delivery_date: item.delivery_date || item.date || new Date().toISOString().split('T')[0],
        order_date: new Date().toISOString().split('T')[0]
      }));

      const { error: lineItemsError } = await supabase
        .from('order_line_items')
        .insert(orderLineItems);

      if (lineItemsError) {
        console.error('Error creating order line items:', lineItemsError);
        throw new Error('Gagal menyimpan detail pesanan');
      }

      console.log('Order line items created successfully');

      // Generate Midtrans order ID
      const midtransOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Update order with Midtrans order ID
      const { error: updateError } = await supabase
        .from('orders')
        .update({ midtrans_order_id: midtransOrderId })
        .eq('id', orderData.id);
        
      if (updateError) {
        console.error('Error updating order with midtrans_order_id:', updateError);
        throw updateError;
      }

      // Prepare customer details
      const customerDetails = {
        first_name: user.user_metadata?.full_name || 'Customer',
        email: user.email || 'parent@example.com',
        phone: user.user_metadata?.phone || '08123456789',
      };

      // Prepare item details for Midtrans
      const itemDetails = cartItems.map(item => ({
        id: item.menu_item_id,
        price: item.price,
        quantity: item.quantity,
        name: `${item.name} - ${selectedChild?.name}`,
      }));

      console.log('Calling create-payment:', {
        orderId: midtransOrderId,
        amount: totalAmount,
        customerDetails,
        itemDetails
      });

      // Create payment via Supabase function
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId: midtransOrderId,
            amount: totalAmount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) {
        console.error('Payment error:', paymentError);
        throw paymentError;
      }

      if (paymentData.snap_token) {
        // Save snap_token to database
        const { error: saveTokenError } = await supabase
          .from('orders')
          .update({ snap_token: paymentData.snap_token })
          .eq('id', orderData.id);

        if (saveTokenError) {
          console.error('Error saving snap_token:', saveTokenError);
        }

        // Open Midtrans payment popup
        if (window.snap) {
          window.snap.pay(paymentData.snap_token, {
            onSuccess: () => {
              toast({
                title: "Pembayaran Berhasil!",
                description: "Pesanan Anda telah berhasil dibuat dan dibayar.",
              });
              onSuccess?.();
            },
            onPending: () => {
              toast({
                title: "Pembayaran Tertunda",
                description: "Pembayaran Anda sedang diproses.",
              });
              onSuccess?.();
            },
            onError: () => {
              toast({
                title: "Pembayaran Gagal",
                description: "Terjadi kesalahan dalam pembayaran.",
                variant: "destructive",
              });
            }
          });
        } else {
          throw new Error('Midtrans Snap belum loaded');
        }
      } else {
        throw new Error('Snap token tidak diterima');
      }

      return orderData;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memproses checkout",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return {
    handleCheckout,
    isCheckingOut,
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading,
    fetchChildren
  };
};
