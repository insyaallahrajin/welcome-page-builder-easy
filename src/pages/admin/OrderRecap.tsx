import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PrintButton } from '@/components/ui/print-button';
import { OrderRecapPrint } from '@/components/print/OrderRecapPrint';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { formatPrice, formatDate } from '@/utils/orderUtils';

interface OrderRecapData {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  created_at: string;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    menu_items: {
      name: string;
    };
  }[];
}

const OrderRecap = () => {
  const [orders, setOrders] = useState<OrderRecapData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrderRecap();
  }, []);

  const fetchOrderRecap = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          child_name,
          child_class,
          total_amount,
          created_at,
          order_items (
            id,
            quantity,
            price,
            menu_items (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order recap:', error);
      toast({
        title: "Error",
        description: "Gagal memuat rekap pesanan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const printContent = document.createElement('div');
      printContent.innerHTML = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Rekapitulasi Pesanan</title>
            <style>
              body { margin: 0; padding: 0; font-family: Arial, sans-serif; }
              .print-content { padding: 20px; }
              table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .bg-gray-50 { background-color: #f9f9f9; }
              @media print {
                body { print-color-adjust: exact; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div id="print-root"></div>
          </body>
        </html>
      `;
      
      printWindow.document.write(printContent.innerHTML);
      printWindow.document.close();
      
      // Wait for the document to load
      printWindow.onload = () => {
        const printRoot = printWindow.document.getElementById('print-root');
        if (printRoot) {
          // Create and mount the print component
          const React = require('react');
          const ReactDOM = require('react-dom');
          
          // For simplicity, we'll create the HTML directly
          printRoot.innerHTML = generatePrintHTML();
          
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
          }, 100);
        }
      };
    }
  };

  const generatePrintHTML = () => {
    // Combine all menu items without class separation
    const allMenuItems = orders.flatMap(order => 
      order.order_items.map(item => ({
        name: item.menu_items.name,
        quantity: item.quantity,
        price: item.price
      }))
    );

    // Group by menu name and sum quantities
    const groupedMenuItems = allMenuItems.reduce((acc, item) => {
      const existing = acc.find(i => i.name === item.name);
      if (existing) {
        existing.quantity += item.quantity;
        existing.totalPrice += item.price * item.quantity;
      } else {
        acc.push({
          name: item.name,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity
        });
      }
      return acc;
    }, [] as { name: string; quantity: number; totalPrice: number }[]);

    // Group by class
    const ordersByClass = orders.reduce((acc, order) => {
      if (!acc[order.child_class]) {
        acc[order.child_class] = [];
      }
      acc[order.child_class].push(order);
      return acc;
    }, {} as Record<string, OrderRecapData[]>);

    return `
      <div class="print-content">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">REKAPITULASI PESANAN</h1>
          <p style="color: #666;">Tanggal: ${formatDate(new Date().toISOString())}</p>
        </div>

        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Rekapitulasi Menu (Gabungan Semua Kelas)</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Menu</th>
                <th style="text-align: center;">Jumlah</th>
                <th style="text-align: right;">Total Harga</th>
              </tr>
            </thead>
            <tbody>
              ${groupedMenuItems.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td style="text-align: center;">${item.quantity}</td>
                  <td style="text-align: right;">${formatPrice(item.totalPrice)}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot>
              <tr class="bg-gray-50" style="font-weight: bold;">
                <td colspan="2" style="text-align: right;">Total:</td>
                <td style="text-align: center;">${groupedMenuItems.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td style="text-align: right;">${formatPrice(groupedMenuItems.reduce((sum, item) => sum + item.totalPrice, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div>
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 15px;">Rekapitulasi Menu per Kelas</h2>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Kelas</th>
                <th>Nama Menu</th>
                <th style="text-align: center;">Jumlah</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(ordersByClass).flatMap(([className, classOrders], classIndex) => {
                const classMenuItems = classOrders.flatMap(order => 
                  order.order_items.map(item => ({
                    name: item.menu_items.name,
                    quantity: item.quantity
                  }))
                );

                const groupedClassItems = classMenuItems.reduce((acc, item) => {
                  const existing = acc.find(i => i.name === item.name);
                  if (existing) {
                    existing.quantity += item.quantity;
                  } else {
                    acc.push({ name: item.name, quantity: item.quantity });
                  }
                  return acc;
                }, [] as { name: string; quantity: number }[]);

                return groupedClassItems.map((item, itemIndex) => `
                  <tr>
                    <td>${Object.keys(ordersByClass).slice(0, classIndex).reduce((sum, key) => {
                      const prevClassItems = ordersByClass[key].flatMap(order => 
                        order.order_items.map(item => item.menu_items.name)
                      );
                      const uniquePrevItems = [...new Set(prevClassItems)];
                      return sum + uniquePrevItems.length;
                    }, 0) + itemIndex + 1}</td>
                    <td>${className}</td>
                    <td>${item.name}</td>
                    <td style="text-align: center;">${item.quantity}</td>
                  </tr>
                `).join('');
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Dicetak pada: ${new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>
    `;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            Rekap Pesanan
          </h1>
          <p className="text-gray-600">Ringkasan pesanan yang masuk</p>
        </div>
        <PrintButton onPrint={handlePrint} />
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <CardTitle>{order.child_name}</CardTitle>
              <CardDescription>
                Kelas {order.child_class} • {formatDate(order.created_at)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.menu_items.name} x{item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 font-bold">
                  Total: {formatPrice(order.total_amount)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {orders.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-medium mb-2">Belum Ada Pesanan</h3>
            <p className="text-gray-600">Belum ada pesanan yang masuk</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OrderRecap;
