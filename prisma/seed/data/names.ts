import type { Region } from "./communities";

/** Surnames are region-specific; first names mostly are not. */
export const SURNAMES_BY_REGION: Record<Region, string[]> = {
  MAHARASHTRA: ["Deshpande", "Kulkarni", "Joshi", "Patil", "Jadhav", "Gokhale", "Phadke", "Sawant", "Bhosale", "Rane"],
  DELHI_NCR: ["Sharma", "Verma", "Gupta", "Agarwal", "Malhotra", "Chopra", "Khanna", "Bansal", "Saxena", "Tandon"],
  KARNATAKA: ["Rao", "Hegde", "Shetty", "Gowda", "Bhat", "Kamath", "Pai", "Nayak", "Acharya", "Murthy"],
  TAMIL_NADU: ["Iyer", "Iyengar", "Subramanian", "Krishnan", "Raman", "Natarajan", "Sundaram", "Venkatesh", "Balaji", "Rajan"],
  GUJARAT: ["Patel", "Shah", "Mehta", "Desai", "Trivedi", "Joshi", "Parikh", "Vyas", "Dave", "Thakkar"],
  WEST_BENGAL: ["Banerjee", "Chatterjee", "Mukherjee", "Ghosh", "Bose", "Das", "Sen", "Dutta", "Roy", "Chakraborty"],
  PUNJAB: ["Singh", "Kaur", "Gill", "Sidhu", "Dhillon", "Bedi", "Grewal", "Sandhu", "Ahluwalia", "Bajwa"],
  TELANGANA: ["Reddy", "Rao", "Naidu", "Chowdary", "Prasad", "Varma", "Goud", "Yadav", "Sharma", "Kumar"],
};

export const MALE_FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Arjun", "Rohan", "Karthik", "Siddharth", "Rahul",
  "Nikhil", "Ananth", "Varun", "Kabir", "Ishaan", "Dhruv", "Aniket", "Pranav",
  "Harsh", "Yash", "Tanmay", "Shaurya", "Akash", "Manav", "Rishi", "Devansh",
  "Sarthak", "Kunal", "Abhinav", "Gaurav", "Parth", "Omkar", "Vikram", "Raghav",
];

export const FEMALE_FIRST_NAMES = [
  "Ananya", "Diya", "Aadhya", "Saanvi", "Ishita", "Meera", "Priya", "Riya",
  "Nandini", "Kavya", "Sneha", "Tanvi", "Pooja", "Shreya", "Aditi", "Radhika",
  "Neha", "Divya", "Anjali", "Swara", "Mitali", "Rhea", "Trisha", "Vaishnavi",
  "Gauri", "Sanya", "Preeti", "Juhi", "Nikita", "Aarohi", "Lavanya", "Charu",
];

/** Muslim and Christian names sit outside the region-surname model. */
export const NAMES_BY_RELIGION: Record<string, { male: string[]; female: string[]; surnames: string[] }> = {
  Muslim: {
    male: ["Aarif", "Imran", "Faizan", "Zaid", "Rehan", "Owais", "Danish", "Tariq"],
    female: ["Ayesha", "Zoya", "Fatima", "Sana", "Hiba", "Nazia", "Amara", "Rukhsar"],
    surnames: ["Khan", "Sheikh", "Ansari", "Qureshi", "Siddiqui", "Pathan", "Mirza", "Rizvi"],
  },
  Christian: {
    male: ["Aaron", "Joel", "Ryan", "Nathan", "Ivan", "Jerome", "Clive", "Sean"],
    female: ["Maria", "Sheryl", "Nicole", "Rachel", "Elaine", "Tania", "Joanna", "Lydia"],
    surnames: ["Dsouza", "Fernandes", "Pereira", "Thomas", "Mathew", "George", "Pinto", "Rodrigues"],
  },
};
