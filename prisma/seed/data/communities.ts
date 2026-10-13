/**
 * Region is the spine of a realistic profile: it determines mother tongue,
 * surname pool, and the caste vocabulary that goes with a religion. Picking
 * these independently is what makes generated biodata read as fake.
 */
export type Region =
  | "MAHARASHTRA" | "DELHI_NCR" | "KARNATAKA" | "TAMIL_NADU"
  | "GUJARAT" | "WEST_BENGAL" | "PUNJAB" | "TELANGANA";

export const MOTHER_TONGUE_BY_REGION: Record<Region, string> = {
  MAHARASHTRA: "Marathi",
  DELHI_NCR: "Hindi",
  KARNATAKA: "Kannada",
  TAMIL_NADU: "Tamil",
  GUJARAT: "Gujarati",
  WEST_BENGAL: "Bengali",
  PUNJAB: "Punjabi",
  TELANGANA: "Telugu",
};

/**
 * Religion follows region. Picking it independently produces Sikhs in Kolkata
 * with Bengali as a mother tongue — individually possible, absurd at scale.
 */
export const RELIGION_WEIGHTS_BY_REGION: Record<Region, Record<string, number>> = {
  MAHARASHTRA: { Hindu: 74, Muslim: 10, Jain: 6, Buddhist: 6, Christian: 3, Sikh: 1 },
  DELHI_NCR:   { Hindu: 72, Muslim: 10, Sikh: 11, Jain: 4, Christian: 2, Buddhist: 1 },
  KARNATAKA:   { Hindu: 80, Muslim: 11, Christian: 5, Jain: 3, Sikh: 1, Buddhist: 0 },
  TAMIL_NADU:  { Hindu: 82, Christian: 10, Muslim: 6, Jain: 1, Sikh: 1, Buddhist: 0 },
  GUJARAT:     { Hindu: 80, Jain: 9, Muslim: 9, Christian: 1, Sikh: 1, Buddhist: 0 },
  WEST_BENGAL: { Hindu: 70, Muslim: 25, Christian: 3, Buddhist: 1, Sikh: 1, Jain: 0 },
  PUNJAB:      { Sikh: 56, Hindu: 37, Muslim: 2, Christian: 4, Jain: 1, Buddhist: 0 },
  TELANGANA:   { Hindu: 82, Muslim: 12, Christian: 4, Jain: 1, Sikh: 1, Buddhist: 0 },
};

/** Caste vocabulary varies by region as well as religion. */
export const CASTES_BY_RELIGION: Record<string, Partial<Record<Region, string[]>> & { DEFAULT: string[] }> = {
  Hindu: {
    DEFAULT: ["Brahmin", "Kshatriya", "Vaishya", "Kayastha", "Agarwal"],
    MAHARASHTRA: ["Maratha", "Deshastha Brahmin", "Chitpavan Brahmin", "Kunbi", "CKP"],
    TAMIL_NADU: ["Iyer", "Iyengar", "Mudaliar", "Chettiar", "Nadar"],
    KARNATAKA: ["Lingayat", "Vokkaliga", "Madhwa Brahmin", "Havyaka"],
    WEST_BENGAL: ["Brahmin", "Kayastha", "Baidya"],
    GUJARAT: ["Patel", "Brahmin", "Lohana", "Bania"],
    PUNJAB: ["Khatri", "Arora", "Brahmin", "Jat"],
    TELANGANA: ["Reddy", "Kamma", "Velama", "Brahmin"],
    DELHI_NCR: ["Brahmin", "Agarwal", "Jat", "Rajput", "Kayastha"],
  },
  Muslim: { DEFAULT: ["Sunni", "Shia", "Syed", "Pathan", "Ansari"] },
  Christian: { DEFAULT: ["Roman Catholic", "Protestant", "Syrian Catholic", "Marthoma"] },
  Sikh: { DEFAULT: ["Jat Sikh", "Khatri Sikh", "Ramgarhia", "Arora Sikh"] },
  Jain: { DEFAULT: ["Digambar", "Shwetambar", "Oswal", "Porwal"] },
  Buddhist: { DEFAULT: ["Navayana", "Theravada"] },
};

export const GOTRAS = [
  "Bharadwaj", "Kashyap", "Vashistha", "Gautam", "Atri",
  "Vishwamitra", "Jamadagni", "Sandilya", "Kaushik",
];

export const LANGUAGE_POOL = [
  "Hindi", "English", "Marathi", "Tamil", "Telugu",
  "Kannada", "Bengali", "Gujarati", "Punjabi", "Malayalam", "Urdu",
];
