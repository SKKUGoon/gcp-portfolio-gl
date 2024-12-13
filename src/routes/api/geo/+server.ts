import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import prisma from "$lib/prisma";

export const GET: RequestHandler = async () => {
  try {
    const polygons: {
      tot_reg_cd: string;
      adm_nm: string;
      geometry: string;
    }[] = await prisma.$queryRawUnsafe(`
      SELECT tot_reg_cd, adm_nm, public.ST_AsGeoJSON(geometry) AS geometry
      FROM sec
    `);

    const formattedPolygons = polygons.map((polygon: {
      tot_reg_cd: string;
      adm_nm: string; 
      geometry: string;
    }) => ({
      tot_reg_cd: polygon.tot_reg_cd,
      adm_nm: polygon.adm_nm,
      geometry: polygon.geometry,
    }));

    return json(formattedPolygons);
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch polygons" }, { status: 500 });
  }
};
