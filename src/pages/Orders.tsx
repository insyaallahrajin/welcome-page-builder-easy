
import { useOrders } from '@/hooks/useOrders';
import { OrderFilters } from '@/components/orders/OrderFilters';
import { EmptyOrdersState } from '@/components/orders/EmptyOrdersState';
import { BatchPaymentButton } from '@/components/orders/BatchPaymentButton';
import { OrderSelectionControls } from '@/components/orders/OrderSelectionControls';
import { usePagination } from '@/hooks/usePagination';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { useState } from 'react';

const Orders = () => {
  const { orders, loading, fetchOrders } = useOrders();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  // Filter orders berdasarkan tab aktif
  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return orders.filter(order => order.status === 'pending');
      case 'confirmed':
        return orders.filter(order => order.status === 'confirmed');
      case 'preparing':
        return orders.filter(order => order.status === 'preparing');
      case 'delivered':
        return orders.filter(order => order.status === 'delivered');
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();
  const selectedOrders = orders.filter(order => selectedOrderIds.includes(order.id));

  // Pagination
  const {
    currentPage,
    totalPages,
    paginatedData: paginatedOrders,
    goToPage,
    canGoNext,
    canGoPrev,
    startIndex,
    endIndex,
    totalItems
  } = usePagination({
    data: filteredOrders,
    itemsPerPage: 12
  });

  const handlePaymentSuccess = () => {
    setSelectedOrderIds([]);
    fetchOrders();
  };

  const handleSelectAll = () => {
    setSelectedOrderIds(paginatedOrders.map(order => order.id));
  };

  const handleDeselectAll = () => {
    setSelectedOrderIds([]);
  };

  const handleSelectPending = () => {
    const pendingOrderIds = paginatedOrders
      .filter(order => order.payment_status === 'pending')
      .map(order => order.id);
    setSelectedOrderIds(pendingOrderIds);
  };

  const handleOrderSelection = (orderId: string, selected: boolean) => {
    if (selected) {
      setSelectedOrderIds(prev => [...prev, orderId]);
    } else {
      setSelectedOrderIds(prev => prev.filter(id => id !== orderId));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 md:h-32 md:w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-3 md:p-6">
      <div className="text-center mb-4 md:mb-8">
        <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1 md:mb-2">
          Riwayat Pesanan
        </h1>
        <p className="text-gray-600 text-sm md:text-base">Pantau status pesanan makanan anak Anda</p>
      </div>

      {orders.length === 0 ? (
        <EmptyOrdersState />
      ) : (
        <>
          {/* Batch Payment Button */}
          <BatchPaymentButton 
            selectedOrders={selectedOrders} 
            onPaymentSuccess={handlePaymentSuccess}
          />
          
          {/* Order Selection Controls */}
          <OrderSelectionControls
            orders={paginatedOrders}
            selectedOrders={selectedOrders}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            onSelectPending={handleSelectPending}
          />
          
          <OrderFilters 
            orders={paginatedOrders} 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            selectedOrderIds={selectedOrderIds}
            onOrderSelection={handleOrderSelection}
          />
          
          {/* Pagination Controls */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={goToPage}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            startIndex={startIndex}
            endIndex={endIndex}
            totalItems={totalItems}
            itemLabel="pesanan"
          />
        </>
      )}
    </div>
  );
};

export default Orders;
