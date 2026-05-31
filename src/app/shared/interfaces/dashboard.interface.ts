export interface DashboardStats {
  testsByType: {
    MARCHA?: number;
    UTT?: number;
  };
  testsLast30Days: number;
  totalPatients: number;
  totalTests: number;
}