import type { Region } from "./communities";

export type City = {
  name: string;
  state: string;
  region: Region;
  /** Salaries scale with cost of living; a Bengaluru PM out-earns a Nagpur one. */
  incomeMultiplier: number;
  /** Relative likelihood of a profile living here. */
  weight: number;
};

export const CITIES: City[] = [
  { name: "Mumbai", state: "Maharashtra", region: "MAHARASHTRA", incomeMultiplier: 1.35, weight: 14 },
  { name: "Pune", state: "Maharashtra", region: "MAHARASHTRA", incomeMultiplier: 1.15, weight: 12 },
  { name: "Nagpur", state: "Maharashtra", region: "MAHARASHTRA", incomeMultiplier: 0.75, weight: 3 },
  { name: "Bengaluru", state: "Karnataka", region: "KARNATAKA", incomeMultiplier: 1.4, weight: 14 },
  { name: "Mysuru", state: "Karnataka", region: "KARNATAKA", incomeMultiplier: 0.8, weight: 2 },
  { name: "New Delhi", state: "Delhi", region: "DELHI_NCR", incomeMultiplier: 1.25, weight: 10 },
  { name: "Gurugram", state: "Haryana", region: "DELHI_NCR", incomeMultiplier: 1.3, weight: 7 },
  { name: "Noida", state: "Uttar Pradesh", region: "DELHI_NCR", incomeMultiplier: 1.1, weight: 5 },
  { name: "Chennai", state: "Tamil Nadu", region: "TAMIL_NADU", incomeMultiplier: 1.05, weight: 9 },
  { name: "Coimbatore", state: "Tamil Nadu", region: "TAMIL_NADU", incomeMultiplier: 0.78, weight: 3 },
  { name: "Ahmedabad", state: "Gujarat", region: "GUJARAT", incomeMultiplier: 0.95, weight: 6 },
  { name: "Surat", state: "Gujarat", region: "GUJARAT", incomeMultiplier: 0.85, weight: 3 },
  { name: "Kolkata", state: "West Bengal", region: "WEST_BENGAL", incomeMultiplier: 0.9, weight: 7 },
  { name: "Chandigarh", state: "Punjab", region: "PUNJAB", incomeMultiplier: 0.95, weight: 4 },
  { name: "Ludhiana", state: "Punjab", region: "PUNJAB", incomeMultiplier: 0.82, weight: 2 },
  { name: "Hyderabad", state: "Telangana", region: "TELANGANA", incomeMultiplier: 1.2, weight: 9 },
];
