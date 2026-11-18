/**
 * DEMO DATA ONLY — fictional people and items used for local development,
 * demonstrations and automated tests. Never load into a production database.
 */
import type { ContactPreference, ItemStatus, ReportType } from "../src/lib/constants";

export const DEMO_PASSWORD = "homeward-demo-1";

export const CATEGORIES = [
  { name: "Phones & Tablets", slug: "phones", icon: "smartphone" },
  { name: "Laptops & Electronics", slug: "electronics", icon: "laptop" },
  { name: "Wallets & Purses", slug: "wallets", icon: "wallet" },
  { name: "Keys", slug: "keys", icon: "key-round" },
  { name: "ID & Bank Cards", slug: "cards", icon: "id-card" },
  { name: "Bags & Backpacks", slug: "bags", icon: "backpack" },
  { name: "Clothing", slug: "clothing", icon: "shirt" },
  { name: "Jewellery & Watches", slug: "jewellery", icon: "watch" },
  { name: "Books & Stationery", slug: "books", icon: "book-open" },
  { name: "Bottles & Lunchboxes", slug: "bottles", icon: "cup-soda" },
  { name: "Glasses", slug: "glasses", icon: "glasses" },
  { name: "Other", slug: "other", icon: "package" },
] as const;

export const DEMO_USERS = [
  {
    id: "demo-user-alex",
    name: "Alex Morgan",
    email: "alex@demo.homeward.test",
    password: DEMO_PASSWORD,
    role: "user",
  },
  {
    id: "demo-user-sam",
    name: "Sam Rivera",
    email: "sam@demo.homeward.test",
    password: DEMO_PASSWORD,
    role: "user",
  },
  {
    id: "demo-user-admin",
    name: "Jordan Lee (Moderator)",
    email: "moderator@demo.homeward.test",
    password: DEMO_PASSWORD,
    role: "admin",
  },
] as const;

type DemoItem = {
  userId: (typeof DEMO_USERS)[number]["id"];
  reportType: ReportType;
  title: string;
  description: string;
  category: (typeof CATEGORIES)[number]["slug"];
  location: string;
  daysAgo: number;
  eventOffset?: number;
  features?: string;
  verification?: string;
  contact?: ContactPreference;
  status?: ItemStatus;
};

