export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  category: string;
  quantity: number; // Düşülen miktar
  unit: string;
  user: string;     // İşlemi yapan kullanıcı
  date: string;     // "YYYY-MM-DD" formatında
  month: string;    // "YYYY-MM" formatında (Aylık filtreleme için)
}

export const mockStockMovements: StockMovement[] = []; // Başlangıçta loglar temizlendi
