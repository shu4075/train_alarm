export interface Station {
  id: string;
  odptId: string;
  name: string;
  nameEn: string;
  timeFromStart: number; // Cumulative minutes from Tokyo (approx for relative distance)
}

export const CHUO_LINE_STATIONS: Station[] = [
  { id: "JC01", odptId: "odpt.Station:JR-East.ChuoRapid.Tokyo", name: "東京", nameEn: "Tokyo", timeFromStart: 0 },
  { id: "JC02", odptId: "odpt.Station:JR-East.ChuoRapid.Kanda", name: "神田", nameEn: "Kanda", timeFromStart: 2 },
  { id: "JC03", odptId: "odpt.Station:JR-East.ChuoRapid.Ochanomizu", name: "御茶ノ水", nameEn: "Ochanomizu", timeFromStart: 4 },
  { id: "JC04", odptId: "odpt.Station:JR-East.ChuoRapid.Yotsuya", name: "四ツ谷", nameEn: "Yotsuya", timeFromStart: 9 },
  { id: "JC05", odptId: "odpt.Station:JR-East.ChuoRapid.Shinjuku", name: "新宿", nameEn: "Shinjuku", timeFromStart: 14 },
  { id: "JC06", odptId: "odpt.Station:JR-East.ChuoRapid.Nakano", name: "中野", nameEn: "Nakano", timeFromStart: 18 },
  { id: "JC07", odptId: "odpt.Station:JR-East.ChuoRapid.Koenji", name: "高円寺", nameEn: "Koenji", timeFromStart: 20 },
  { id: "JC08", odptId: "odpt.Station:JR-East.ChuoRapid.Asagaya", name: "阿佐ケ谷", nameEn: "Asagaya", timeFromStart: 22 },
  { id: "JC09", odptId: "odpt.Station:JR-East.ChuoRapid.Ogikubo", name: "荻窪", nameEn: "Ogikubo", timeFromStart: 24 },
  { id: "JC10", odptId: "odpt.Station:JR-East.ChuoRapid.NishiOgikubo", name: "西荻窪", nameEn: "Nishi-Ogikubo", timeFromStart: 26 },
  { id: "JC11", odptId: "odpt.Station:JR-East.ChuoRapid.Kichijoji", name: "吉祥寺", nameEn: "Kichijoji", timeFromStart: 28 },
  { id: "JC12", odptId: "odpt.Station:JR-East.ChuoRapid.Mitaka", name: "三鷹", nameEn: "Mitaka", timeFromStart: 30 },
  { id: "JC13", odptId: "odpt.Station:JR-East.ChuoRapid.MusashiSakai", name: "武蔵境", nameEn: "Musashi-Sakai", timeFromStart: 32 },
  { id: "JC14", odptId: "odpt.Station:JR-East.ChuoRapid.HigashiKoganei", name: "東小金井", nameEn: "Higashi-Koganei", timeFromStart: 35 },
  { id: "JC15", odptId: "odpt.Station:JR-East.ChuoRapid.MusashiKoganei", name: "武蔵小金井", nameEn: "Musashi-Koganei", timeFromStart: 37 },
  { id: "JC16", odptId: "odpt.Station:JR-East.ChuoRapid.Kokubunji", name: "国分寺", nameEn: "Kokubunji", timeFromStart: 40 },
  { id: "JC17", odptId: "odpt.Station:JR-East.ChuoRapid.NishiKokubunji", name: "西国分寺", nameEn: "Nishi-Kokubunji", timeFromStart: 42 },
  { id: "JC18", odptId: "odpt.Station:JR-East.ChuoRapid.Kunitachi", name: "国立", nameEn: "Kunitachi", timeFromStart: 45 },
  { id: "JC19", odptId: "odpt.Station:JR-East.ChuoRapid.Tachikawa", name: "立川", nameEn: "Tachikawa", timeFromStart: 48 },
  { id: "JC20", odptId: "odpt.Station:JR-East.ChuoRapid.Hino", name: "日野", nameEn: "Hino", timeFromStart: 51 },
  { id: "JC21", odptId: "odpt.Station:JR-East.ChuoRapid.Toyoda", name: "豊田", nameEn: "Toyoda", timeFromStart: 54 },
  { id: "JC22", odptId: "odpt.Station:JR-East.ChuoRapid.Hachioji", name: "八王子", nameEn: "Hachioji", timeFromStart: 58 },
  { id: "JC23", odptId: "odpt.Station:JR-East.ChuoRapid.NishiHachioji", name: "西八王子", nameEn: "Nishi-Hachioji", timeFromStart: 61 },
  { id: "JC24", odptId: "odpt.Station:JR-East.ChuoRapid.Takao", name: "高尾", nameEn: "Takao", timeFromStart: 65 },
];
