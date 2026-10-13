export type CollegeTier = "ELITE" | "STRONG" | "REGIONAL";

export const COLLEGES: Record<CollegeTier, string[]> = {
  ELITE: [
    "IIT Bombay", "IIT Delhi", "IIT Madras", "IIT Kanpur", "IIT Kharagpur",
    "BITS Pilani", "IIM Ahmedabad", "IIM Bangalore", "AIIMS Delhi",
    "NLSIU Bangalore", "SRCC Delhi",
  ],
  STRONG: [
    "NIT Trichy", "NIT Surathkal", "NIT Warangal", "VJTI Mumbai",
    "COEP Pune", "Delhi Technological University", "Jadavpur University",
    "Anna University", "Manipal Institute of Technology", "St. Xavier's Mumbai",
    "Christ University", "Symbiosis Pune",
  ],
  REGIONAL: [
    "Savitribai Phule Pune University", "University of Mumbai",
    "Osmania University", "Bangalore University", "Gujarat University",
    "Panjab University", "University of Calcutta", "Madras University",
    "Amity University", "Shivaji University",
  ],
};

