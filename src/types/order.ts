
export interface Order {
  id: string;
  child_name: string;
  child_class: string;
  total_amount: number;
  status: string;
  payment_status: string;
  notes: string | null;
  created_at: string;
  midtrans_order_id: string | null;
  order_items: {
    id: string;
    quantity: number;
    price: number;
    menu_items: {
      name: string;
      image_url: string;
    } | null;
  }[];
}
