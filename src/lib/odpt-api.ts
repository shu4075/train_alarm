/**
 * ODPT (Open Data Center for Public Transportation) API Client
 * Provides real-time and static train data for Japanese transit.
 */

const ODPT_BASE_URL = "https://api.odpt.org/api/v4";
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_ODPT_ACCESS_TOKEN;

export interface ODPTTimetableEntry {
  "odpt:departureTime": string;
  "odpt:destinationStation": string[];
  "odpt:trainType": string;
  "odpt:isLast"?: boolean;
  "odpt:isOrigin"?: boolean;
}

export interface ODPTTrainInfo {
  "odpt:trainInformationText": { ja: string; en: string };
  "odpt:trainInformationStatus"?: { ja: string; en: string };
  "dc:date": string;
}

/**
 * Fetches the timetable for a specific station and direction
 */
export async function fetchStationTimetable(stationId: string, directionId: string) {
  if (!ACCESS_TOKEN) {
    throw new Error("ODPT Access Token is missing. Please set NEXT_PUBLIC_ODPT_ACCESS_TOKEN in .env.local");
  }

  // Example stationId: odpt.Station:JR-East.ChuoRapid.Tokyo
  // Example directionId: odpt.RailDirection:Outbound
  const url = `${ODPT_BASE_URL}/odpt:StationTimetable?acl:consumerKey=${ACCESS_TOKEN}&odpt:station=${stationId}&odpt:railDirection=${directionId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`ODPT API Error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Return entries for the current calendar (Weekday/SaturdayHoliday)
  const isWeekend = [0, 6].includes(new Date().getDay());
  const calendar = isWeekend ? "odpt.Calendar:SaturdayHoliday" : "odpt.Calendar:Weekday";
  
  const timetable = data.find((t: any) => t["odpt:calendar"] === calendar);
  return timetable ? timetable["odpt:stationTimetableObject"] : [];
}

/**
 * Fetches real-time operation information for a railway line
 */
export async function fetchRailwayInformation(railwayId: string) {
  if (!ACCESS_TOKEN) return null;

  const url = `${ODPT_BASE_URL}/odpt:TrainInformation?acl:consumerKey=${ACCESS_TOKEN}&odpt:railway=${railwayId}`;
  
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();
  return data[0] as ODPTTrainInfo;
}