export const DEMO_ITEMS: DemoItem[] = [
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Brown leather wallet",
    description:
      "Found on a table by the café inside the library entrance. It has a few cards inside. I've kept it safe and will return it to the owner after a quick check.",
    category: "wallets",
    location: "Main Library",
    daysAgo: 2,
    features: "Brown leather, bi-fold, slightly worn edges.",
    verification: "Contains a blue library card and a photo of a dog.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Black iPhone 14 in clear case",
    description:
      "Lost my phone either on the bus from North Gate or walking to the Science Building. The lock screen is a mountain photo.",
    category: "phones",
    location: "Bus Stop – North Gate",
    daysAgo: 1,
    features: "Clear case with a small crack on the back corner.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Set of keys with red lanyard",
    description:
      "Three keys on a ring with a red university lanyard. Found on the grass outside the Sports Centre after the evening football session.",
    category: "keys",
    location: "Sports Centre",
    daysAgo: 3,
    verification: "One key has a small number engraved on it.",
    contact: "DESK",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Grey Dell laptop in black sleeve",
    description:
      "Left my laptop in Lecture Hall B after the 2pm statistics lecture. Very important — it has my dissertation drafts on it.",
    category: "electronics",
    location: "Lecture Hall B",
    daysAgo: 4,
    features: "Black neoprene sleeve with a zip pocket, laptop has a planet sticker.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Blue Hydro Flask water bottle",
    description:
      "Found a blue insulated water bottle left on a bench in the Student Union food court.",
    category: "bottles",
    location: "Student Union",
    daysAgo: 1,
    features: "Navy blue, 750ml, a few dents near the bottom.",
    verification: "There are stickers on it — ask the owner to describe them.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Green North Face backpack",
    description:
      "Dark green backpack with a laptop compartment. I think I left it in the Main Cafeteria around lunchtime.",
    category: "bags",
    location: "Main Cafeteria",
    daysAgo: 6,
    features: "Dark green, small keychain shaped like a cactus.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Student ID card",
    description:
      "Found a student ID card on the floor of Computer Lab 3. Handed to the Student Services desk for safekeeping.",
    category: "cards",
    location: "Computer Lab",
    daysAgo: 2,
    verification: "Name and student number visible on the card — claimant should state them.",
    contact: "DESK",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Silver wristwatch",
    description:
      "Lost a silver analogue watch, probably in the changing rooms at the Sports Centre. It has sentimental value — a gift from my grandfather.",
    category: "jewellery",
    location: "Sports Centre",
    daysAgo: 8,
    features: "Silver metal strap, white face with Roman numerals.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Black prescription glasses",
    description:
      "Found a pair of black-framed glasses in a soft case on the second floor of the Arts Building.",
    category: "glasses",
    location: "Arts Building",
    daysAgo: 5,
    features: "Rectangular black frames in a grey soft case.",
    verification: "The case has a brand name printed inside.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Organic Chemistry textbook",
    description:
      "Lost my Organic Chemistry textbook (7th edition) with lots of handwritten notes in the margins. Probably in the Science Building.",
    category: "books",
    location: "Science Building",
    daysAgo: 10,
    features: "Name written on the inside cover, yellow highlighter throughout.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Grey hoodie",
    description:
      "Grey university hoodie left on a chair in Lecture Hall A after the morning lecture.",
    category: "clothing",
    location: "Lecture Hall A",
    daysAgo: 4,
    features: "Size M, university logo on the front.",
    verification: "Something is written on the inside label.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "AirPods Pro charging case",
    description:
      "White AirPods Pro case (with earbuds) lost somewhere between the Halls of Residence and the Engineering Block.",
    category: "electronics",
    location: "Engineering Block",
    daysAgo: 3,
    features: "Small scratch on the lid.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Samsung Galaxy phone",
    description:
      "Found a Samsung phone on the floor of the East car park, near the pay machine. Battery is dead.",
    category: "phones",
    location: "Car Park – East",
    daysAgo: 6,
    verification: "Describe the case and the lock screen wallpaper.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Car key with Toyota fob",
    description:
      "Lost my car key with a Toyota fob and a small torch attached. Last used it in the East car park.",
    category: "keys",
    location: "Car Park – East",
    daysAgo: 12,
    status: "RESOLVED",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Gold hoop earring",
    description:
      "Found a single small gold hoop earring in the women's bathroom at the Medical Centre.",
    category: "jewellery",
    location: "Medical Centre",
    daysAgo: 9,
    verification: "Ask the owner to describe the clasp.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Red umbrella",
    description:
      "Left a red folding umbrella at the Bus Stop by North Gate during the rain on Monday morning.",
    category: "other",
    location: "Bus Stop – North Gate",
    daysAgo: 14,
    status: "CLOSED",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Pencil case with calculator",
    description:
      "Purple pencil case containing pens, a ruler and a scientific calculator. Found in the Main Library quiet zone.",
    category: "books",
    location: "Main Library",
    daysAgo: 7,
    features: "Purple fabric pencil case.",
    verification: "The calculator has initials scratched on the back.",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Black puffer jacket",
    description:
      "Lost a black puffer jacket in the Student Union after the society fair. Has my bus pass in the inside pocket.",
    category: "clothing",
    location: "Student Union",
    daysAgo: 5,
    features: "Black, hip length, hood with faux-fur trim.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Bank card",
    description:
      "Found a debit card near the cash machine in the Student Union. Handed to the Student Services desk.",
    category: "cards",
    location: "Student Union",
    daysAgo: 1,
    verification: "Claimant should confirm the bank and the name on the card.",
    contact: "DESK",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "Tan leather handbag",
    description:
      "Tan leather shoulder bag lost at the Halls of Residence common room. Contains a notebook and make-up bag.",
    category: "bags",
    location: "Halls of Residence",
    daysAgo: 2,
    features: "Tan leather with gold buckle.",
  },
  {
    userId: "demo-user-sam",
    reportType: "FOUND",
    title: "Lunchbox with blue lid",
    description:
      "A clear lunchbox with a blue lid left in the Engineering Block kitchen fridge for over a week.",
    category: "bottles",
    location: "Engineering Block",
    daysAgo: 11,
    status: "RESOLVED",
  },
  {
    userId: "demo-user-alex",
    reportType: "LOST",
    title: "USB-C charger and cable",
    description:
      "White 65W USB-C laptop charger with braided cable, left plugged in at a desk in the Computer Lab.",
    category: "electronics",
    location: "Computer Lab",
    daysAgo: 0,
  },
];
