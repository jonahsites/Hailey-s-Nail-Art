export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: string;
  category: "manicure" | "art" | "treatment";
}

export const SERVICES: Service[] = [
  {
    id: "1",
    name: "Signature Minimalist",
    description: "Our hallmark clean-line aesthetic. Focuses on monochrome precision and healthy nail prep.",
    price: "$65",
    duration: "60 min",
    category: "manicure"
  },
  {
    id: "2",
    name: "Gel-X Extensions",
    description: "Flawless length using premium Apres Gel-X systems for a lightweight, natural feel.",
    price: "$95",
    duration: "90 min",
    category: "manicure"
  },
  {
    id: "3",
    name: "Couture Nail Art",
    description: "Detailed hand-painted designs tailored to your style. From geometric to abstract.",
    price: "$120+",
    duration: "120 min",
    category: "art"
  },
  {
    id: "4",
    name: "Obsidian Stone Therapy",
    description: "A restorative hand treatment featuring heated obsidian stones and organic oils.",
    price: "$45",
    duration: "30 min",
    category: "treatment"
  },
  {
    id: "5",
    name: "French Noir",
    description: "A modern twist on the classic French tips using high-gloss black and matte accents.",
    price: "$80",
    duration: "75 min",
    category: "art"
  }
];
