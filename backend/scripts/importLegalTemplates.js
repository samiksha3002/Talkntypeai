
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import DraftTemplate from "../../models/DraftTemplate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from Talkntypeai root
dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// JSON file: Talkntypeai/data/legal-draft-templates.json
const jsonPath = path.resolve(
  __dirname,
  "../../data/legal-draft-templates.json"
);

function createSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function importTemplates() {
  let connected = false;

  try {
    const uri =
      process.env.MONGODB_URI ||
      process.env.MONGO_URI;

    if (!uri) {
      throw new Error(
        "MongoDB URI not found. Check MONGODB_URI or MONGO_URI in the root .env file."
      );
    }

    if (!fs.existsSync(jsonPath)) {
      throw new Error(
        `Template JSON file not found: ${jsonPath}`
      );
    }

    let templates;

    try {
      templates = JSON.parse(
        fs.readFileSync(jsonPath, "utf8")
      );
    } catch (error) {
      throw new Error(`Invalid JSON file: ${error.message}`);
    }

    if (!Array.isArray(templates) || templates.length === 0) {
      throw new Error(
        "The JSON file must contain a non-empty array of templates."
      );
    }

    // Validate all templates before connecting to MongoDB.
    const normalizedTemplates = templates.map(
      (template, index) => {
        if (
          !template ||
          typeof template.title !== "string" ||
          !template.title.trim() ||
          typeof template.category !== "string" ||
          !template.category.trim()
        ) {
          throw new Error(
            `Template at index ${index} must have a title and category.`
          );
        }

        const body =
          typeof template.templateBody === "string"
            ? template.templateBody
            : template.content;

        if (typeof body !== "string" || !body.trim()) {
          throw new Error(
            `Template "${template.title}" needs non-empty content or templateBody.`
          );
        }

        const title = template.title.trim();
        const category = template.category.trim();

        return {
          ...template,
          title,
          category,
          // Use the title-derived slug consistently.
          // The import loop will reuse an existing record's slug
          // where possible to avoid collisions with existing records.
          slug: createSlug(title),
          templateBody: body,
          placeholders: Array.isArray(template.placeholders)
            ? template.placeholders
            : [],
          language: template.language || "English",
          status: template.status || "published",
        };
      }
    );

    // Catch duplicate title/category pairs in the JSON itself.
    const seenTitles = new Set();

    for (const template of normalizedTemplates) {
      const key =
        `${template.title.toLowerCase()}::${template.category.toLowerCase()}`;

      if (seenTitles.has(key)) {
        throw new Error(
          `Duplicate title and category in JSON: ${template.title} (${template.category}).`
        );
      }

      seenTitles.add(key);
    }

    await mongoose.connect(uri);
    connected = true;

    console.log("MongoDB connected successfully.");
    console.log(
      `Templates found in JSON: ${normalizedTemplates.length}`
    );

    let inserted = 0;
    let updated = 0;

    for (const template of normalizedTemplates) {
      const { title, category } = template;
      const filter = { title, category };

      // Find an existing record by title/category first.
      const existing = await DraftTemplate.findOne(filter)
        .select("_id slug")
        .lean();

      // If this title/category already exists, retain its current slug.
      // Otherwise, check whether the desired slug belongs to another record.
      let finalSlug = existing?.slug || template.slug;

      if (!existing) {
        const slugOwner = await DraftTemplate.findOne({
          slug: finalSlug,
        })
          .select("_id title category")
          .lean();

        if (slugOwner) {
          // Avoid overwriting another template or violating the unique index.
          finalSlug = `${template.slug}-${createSlug(category)}`;

          let suffix = 2;

          while (
            await DraftTemplate.exists({ slug: finalSlug })
          ) {
            finalSlug =
              `${template.slug}-${createSlug(category)}-${suffix}`;
            suffix++;
          }

          console.log(
            `Slug conflict for "${title}". Using "${finalSlug}".`
          );
        }
      }

      const dataToSave = {
        ...template,
        slug: finalSlug,
      };

      await DraftTemplate.updateOne(
        filter,
        { $set: dataToSave },
        {
          upsert: true,
          runValidators: true,
        }
      );

      if (existing) {
        updated++;
        console.log(`Updated: ${title} (${category})`);
      } else {
        inserted++;
        console.log(`Imported: ${title} (${category})`);
      }
    }

    console.log("\n================================");
    console.log("Template import completed successfully.");
    console.log(`New templates: ${inserted}`);
    console.log(`Updated templates: ${updated}`);
    console.log("================================");
  } catch (error) {
    console.error("\nTemplate import failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (connected) {
      try {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
      } catch (error) {
        console.error(
          "Error disconnecting MongoDB:",
          error.message
        );
      }
    }
  }
}

importTemplates();
