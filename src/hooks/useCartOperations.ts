
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { CartItem } from '@/types/cart';

interface Child {
  id: string;
  name: string;
  class_name: string;
}

export const useCartOperations = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Load Midtrans Snap script
    const script = document.createElement('script');
    script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', 'SB-Mid-client-your-client-key-here');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchChildren = async () => {
    try {
      if (!user?.id) {
        setChildren([
          { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
          { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
        ]);
        return;
      }

      // Query children table directly with fallback
      try {
        const { data, error } = await supabase
          .from('children')
          .select('id, name, class_name')
          .eq('user_id', user.id);

        if (error) {
          console.log('Error fetching children:', error);
          // Use fallback data
          setChildren([
            { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
            { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
          ]);
          return;
        }

        // Type the data explicitly
        const childrenData = (data || []) as Child[];
        setChildren(childrenData);
      } catch (queryError) {
        console.log('Query error, using fallback:', queryError);
        setChildren([
          { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
          { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching children:', error);
      // Fallback data
      setChildren([
        { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
        { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
      ]);
    }
  };

  const handleCheckout = async (items: CartItem[], onSuccess: () => void) => {
    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Keranjang kosong",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalAmount = items.reduce((total, item) => total + (item.price * item.quantity), 0);
      const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create single order for all items (multi-child, multi-date support)
      const uniqueChildren = Array.from(new Set(items.map(item => item.child_id)));
      const primaryChild = children.find(child => child.id === items[0].child_id);
      
      const orderData = {
        user_id: user?.id,
        total_amount: totalAmount,
        notes: notes || null,
        status: 'pending',
        payment_status: 'pending',
        order_number: orderId,
        child_name: uniqueChildren.length === 1 ? primaryChild?.name : `${uniqueChildren.length} Anak`,
        child_class: uniqueChildren.length === 1 ? primaryChild?.class_name : 'Multi Kelas',
        midtrans_order_id: orderId
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order line items for each cart item with proper child and date info
      const orderLineItems = items.map(item => {
        const childData = children.find(c => c.id === item.child_id);
        return {
          order_id: order.id,
          child_id: item.child_id,
          child_name: childData?.name || 'Unknown',
          child_class: childData?.class_name || null,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: item.price * item.quantity,
          delivery_date: item.date,
          order_date: new Date().toISOString().split('T')[0]
        };
      });

      const { error: lineItemsError } = await supabase
        .from('order_line_items')
        .insert(orderLineItems);

      if (lineItemsError) throw lineItemsError;

      // Prepare payment data
      const customerDetails = {
        first_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email,
        phone: user?.user_metadata?.phone || '08123456789',
      };

      const itemDetails = items.map((item, index) => ({
        id: `${item.id}-${index}`,
        price: item.price,
        quantity: item.quantity,
        name: `${item.name} (${children.find(c => c.id === item.child_id)?.name})`,
      }));

      // Create payment transaction
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke(
        'create-payment',
        {
          body: {
            orderId,
            amount: totalAmount,
            customerDetails,
            itemDetails,
          },
        }
      );

      if (paymentError) throw paymentError;

      // Open Midtrans Snap
      if (window.snap && paymentData.snap_token) {
        window.snap.pay(paymentData.snap_token, {
          onSuccess: (result) => {
            console.log('Payment success:', result);
            toast({
              title: "Pembayaran Berhasil!",
              description: "Pesanan Anda telah dikonfirmasi dan sedang diproses.",
            });
            onSuccess();
          },
          onPending: (result) => {
            console.log('Payment pending:', result);
            toast({
              title: "Menunggu Pembayaran",
              description: "Pembayaran Anda sedang diproses. Mohon tunggu konfirmasi.",
            });
            onSuccess();
          },
          onError: (result) => {
            console.error('Payment error:', result);
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam proses pembayaran. Silakan coba lagi.",
              variant: "destructive",
            });
          },
          onClose: () => {
            console.log('Payment popup closed');
            toast({
              title: "Pembayaran Dibatalkan",
              description: "Anda membatalkan proses pembayaran.",
            });
          }
        });
      } else {
        throw new Error('Midtrans Snap not loaded or token not received');
      }
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    children,
    selectedChildId,
    setSelectedChildId,
    notes,
    setNotes,
    loading,
    fetchChildren,
    handleCheckout
  };
};
