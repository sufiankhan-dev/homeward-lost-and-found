/**
 * Search terms used to find freely licensed demo photos on Openverse
 * (https://openverse.org). Only CC0 / Public Domain Mark photos are used.
 * `pick` is the search result index chosen after visual review.
 *
 * Cards (student ID, bank card) deliberately have no photo: finders are told
 * not to photograph cards because they show personal details.
 *
 * Re-pick with:
 *   npx tsx scripts/fetch-seed-images.ts --review --only=<slug> --candidates=6
 */
export const SEED_IMAGE_SOURCES: Record<string, { query: string; pick: number }> = {
  "brown-leather-wallet": { query: "money wallet", pick: 0 },
  "black-iphone": { query: "black iphone", pick: 1 },
  "keys-red-lanyard": { query: "key ring", pick: 0 },
  "grey-laptop": { query: "laptop", pick: 2 },
  "blue-water-bottle": { query: "water bottle", pick: 3 },
  "green-backpack": { query: "green backpack", pick: 7 },
  "silver-wristwatch": { query: "silver wristwatch", pick: 3 },
  "black-glasses": { query: "black eyeglasses", pick: 1 },
  "chemistry-textbook": { query: "textbook", pick: 0 },
  "grey-hoodie": { query: "hoodie", pick: 3 },
  "airpods-case": { query: "airpods", pick: 1 },
  "samsung-phone": { query: "android smartphone", pick: 0 },
  "car-key": { query: "car key", pick: 0 },
  "gold-earring": { query: "gold earrings", pick: 0 },
  "red-umbrella": { query: "red umbrella", pick: 1 },
  "pencil-case": { query: "pencil case", pick: 1 },
  "black-puffer-jacket": { query: "parka", pick: 11 },
  "tan-handbag": { query: "handbag", pick: 1 },
  "lunchbox": { query: "bento box", pick: 0 },
  "laptop-charger": { query: "black iphone", pick: 0 },
};
