import type { CollegeTier } from "./colleges";

/**
 * A profession carries its own career ladder, employer pool, and pay band.
 * `baseLpa` is annual income in lakhs at the junior rung, before the city
 * multiplier and seniority step are applied.
 */
export type Profession = {
  field: string;
  /** Junior → senior. Index is chosen from years of experience. */
  ladder: string[];
  employers: string[];
  baseLpa: number;
  /** Per-rung multiplier climbing the ladder. */
  seniorityStep: number;
  /** Elite-college graduates skew toward these fields. */
  eliteAffinity: number;
  /**
   * Degrees the field actually hires. Keyed by level so a Product Manager
   * cannot end up holding an LLM.
   */
  degrees: Partial<Record<"DIPLOMA" | "BACHELORS" | "MASTERS" | "DOCTORATE", string[]>>;
};

export const PROFESSIONS: Profession[] = [
  {
    field: "Software",
    ladder: ["Software Engineer", "Senior Software Engineer", "Engineering Manager", "Principal Engineer"],
    employers: ["Infosys", "TCS", "Google India", "Microsoft IDC", "Flipkart", "Zoho", "Razorpay", "Swiggy", "Wipro"],
    baseLpa: 9, seniorityStep: 1.55, eliteAffinity: 3,
    degrees: { BACHELORS: ["B.Tech", "B.E.", "B.Sc Computer Science"], MASTERS: ["M.Tech", "MCA", "M.S."] },
  },
  {
    field: "Product",
    ladder: ["Associate Product Manager", "Product Manager", "Senior Product Manager", "Director of Product"],
    employers: ["Zomato", "PhonePe", "Meesho", "Freshworks", "CRED", "Atlassian India"],
    baseLpa: 14, seniorityStep: 1.5, eliteAffinity: 4,
    degrees: { BACHELORS: ["B.Tech", "B.E.", "BBA"], MASTERS: ["MBA", "M.Tech"] },
  },
  {
    field: "Medicine",
    ladder: ["Resident Doctor", "Consultant Physician", "Senior Consultant", "Head of Department"],
    employers: ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals", "AIIMS", "Kokilaben Hospital"],
    baseLpa: 8, seniorityStep: 1.7, eliteAffinity: 2,
    degrees: { BACHELORS: ["MBBS", "BDS", "BAMS"], DOCTORATE: ["MD", "MS", "DM"] },
  },
  {
    field: "Finance",
    ladder: ["Financial Analyst", "Senior Analyst", "Vice President", "Managing Director"],
    employers: ["HDFC Bank", "ICICI Bank", "Goldman Sachs India", "Kotak Mahindra", "Deloitte India", "KPMG"],
    baseLpa: 11, seniorityStep: 1.6, eliteAffinity: 3,
    degrees: { BACHELORS: ["B.Com", "BBA", "B.A. Economics"], MASTERS: ["MBA", "M.Com", "CA"] },
  },
  {
    field: "Law",
    ladder: ["Associate", "Senior Associate", "Partner"],
    employers: ["Cyril Amarchand Mangaldas", "AZB & Partners", "Khaitan & Co", "Trilegal"],
    baseLpa: 10, seniorityStep: 1.75, eliteAffinity: 2,
    degrees: { BACHELORS: ["LLB", "B.A. LLB"], MASTERS: ["LLM"] },
  },
  {
    field: "Design",
    ladder: ["Visual Designer", "Product Designer", "Design Lead", "Design Director"],
    employers: ["Lollypop Studio", "Obvious", "Zomato", "Myntra", "Titan"],
    baseLpa: 8, seniorityStep: 1.45, eliteAffinity: 1,
    degrees: { BACHELORS: ["B.Des", "BFA", "B.Arch"], MASTERS: ["M.Des", "M.Arch"] },
  },
  {
    field: "Education",
    ladder: ["Lecturer", "Assistant Professor", "Associate Professor", "Professor"],
    employers: ["Symbiosis", "Christ University", "Delhi Public School", "Amity University"],
    baseLpa: 6, seniorityStep: 1.35, eliteAffinity: 1,
    degrees: { MASTERS: ["MA", "M.Sc", "M.Ed"], DOCTORATE: ["Ph.D"] },
  },
  {
    field: "Civil Services",
    ladder: ["Probationary Officer", "Deputy Collector", "Joint Secretary"],
    employers: ["Government of India", "State Administrative Service"],
    baseLpa: 9, seniorityStep: 1.4, eliteAffinity: 2,
    degrees: { BACHELORS: ["B.A.", "B.Tech", "B.Sc"], MASTERS: ["MA", "MBA"] },
  },
  {
    field: "Business",
    ladder: ["Business Owner", "Director", "Managing Partner"],
    employers: ["Family Business", "Self-employed"],
    baseLpa: 12, seniorityStep: 1.65, eliteAffinity: 1,
    degrees: { DIPLOMA: ["Diploma in Business Management"], BACHELORS: ["B.Com", "BBA"], MASTERS: ["MBA"] },
  },
];

export const PARENT_OCCUPATIONS = {
  father: ["Businessman", "Retired Government Officer", "Bank Manager", "Doctor",
    "Professor", "Civil Engineer", "Chartered Accountant", "Farmer", "Retired Army Officer"],
  mother: ["Homemaker", "Schoolteacher", "Doctor", "Bank Officer", "Professor",
    "Retired Government Employee", "Boutique Owner"],
};

/** Elite colleges feed these fields disproportionately. */
export function professionWeight(p: Profession, tier: CollegeTier): number {
  if (tier === "ELITE") return p.eliteAffinity;
  if (tier === "REGIONAL" && p.eliteAffinity >= 3) return 1;
  return 2;
}
