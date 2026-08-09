export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: "admin" | "yonetici" | "waiter" | "kitchen" | "cashier";
  fullName: string;
}

export const mockUsers: User[] = [
  {
    id: "1",
    username: "admin",
    email: "admin@degirmen.com",
    password: "123",
    role: "admin",
    fullName: "Cafe Yöneticisi"
  },
  {
    id: "zafer_admin",
    username: "zafer",
    email: "zafer@degirmen.com",
    password: "1908",
    role: "admin",
    fullName: "Zafer Yönetici"
  },
  {
    id: "2",
    username: "ahmet_mutfak",
    email: "ahmet@degirmen.com",
    password: "123",
    role: "kitchen",
    fullName: "Ahmet Mutfak Usta"
  },
  {
    id: "3",
    username: "mehmet_garson",
    email: "mehmet@degirmen.com",
    password: "123",
    role: "waiter",
    fullName: "Mehmet Garson Yılmaz"
  }
];
