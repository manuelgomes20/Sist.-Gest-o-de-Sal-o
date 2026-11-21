export const mockClients = [
  { id: "1", name: "Ana Silva", phone: "(923) 999-123", email: "ana@email.com", lastVisit: "2026-04-02", totalVisits: 12 },
  { id: "2", name: "Maria Oliveira", phone: "(924) 888-567", email: "", lastVisit: "2026-04-01", totalVisits: 8 },
  { id: "3", name: "Carla Santos", phone: "(925) 777-901", email: "carla@email.com", lastVisit: "2026-03-28", totalVisits: 23 },
  { id: "4", name: "Juliana Costa", phone: "(926) 666-345", email: "", lastVisit: "2026-03-25", totalVisits: 5 },
  { id: "5", name: "Fernanda Lima", phone: "(927) 555-789", email: "fernanda@email.com", lastVisit: "2026-04-03", totalVisits: 17 },
];

export const mockEmployees = [
  { id: "1", name: "Patrícia Mendes", role: "Cabeleireira", type: "servico" as const, phone: "(921) 111-111", commission: 40, salary: 120000, status: "active", email: "", password: "" },
  { id: "2", name: "Roberto Alves", role: "Barbeiro", type: "servico" as const, phone: "(922) 222-222", commission: 35, salary: 100000, status: "active", email: "", password: "" },
  { id: "3", name: "Luciana Ferreira", role: "Manicure", type: "servico" as const, phone: "(923) 333-333", commission: 30, salary: 90000, status: "active", email: "", password: "" },
  { id: "4", name: "Amanda Ribeiro", role: "Esteticista", type: "servico" as const, phone: "(924) 444-444", commission: 45, salary: 130000, status: "active", email: "", password: "" },
  { id: "5", name: "Sofia Tavares", role: "Gerente", type: "gerente" as const, phone: "(925) 555-555", commission: 0, salary: 250000, status: "active", email: "sofia@genomni.ao", password: "" },
  { id: "6", name: "Teresa Nunes", role: "Recepcionista", type: "recepcionista" as const, phone: "(926) 666-666", commission: 0, salary: 150000, status: "active", email: "teresa@genomni.ao", password: "" },
];

export const mockServices = [
  { id: "1", name: "Corte Feminino", price: 5000, duration: 45, commission: 40, category: "Cabelo" },
  { id: "2", name: "Corte Masculino", price: 3000, duration: 30, commission: 35, category: "Cabelo" },
  { id: "3", name: "Coloração", price: 12000, duration: 120, commission: 30, category: "Cabelo" },
  { id: "4", name: "Escova Progressiva", price: 18000, duration: 180, commission: 35, category: "Cabelo" },
  { id: "5", name: "Manicure", price: 2500, duration: 40, commission: 30, category: "Unhas" },
  { id: "6", name: "Pedicure", price: 3500, duration: 50, commission: 30, category: "Unhas" },
  { id: "7", name: "Limpeza de Pele", price: 8000, duration: 60, commission: 40, category: "Estética" },
  { id: "8", name: "Design de Sobrancelha", price: 2000, duration: 20, commission: 30, category: "Estética" },
];

export const mockAppointments = [
  { id: "1", client: "Ana Silva", service: "Corte Feminino", employee: "Patrícia Mendes", date: "2026-04-04", time: "09:00", status: "confirmed" as const, price: 5000 },
  { id: "2", client: "Maria Oliveira", service: "Coloração", employee: "Patrícia Mendes", date: "2026-04-04", time: "10:00", status: "pending" as const, price: 12000 },
  { id: "3", client: "Carla Santos", service: "Manicure", employee: "Luciana Ferreira", date: "2026-04-04", time: "09:30", status: "confirmed" as const, price: 2500 },
  { id: "4", client: "Juliana Costa", service: "Limpeza de Pele", employee: "Amanda Ribeiro", date: "2026-04-04", time: "11:00", status: "pending" as const, price: 8000 },
  { id: "5", client: "Fernanda Lima", service: "Corte Masculino", employee: "Roberto Alves", date: "2026-04-04", time: "14:00", status: "completed" as const, price: 3000 },
  { id: "6", client: "Ana Silva", service: "Escova Progressiva", employee: "Patrícia Mendes", date: "2026-04-05", time: "09:00", status: "pending" as const, price: 18000 },
];

export const mockProducts = [
  { id: "1", name: "Shampoo Profissional 1L", category: "Cabelo", price: 3500, stock: 23, minStock: 5 },
  { id: "2", name: "Condicionador Profissional 1L", category: "Cabelo", price: 3200, stock: 18, minStock: 5 },
  { id: "3", name: "Tinta Loiro 60ml", category: "Coloração", price: 2000, stock: 3, minStock: 10 },
  { id: "4", name: "Esmalte Vermelho", category: "Unhas", price: 800, stock: 45, minStock: 10 },
  { id: "5", name: "Creme Hidratante 500ml", category: "Estética", price: 2500, stock: 12, minStock: 5 },
  { id: "6", name: "Água Oxigenada 20vol", category: "Coloração", price: 1200, stock: 2, minStock: 8 },
];

export const mockFinancial = {
  dailyRevenue: 85000,
  monthlyRevenue: 1950000,
  dailyExpenses: 22000,
  monthlyExpenses: 560000,
  pendingPayments: 230000,
  revenueByMonth: [
    { month: "Jan", revenue: 1500000, expenses: 510000 },
    { month: "Fev", revenue: 1680000, expenses: 530000 },
    { month: "Mar", revenue: 1850000, expenses: 550000 },
    { month: "Abr", revenue: 1950000, expenses: 560000 },
  ],
  revenueByService: [
    { name: "Cabelo", value: 980000 },
    { name: "Unhas", value: 390000 },
    { name: "Estética", value: 430000 },
    { name: "Outros", value: 150000 },
  ],
  dailyRevenues: [
    { day: "Seg", value: 75000 },
    { day: "Ter", value: 82000 },
    { day: "Qua", value: 68000 },
    { day: "Qui", value: 91000 },
    { day: "Sex", value: 105000 },
    { day: "Sáb", value: 130000 },
    { day: "Dom", value: 0 },
  ],
  weeklyRevenues: [
    { week: "Sem 1", value: 420000 },
    { week: "Sem 2", value: 480000 },
    { week: "Sem 3", value: 510000 },
    { week: "Sem 4", value: 540000 },
  ],
};

export const mockDashboard = {
  todayAppointments: 8,
  todayRevenue: 85000,
  monthRevenue: 1950000,
  totalClients: 156,
  newClientsMonth: 12,
  appointmentsByHour: [
    { hour: "08:00", count: 1 },
    { hour: "09:00", count: 3 },
    { hour: "10:00", count: 2 },
    { hour: "11:00", count: 2 },
    { hour: "12:00", count: 0 },
    { hour: "13:00", count: 1 },
    { hour: "14:00", count: 3 },
    { hour: "15:00", count: 2 },
    { hour: "16:00", count: 2 },
    { hour: "17:00", count: 1 },
  ],
};

export const formatKz = (value: number) => {
  return `Kz ${value.toLocaleString("pt-AO")}`;
};
