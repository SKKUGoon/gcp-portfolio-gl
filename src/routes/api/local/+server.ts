import type { RequestHandler } from "@sveltejs/kit";
import { json } from "@sveltejs/kit";
import prisma from "$lib/prisma";

export const GET: RequestHandler = async ({ url }) => {
  // Get the current date + d-40 days
  const seoulDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));  
  
  const searchStartDay = new Date(seoulDate);
  searchStartDay.setDate(searchStartDay.getDate() - 40);
  const searchStartDayStr = searchStartDay.toISOString().split('T')[0].replace(/-/g, '');  
  
  // Get the param
  const age = url.searchParams.get('age');
  const gender = url.searchParams.get('gender');
  const secCode = url.searchParams.get('secCode');  
  
  // Create age + gender predicates
  let ageGenderColumn = "";
  switch (age) {
    case "0-9":
      ageGenderColumn = `${gender!.toLowerCase()}_00_09`;
      break;
    case "10-14":
      ageGenderColumn = `${gender!.toLowerCase()}_10_14`;
      break;
    case "15-19":
      ageGenderColumn = `${gender!.toLowerCase()}_15_19`;
      break; 
    case "20-24":
      ageGenderColumn = `${gender!.toLowerCase()}_20_24`;
      break;
    case "25-29":
      ageGenderColumn = `${gender!.toLowerCase()}_25_29`;
      break;
    case "30-34":
      ageGenderColumn = `${gender!.toLowerCase()}_30_34`;
      break;
    case "35-39":
      ageGenderColumn = `${gender!.toLowerCase()}_35_39`;
      break;
    case "40-44":
      ageGenderColumn = `${gender!.toLowerCase()}_40_44`;
      break;
    case "45-49":
      ageGenderColumn = `${gender!.toLowerCase()}_45_49`;
      break;
    case "50-54":
      ageGenderColumn = `${gender!.toLowerCase()}_50_54`;
      break;
    case "55-59":
      ageGenderColumn = `${gender!.toLowerCase()}_55_59`;
      break;
    case "60-64":
      ageGenderColumn = `${gender!.toLowerCase()}_60_64`;
      break;
    case "65-69":
      ageGenderColumn = `${gender!.toLowerCase()}_65_69`;
      break;
    case "70":
      ageGenderColumn = `${gender!.toLowerCase()}_70_up`;
      break;
    default:
      ageGenderColumn = "total_population";
  }

  if (!secCode) {
    const local = await prisma.$queryRawUnsafe(`
      SELECT date_str, hour, sec_code, ${ageGenderColumn} as data
    FROM locals
    WHERE date_str = '${searchStartDayStr}'
    `);
    return json(local);
  } else {
    const localSpecific = await prisma.$queryRawUnsafe(`
      SELECT date_str, hour, sec_code, ${ageGenderColumn} as data
      FROM locals
      WHERE date_str = '${searchStartDayStr}' AND sec_code = '${secCode}'
    `);
    return json(localSpecific);
  }
};
