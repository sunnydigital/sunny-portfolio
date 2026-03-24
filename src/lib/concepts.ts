"use client";

import { Concept } from "@/types";
import { mockConcepts } from "@/data/mock";
import { supabase } from "@/lib/supabase";

// ---- Synchronous fallback (uses mock data only, for initial render) ----

export function getAllConcepts(): Concept[] {
  return [...mockConcepts];
}

// ---- Async version: fetches from Supabase, merges with mock ----

let _cache: Concept[] | null = null;
let _cacheTime = 0;
const CACHE_TTL = 30_000; // 30s

export async function getAllConceptsAsync(): Promise<Concept[]> {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;

  try {
    const { data: dbConcepts, error } = await supabase
      .from("concepts")
      .select("*");

    if (error || !dbConcepts) {
      return mockConcepts;
    }

    const dbMap = new Map<string, Record<string, unknown>>();
    for (const row of dbConcepts) {
      dbMap.set(row.id, row);
    }

    // Start with mock concepts, apply DB overrides
    const result: Concept[] = [];
    for (const mock of mockConcepts) {
      const override = dbMap.get(mock.id);
      if (override) {
        if (override.is_hidden) continue; // hidden
        const merged: Concept = { ...mock };
        if (override.name) merged.name = override.name as string;
        if (override.short_summary) merged.short_summary = override.short_summary as string;
        if (override.long_summary) merged.long_summary = override.long_summary as string;
        if (override.date_learned) merged.date_learned = override.date_learned as string;
        if (override.images) merged.images = override.images as string[];
        if (override.x !== undefined) merged.x = override.x as number;
        if (override.y !== undefined) merged.y = override.y as number;
        if (override.z !== undefined) merged.z = override.z as number;
        result.push(merged);
        dbMap.delete(mock.id);
      } else {
        result.push(mock);
      }
    }

    // Add user-created concepts from DB
    for (const [, row] of dbMap) {
      if (row.is_hidden) continue;
      if (row.is_user_created) {
        result.push({
          id: row.id as string,
          name: row.name as string,
          short_summary: row.short_summary as string,
          long_summary: row.long_summary as string,
          date_learned: row.date_learned as string,
          x: (row.x as number) || 0,
          y: (row.y as number) || 0,
          z: (row.z as number) || 0,
          images: (row.images as string[]) || [],
          ...(row.embedding ? { embedding: row.embedding as number[] } : {}),
        });
      }
    }

    _cache = result;
    _cacheTime = Date.now();
    return result;
  } catch {
    return mockConcepts;
  }
}

export function invalidateConceptsCache() {
  _cache = null;
  _cacheTime = 0;
}

// ---- Write operations via API routes ----

// Only these fields exist in the Supabase concepts table
const CONCEPT_DB_FIELDS = ["id", "name", "short_summary", "long_summary", "date_learned", "x", "y", "z", "images", "embedding", "is_user_created", "is_hidden"];

export async function saveConceptToDb(concept: Partial<Concept> & { id: string; is_user_created?: boolean; is_hidden?: boolean }) {
  // Whitelist only DB-valid fields
  const dbFields: Record<string, unknown> = {};
  for (const key of CONCEPT_DB_FIELDS) {
    if (key in concept) dbFields[key] = (concept as Record<string, unknown>)[key];
  }
  dbFields.updated_at = new Date().toISOString();
  const res = await fetch("/api/db/concepts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(dbFields),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Failed to save concept: ${res.status} ${JSON.stringify(err)}`);
  }
  invalidateConceptsCache();
  return res.json();
}

export async function hideConceptInDb(id: string) {
  // For mock concepts, mark as hidden; for user-created, delete
  const res = await fetch("/api/db/concepts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, is_hidden: true, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error("Failed to hide concept");
  invalidateConceptsCache();
}

// Legacy localStorage-based hideConcept for backward compat during transition
export function hideConcept(id: string): void {
  // Fire-and-forget the DB call
  hideConceptInDb(id).catch(() => {});
}
