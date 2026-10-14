// Generated from assets/raw/. Edit by hand if you swap the artwork.

import courtyardStroll from "../../public/images/brand/courtyard-stroll.webp";
import marigoldGarland from "../../public/images/brand/marigold-garland.webp";
import mehndiHands from "../../public/images/brand/mehndi-hands.webp";
import mithaiExchange from "../../public/images/brand/mithai-exchange.webp";
import weddingInvitation from "../../public/images/brand/wedding-invitation.webp";

import type { StaticImageData } from "next/image";

export type BrandImage = { src: StaticImageData; alt: string };

/** Alt text per image. Unlisted files fall back to a generic caption. */
const ALT: Record<string, string> = {
  mehndiHands: "A couple's hands resting together, the bride's palms patterned with mehndi",
  marigoldGarland: "A marigold and jasmine garland on a carved wooden table in afternoon light",
  weddingInvitation: "An emerald and gold wedding invitation card on handmade paper",
  courtyardStroll: "A couple walking through a sunlit courtyard in the late afternoon",
  mithaiExchange: "Hands exchanging a tray of mithai in a warm family home",
};

export const BRAND_IMAGES: BrandImage[] = [
  { src: courtyardStroll, alt: ALT.courtyardStroll ?? "Decorative wedding photograph" },
  { src: marigoldGarland, alt: ALT.marigoldGarland ?? "Decorative wedding photograph" },
  { src: mehndiHands, alt: ALT.mehndiHands ?? "Decorative wedding photograph" },
  { src: mithaiExchange, alt: ALT.mithaiExchange ?? "Decorative wedding photograph" },
  { src: weddingInvitation, alt: ALT.weddingInvitation ?? "Decorative wedding photograph" },
];
