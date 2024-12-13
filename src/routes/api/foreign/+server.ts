import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import prisma from "$lib/prisma";

export const GET: RequestHandler = async ({ url }) => {
  try {
    // Get the current date + d-10 days
    const seoulDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

    const searchStartDay = new Date(seoulDate);
    searchStartDay.setDate(searchStartDay.getDate() - 40);
    const searchStartDayStr = searchStartDay.toISOString().split('T')[0].replace(/-/g, '');
    
    // Get the param
    const isChinese = url.searchParams.get('isChinese') === 'true';
    const isLong = url.searchParams.get('isLong') === 'true';
    const secCode = url.searchParams.get('secCode');
    
    if (isChinese) {
      if (!secCode) {
        // Get all foreign data for all sec_code
        if (isLong) {
          const foreign = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, chinese as data
            FROM longterm_foreign
            WHERE date_str = '${searchStartDayStr}'
          `);
          return json(foreign);
        } else {
          const foreign = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, chinese as data
            FROM shortterm_foreign
            WHERE date_str = '${searchStartDayStr}'
          `);
          return json(foreign);
        }
      } else {
        // Get the specific region's foreign data
        if (isLong) {
          const foreignSpecific = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, chinese as data
            FROM longterm_foreign
            WHERE date_str = '${searchStartDayStr}' AND sec_code = '${secCode}'
        `);
          return json(foreignSpecific);
        } else {
          const foreignSpecific = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, chinese as data
            FROM shortterm_foreign
            WHERE date_str = '${searchStartDayStr}' AND sec_code = '${secCode}'
          `);
          return json(foreignSpecific);
        }
      }
    } else {
      if (!secCode) {
        // Get all foreign data for all sec_code
        if (isLong) {
          const foreign = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, non_chinese as data
          FROM longterm_foreign
          WHERE date_str = '${searchStartDayStr}'
        `);
          return json(foreign);
        } else {
          const foreignSpecific = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, non_chinese as data
            FROM shortterm_foreign
            WHERE date_str = '${searchStartDayStr}' AND sec_code = '${secCode}'
        `);
          return json(foreignSpecific);
        }
      } else {
        if (isLong) {
          const foreignSpecific = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, non_chinese as data
            FROM longterm_foreign
            WHERE date_str = '${searchStartDayStr}' AND sec_code = '${secCode}'
          `);
          return json(foreignSpecific);
        } else {
          const foreignSpecific = await prisma.$queryRawUnsafe(`
            SELECT date_str, hour, sec_code, non_chinese as data
            FROM shortterm_foreign
            WHERE date_str = '${searchStartDayStr}' AND sec_code = '${secCode}'
          `);
          return json(foreignSpecific);
        }
      }
    }
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to fetch foreign data" }, { status: 500 });
  }
}