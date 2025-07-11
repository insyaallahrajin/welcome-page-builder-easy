
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

interface BatchOrder {
  id: string;
  child_id: string;
  child_name: string;
  child_class: string;
  items: CartItem[];
  notes: string;
  total: number;
}

export const useBatchCart = () => {
  const [batchOrders, setBatchOrders] = useState<BatchOrder[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
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

      const { data, error } = await supabase
        .from('children')
        .select('id, name, class_name')
        .eq('user_id', user.id);

      if (error) {
        console.log('Error fetching children:', error);
        setChildren([
          { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
          { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
        ]);
        return;
      }

      setChildren((data || []) as Child[]);
    } catch (error) {
      console.error('Error fetching children:', error);
      setChildren([
        { id: '1', name: 'Anak 1', class_name: 'Kelas 1A' },
        { id: '2', name: 'Anak 2', class_name: 'Kelas 2B' }
      ]);
    }
  };

  const addToBatch = (childId: string, items: CartItem[], notes: string) => {
    const child = children.find(c => c.id === childId);
    if (!child) {
      toast({
        title: "Error",
        description: "Pilih anak untuk pesanan ini",
        variant: "destructive",
      });
      return;
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newBatchOrder: BatchOrder = {
      id: Date.now().toString(),
      child_id: childId,
      child_name: child.name,
      child_class: child.class_name,
      items: [...items],
      notes,
      total
    };

    setBatchOrders(prev => [...prev, newBatchOrder]);
    
    toast({
      title: "Berhasil",
      description: `Pesanan untuk ${child.name} ditambahkan ke batch`,
    });
  };

  const removeBatchOrder = (batchId: string) => {
    setBatchOrders(prev => prev.filter(order => order.id !== batchId));
  };

  const getTotalBatchAmount = () => {
    return batchOrders.reduce((sum, order) => sum + order.total, 0);
  };

  const processBatchCheckout = async (onSuccess: () => void) => {
    if (batchOrders.length === 0) {
      toast({
        title: "Error",
        description: "Tidak ada pesanan dalam batch",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalAmount = getTotalBatchAmount();
      const orderId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create a single master order for the batch
      const masterOrderData = {
        user_id: user?.id,
        total_amount: totalAmount,
        notes: `Batch order dengan ${batchOrders.length} pesanan`,
        status: 'pending',
        payment_status: 'pending',
        order_number: orderId,
        child_name: batchOrders.length === 1 ? batchOrders[0].child_name : `${batchOrders.length} Anak`,
        child_class: batchOrders.length === 1 ? batchOrders[0].child_class : 'Multiple',
        midtrans_order_id: orderId
      };

      const { data: masterOrder, error: orderError } = await supabase
        .from('orders')
        .insert(masterOrderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items for all batch orders
      const allOrderItems = [];
      for (const batchOrder of batchOrders) {
        for (const item of batchOrder.items) {
          allOrderItems.push({
            order_id: masterOrder.id,
            menu_item_id: item.menu_item_id,
            quantity: item.quantity,
            price: item.price
          });
        }
      }

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(allOrderItems);

      if (itemsError) throw itemsError;

      // Prepare payment data
      const customerDetails = {
        first_name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Customer',
        email: user?.email,
        phone: user?.user_metadata?.phone || '08123456789',
      };

      // Create itemDetails for payment with all items
      const itemDetails = [];
      for (const batchOrder of batchOrders) {
        for (const item of batchOrder.items) {
          itemDetails.push({
            id: item.id,
            price: item.price,
            quantity: item.quantity,
            name: `${item.name} (${batchOrder.child_name})`,
          });
        }
      }

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

      // Save snap_token to database
      if (paymentData.snap_token) {
        await supabase
          .from('orders')
          .update({ snap_token: paymentData.snap_token })
          .eq('id', masterOrder.id);
      }

      // Open Midtrans Snap
      if (window.snap && paymentData.snap_token) {
        window.snap.pay(paymentData.snap_token, {
          onSuccess: (result) => {
            console.log('Batch payment success:', result);
            toast({
              title: "Pembayaran Berhasil!",
              description: `Batch pesanan untuk ${batchOrders.length} anak berhasil dibayar.`,
            });
            setBatchOrders([]); // Clear batch after successful payment
            onSuccess();
          },
          onPending: (result) => {
            console.log('Batch payment pending:', result);
            toast({
              title: "Menunggu Pembayaran",
              description: "Pembayaran batch sedang diproses. Mohon tunggu konfirmasi.",
            });
            setBatchOrders([]); // Clear batch
            onSuccess();
          },
          onError: (result) => {
            console.error('Batch payment error:', result);
            toast({
              title: "Pembayaran Gagal",
              description: "Terjadi kesalahan dalam proses pembayaran batch. Silakan coba lagi.",
              variant: "destructive",
            });
          },
          onClose: () => {
            console.log('Batch payment popup closed');
            toast({
              title: "Pembayaran Dibatalkan",
              description: "Anda membatalkan proses pembayaran batch.",
            });
          }
        });
      } else {
        throw new Error('Midtrans Snap not loaded or token not received');
      }
    } catch (error: any) {
      console.error('Error creating batch order:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat batch pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    batchOrders,
    children,
    loading,
    fetchChildren,
    addToBatch,
    removeBatchOrder,
    getTotalBatchAmount,
    processBatchCheckout
  };
};
