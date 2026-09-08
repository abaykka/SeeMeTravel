/**
 * The persistence seam. Phase 1 ships the local file implementation so the MVP
 * runs with no accounts and no Docker; Phase 2 adds a Supabase implementation
 * of this same interface without touching any UI code.
 * See DESIGN_PLAN.md sections 7.1 and 10.1.
 */

export type Globe = {
  id: string;
  /** ADM0_A3 country ids. Always sanitised before it reaches storage. */
  countries: string[];
  title: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewGlobe = {
  countries: string[];
  title?: string | null;
};

export interface GlobeStore {
  get(id: string): Promise<Globe | null>;
  create(input: NewGlobe): Promise<Globe>;
  /** Phase 2: only the owner may update. Phase 1 has no auth, so this is unused. */
  update(id: string, input: NewGlobe): Promise<Globe | null>;
}
