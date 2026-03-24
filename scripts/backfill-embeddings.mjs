/**
 * backfill-embeddings.mjs
 * Fetches all user-created concepts from Supabase that have no embedding,
 * generates a 384-dim MiniLM embedding for each, and saves it back.
 *
 * Usage: node scripts/backfill-embeddings.mjs
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars (or hardcoded below)
 */

import { pipeline } from "@huggingface/transformers";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || "https://kigmmthlghcpbgoorray.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_KEY) {
  console.error("SUPABASE_SERVICE_KEY env var required");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

console.log("Loading MiniLM embedding model...");
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", { dtype: "fp32" });
console.log("Model loaded.\n");

// Fetch all user-created concepts without embeddings
const { data: concepts, error } = await supabase
  .from("concepts")
  .select("id, name, short_summary, long_summary, embedding")
  .eq("is_user_created", true);

if (error) {
  console.error("Failed to fetch concepts:", error.message);
  process.exit(1);
}

const toBackfill = concepts.filter(c => !c.embedding);
console.log(`Found ${concepts.length} user concepts, ${toBackfill.length} missing embeddings.\n`);

if (toBackfill.length === 0) {
  console.log("Nothing to do!");
  process.exit(0);
}

for (const concept of toBackfill) {
  process.stdout.write(`  Embedding "${concept.name}"... `);
  try {
    const text = `${concept.name}. ${concept.short_summary || ""} ${concept.long_summary || ""}`.trim();
    const output = await extractor(text, { pooling: "mean", normalize: true });
    const embedding = Array.from(output.data);

    const { error: updateErr } = await supabase
      .from("concepts")
      .update({ embedding })
      .eq("id", concept.id);

    if (updateErr) {
      console.log(`FAILED: ${updateErr.message}`);
    } else {
      console.log(`done (${embedding.length} dims)`);
    }
  } catch (e) {
    console.log(`ERROR: ${e.message}`);
  }
}

console.log("\nBackfill complete!");
