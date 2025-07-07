
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Order } from '@/types/order';
import { OrderCard } from './OrderCard';
import { filterOrdersByStatus } from '@/utils/orderUtils';

interface OrderFiltersProps {
  orders: Order[];
  onRetryPayment: (order: Order) => void;
}

export const OrderFilters = ({ orders, onRetryPayment }: OrderFiltersProps) => {
  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-4 md:mb-6 h-8 md:h-10">
        <TabsTrigger value="all" className="text-xs md:text-sm px-1 md:px-3">Semua</TabsTrigger>
        <TabsTrigger value="pending" className="text-xs md:text-sm px-1 md:px-3">Tunggu</TabsTrigger>
        <TabsTrigger value="confirmed" className="text-xs md:text-sm px-1 md:px-3">Konfirm</TabsTrigger>
        <TabsTrigger value="preparing" className="text-xs md:text-sm px-1 md:px-3">Siap</TabsTrigger>
        <TabsTrigger value="delivered" className="text-xs md:text-sm px-1 md:px-3">Selesai</TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="pending">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {filterOrdersByStatus(orders, 'pending').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="confirmed">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {filterOrdersByStatus(orders, 'confirmed').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="preparing">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {filterOrdersByStatus(orders, 'preparing').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="delivered">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
          {filterOrdersByStatus(orders, 'delivered').map((order) => (
            <OrderCard key={order.id} order={order} onRetryPayment={onRetryPayment} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
};
