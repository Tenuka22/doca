import { doctorHubMaterials } from "@doca/db";
import { idSchema } from "@doca/db/schemas-types";
import { env } from "@doca/env/server";
import { eq } from "drizzle-orm";
import { publicProcedure } from "../../../index";

export const getHubMaterialFileRoute = publicProcedure
  .input(idSchema)
  .handler(async ({ context, input }) => {
    const [material] = await context.db
      .select()
      .from(doctorHubMaterials)
      .where(eq(doctorHubMaterials.id, input.id))
      .limit(1);

    if (!material?.fileKey) {
      throw new Error("Material file not found");
    }

    if (material.visibility === "private") {
      throw new Error("This material is private");
    }

    const fileData = await env.DOCTOR_MATERIALS_KV.get(
      material.fileKey,
      "arrayBuffer"
    );

    if (!fileData) {
      throw new Error("File data not found in storage");
    }

    return new File([fileData], material.fileName ?? "file", {
      type: material.mimeType ?? "application/octet-stream",
    });
  });
