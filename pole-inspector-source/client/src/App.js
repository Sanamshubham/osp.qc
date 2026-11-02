import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const DEFAULT_MARKET_GUIDELINES = {
  "OHIO": { exp_anchor: "ANC-EXP-3/4", exp_ownership: "FO/CO/JO", exp_species: "Southern Pine" },
  "OHIO-CLEVELAND": { exp_anchor: "ANC-HELIX-10", exp_ownership: "FO/CO/JO", exp_species: "Southern Pine" },
  "OHIO-TOLEDO": { exp_anchor: "ANC-EXP-3/4", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "NORTH CAROLINA": { exp_anchor: "MR3-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "GEORGIA": { exp_anchor: "MR3-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "ILLINOIS": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "FLORIDA": { exp_anchor: "MR3-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "ALABAMA": { exp_anchor: "SRW-C7", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "ALABAMA-MOBILE": { exp_anchor: "MR3-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "ALABAMA-PENSACOLA": { exp_anchor: "MR3-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "LOUISIANA": { exp_anchor: "SRW-C7", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "MISSOURI": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "ARKANSAS": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "TEXAS": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "OKLAHAMA": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO", exp_species: "Southern Pine" },
  "FRESNO": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO/JO", exp_species: "Southern Pine" },
  "NEVADA": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO/JO", exp_species: "Douglas Fir" },
  "WEST BAY": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO/JO", exp_species: "Douglas Fir" },
  "CALIFORNIA": { exp_anchor: "ANC-EXP-5/8", exp_ownership: "FO/CO/JO", exp_species: "Douglas Fir" },
  "TENNESSEE": { exp_anchor: "MR1-1", exp_ownership: "FO/CO", exp_species: "Southern Pine" }
};

const DEFAULT_LOOKUP_MATRIX = {
  20: { "1": 31, "2": 29, "3": 27, "4": 25, "5": 23, "6": 21, "7": 19.5, "9": 17.5, "10": 14 },
  25: { "1": 33.5, "2": 31.5, "3": 29.5, "4": 27.5, "5": 25.5, "6": 23.5, "7": 21.5, "9": 19.5, "10": 15 },
  30: { "1": 36.5, "2": 34, "3": 31.5, "4": 29.5, "5": 27.5, "6": 25, "7": 23.5, "9": 21 },
  35: { "1": 39, "2": 36.5, "3": 34, "4": 31.5, "5": 29, "6": 27, "7": 25 },
  40: { "1": 41.5, "2": 39, "3": 36, "4": 33.5, "5": 31, "6": 28.5 },
  45: { "H6": 58.5, "H5": 56, "H4": 53.5, "H3": 51, "H2": 48.5, "H1": 45.5, "1": 43, "2": 40.5, "3": 37.5, "4": 35, "5": 32.5, "6": 30 },
  50: { "H6": 61, "H5": 58, "H4": 55.5, "H3": 53, "H2": 50, "H1": 47, "1": 44.5, "2": 42, "3": 39, "4": 36.5, "5": 34 },
  55: { "H6": 63.5, "H5": 60.5, "H4": 58, "H3": 55, "H2": 52, "H1": 49.5, "1": 46.5, "2": 43.5, "3": 40.5, "4": 38 },
  60: { "H6": 65.5, "H5": 62.5, "H4": 60, "H3": 57, "H2": 54, "H1": 51, "1": 48, "2": 45, "3": 42, "4": 39.5 },
  65: { "H6": 67.5, "H5": 64.5, "H4": 61.5, "H3": 58.5, "H2": 55.5, "H1": 52.5, "1": 49.5, "2": 46.5, "3": 43.5, "4": 40.5 },
  70: { "H6": 69, "H5": 66, "H4": 63.5, "H3": 60, "H2": 57, "H1": 54, "1": 51, "2": 48, "3": 45, "4": 41.5 },
  75: { "H6": 71, "H5": 68, "H4": 65, "H3": 62, "H2": 59, "H1": 55.5, "1": 52.5, "2": 49, "3": 46 },
  80: { "H6": 72.5, "H5": 69.5, "H4": 66.5, "H3": 63.5, "H2": 60, "H1": 57, "1": 53.5, "2": 50.5, "3": 47 },
  85: { "H6": 74.5, "H5": 71.5, "H4": 68, "H3": 65, "H2": 61.5, "H1": 58.5, "1": 55, "2": 51.5, "3": 48 },
  90: { "H6": 76, "H5": 73, "H4": 69.5, "H3": 66.5, "H2": 63, "H1": 59.5, "1": 56, "2": 52.5, "3": 49 },
  95: { "H6": 77.5, "H5": 74.5, "H4": 71, "H3": 67.5, "H2": 64.5, "H1": 61, "1": 57, "2": 54 },
  100: { "H6": 79, "H5": 76, "H4": 72.5, "H3": 69, "H2": 65.5, "H1": 62, "1": 58, "2": 55 },
  105: { "H6": 80.5, "H5": 77.5, "H4": 74, "H3": 70.5, "H2": 67, "H1": 63, "1": 59.5, "2": 56 },
  110: { "H6": 82, "H5": 78.5, "H4": 75, "H3": 71.5, "H2": 68, "H1": 64, "1": 60.5, "2": 57 },
  115: { "H6": 83.5, "H5": 80, "H4": 76.5, "H3": 72.5, "H2": 69, "H1": 65.5, "1": 61.5, "2": 58 },
  120: { "H6": 85, "H5": 81, "H4": 77.5, "H3": 73.5, "H2": 70, "H1": 66.5, "1": 62.5, "2": 59 },
  125: { "H6": 86, "H5": 82.5, "H4": 78.5, "H3": 75, "H2": 71, "H1": 67.5, "1": 63.5, "2": 60 }
};

export default function App() {
  const [selectedMarket, setSelectedMarket] = useState("OHIO");
  const [fileData, setFileData] = useState({});
  const [processedResults, setProcessedResults] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [filterErrors, setFilterErrors] = useState(false);

  const extractNumeric = (val) => String(val || "").replace(/\D/g, "");
  const isDropPole = (textVal) => /\b(DROP|SVC DROP|SERVICE DROP)\b/i.test(String(textVal || ""));
  const extractCircumference = (textVal) => {
    const match = String(textVal || "").match(/CIRCUMFERENCE\s*[:\-\s]*\s*(\d+(?:\.\d+)?)/i);
    return match ? parseFloat(match[1]) : 0;
  };

  const extractAllAttHoa = (textVal) => {
    if (!textVal) return [];
    return String(textVal).split(/\r?\n/).map(line => {
      if (line.toUpperCase().includes("ATT HOA")) {
        const m = line.match(/-\s*(\d+(?:\.\d+)?)/);
        return m ? parseFloat(m[1]) : null;
      }
      return null;
    }).filter(v => v !== null && v > 0);
  };

  const extractLowestAttHoa = (textVal) => {
    const list = extractAllAttHoa(textVal);
    return list.length > 0 ? Math.min(...list) : 999999;
  };

  const matchSpecies = (actual, expected) => {
    if (!actual) return true;
    const act = actual.toUpperCase();
    const exp = expected.toUpperCase();
    if (act === exp) return true;
    if (exp === "SOUTHERN PINE" && ["SP", "SYP", "SOUTHERN PINE"].includes(act)) return true;
    if (exp === "DOUGLAS FIR" && ["DF", "DOUGLAS FIR"].includes(act)) return true;
    return false;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' });
      const parsed = {};
      wb.SheetNames.forEach(name => {
        parsed[name.toUpperCase()] = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
      });
      setFileData(parsed);
      setStatusMessage(`Loaded workbook sheets: ${Object.keys(parsed).join(', ')}`);
    };
    reader.readAsBinaryString(file);
  };

  const executeQCProcess = () => {
    const wsPole = fileData["POLE"];
    const wsNote = fileData["NOTE"];
    const wsAnchor = fileData["ANCHOR"];
    const wsGuy = fileData["GUY"];

    if (!wsPole || !wsNote) {
      alert("POLE and NOTE sheets are required!");
      return;
    }

    const mRule = DEFAULT_MARKET_GUIDELINES[selectedMarket];
    const isLouisiana = selectedMarket.includes("LOUISIANA");

    const dictNoteD = {}, dictNoteL = {};
    if (wsNote) {
      for (let i = 1; i < wsNote.length; i++) {
        const id = extractNumeric(wsNote[i][10]);
        if (id) {
          dictNoteD[id] = wsNote[i][3] || "";
          dictNoteL[id] = wsNote[i][11] || "";
        }
      }
    }

    const dictAnchor = {};
    if (wsAnchor) {
      for (let i = 1; i < wsAnchor.length; i++) {
        const id = extractNumeric(wsAnchor[i][8]);
        if (id) {
          const q = String(wsAnchor[i][16] || "").trim();
          const j = String(wsAnchor[i][9] || "").trim();
          dictAnchor[id] = (q && j) ? `${q}-${j}` : (j || q);
        }
      }
    }

    const dictGuyA = {}, dictGuyE = {};
    if (wsGuy) {
      for (let i = 1; i < wsGuy.length; i++) {
        const pid = extractNumeric(wsGuy[i][5]);
        if (pid) {
          if (!dictGuyA[pid]) { dictGuyA[pid] = []; dictGuyE[pid] = []; }
          dictGuyA[pid].push(parseFloat(wsGuy[i][0]) || 0);
          dictGuyE[pid].push(String(wsGuy[i][4] || ""));
        }
      }
    }

    const results = [];
    for (let i = 1; i < wsPole.length; i++) {
      const row = wsPole[i];
      if (!row || !row.length) continue;

      const acc = String(row[0] || "").trim().toLowerCase();
      const ht = row[7] !== undefined ? Math.round(parseFloat(row[7])) : "";
      const cls = String(row[1] || "").trim();
      let hoaVal = parseFloat(row[5]) || 0;
      if (hoaVal) hoaVal = Math.round(hoaVal * 3.28084 * 100) / 100;

      const poleID = String(row[8] || "");
      const numID = extractNumeric(poleID);

      let poleText = dictNoteD[numID] || "";
      if (!poleText || poleText.trim().toUpperCase() === "NONE") poleText = dictNoteL[numID] || "";
      const uPoleText = poleText.toUpperCase();

      let circCheck = "";
      const actualCirc = extractCircumference(poleText);
      if (isDropPole(poleText)) circCheck = "MATCH";
      else if (!poleText) circCheck = "CHECK POLE & ASSOCIATE NOTE";
      else if (uPoleText.includes("INACCESSIBLE")) circCheck = acc === "n" ? "MATCH" : "ERROR: INACCESSIBLE IN NOTE BUT COL A IS Y";
      else if (acc === "n") circCheck = actualCirc > 0 ? "ERROR: CHECK ACCESSIBILITY" : "MATCH";
      else if (ht && cls) {
        const exp = DEFAULT_LOOKUP_MATRIX[ht] ? DEFAULT_LOOKUP_MATRIX[ht][cls] : undefined;
        if (exp === undefined) circCheck = "Height/Class Not Found";
        else if (actualCirc === 0) circCheck = "CIRCUMFERENCE MISSING";
        else if (Math.abs(actualCirc - exp) <= 1) circCheck = "MATCH";
        else circCheck = `ERROR: Expected ${exp}, Found ${actualCirc}`;
      }

      let hoaCheck = "";
      if (isDropPole(poleText)) hoaCheck = "MATCH";
      else {
        const minAtt = extractLowestAttHoa(poleText);
        if (minAtt === 999999) hoaCheck = "NO ATT HOA FOUND";
        else if (Math.round(hoaVal) === Math.round(minAtt)) hoaCheck = "MATCH";
        else hoaCheck = `MISMATCH: Col D=${Math.round(hoaVal)} | Min ATT=${Math.round(minAtt)}`;
      }

      let rawAnchorComb = "", isHoaMatched = false;
      if (dictGuyA[numID]) {
        const attHoaList = extractAllAttHoa(poleText);
        dictGuyA[numID].forEach((meters, gIdx) => {
          const guyFt = Math.round(meters * 3.28084);
          if (attHoaList.some(v => Math.round(v) === guyFt)) {
            isHoaMatched = true;
            const aId = extractNumeric(dictGuyE[numID][gIdx]);
            if (dictAnchor[aId]) rawAnchorComb += (rawAnchorComb ? ", " : "") + dictAnchor[aId];
          }
        });
      }

      let anchorDetailResult = "", isAnchorValid = true;
      if (isHoaMatched && rawAnchorComb) {
        for (let item of rawAnchorComb.split(",")) {
          const clean = item.trim();
          const prefix = clean.substring(0, 2).toUpperCase();
          if (prefix === "Y-" && clean.substring(2).trim().toUpperCase() !== mRule.exp_anchor.toUpperCase()) isAnchorValid = false;
          if (prefix === "N-" && isLouisiana && !["SRW-C7", "SRW-C3", "SRW-C6"].some(c => clean.substring(2).trim().toUpperCase().startsWith(c))) isAnchorValid = false;
        }
        anchorDetailResult = isAnchorValid ? rawAnchorComb : `Incorrect - ${rawAnchorComb} / Correct is ${mRule.exp_anchor}`;
      }

      const actOwnership = String(row[18] || "").trim().toUpperCase();
      const hasOther = ["POWER HOA", "OTHER HOA", "CATV HOA", "TELCO HOA"].some(k => uPoleText.includes(k));
      const expOwner = (!hasOther && extractAllAttHoa(poleText).length > 0) ? "CO" : mRule.exp_ownership;
      const isOwnerValid = expOwner.split("/").map(s=>s.trim()).includes(actOwnership) || !actOwnership;

      const actSpecies = String(row[20] || "").trim();
      const isSpeciesValid = matchSpecies(actSpecies, mRule.exp_species);

      results.push({
        rowNum: i + 1, accessible: row[0] || "", height: row[7] || "", classVal: row[1] || "",
        hoa: hoaVal, poleID: poleID, poleDetails: poleText, circCheck, hoaCheck,
        anchorDetails: anchorDetailResult, ownership: actOwnership, isOwnerValid,
        species: actSpecies, isSpeciesValid,
        hasError: (circCheck !== "MATCH" || hoaCheck !== "MATCH" || !isAnchorValid || !isOwnerValid || !isSpeciesValid)
      });
    }

    setProcessedResults(results);
    setStatusMessage(`QC finished for market: ${selectedMarket}`);
  };

  const displayed = filterErrors ? processedResults.filter(r => r.hasError) : processedResults;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">QC Pole Inspector Dashboard</h1>
          <p className="text-xs text-gray-500 mt-1">Full-Stack React + Node Processing System</p>
        </div>
        <select value={selectedMarket} onChange={e=>setSelectedMarket(e.target.value)} className="p-2 border rounded bg-white text-sm font-medium">
          {Object.keys(DEFAULT_MARKET_GUIDELINES).map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <div className="bg-white p-4 rounded shadow border space-y-4">
        <div className="flex items-center space-x-6">
          <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="text-sm text-gray-500" />
          <button onClick={executeQCProcess} disabled={!Object.keys(fileData).length} className="px-6 py-2 bg-blue-600 text-white font-medium rounded shadow disabled:bg-gray-300">
            Run QC Check
          </button>
        </div>
        {statusMessage && <p className="text-sm text-blue-600">{statusMessage}</p>}
      </div>

      {processedResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold">Showing {displayed.length} of {processedResults.length} records</span>
            <label className="flex items-center space-x-2 text-sm font-medium">
              <input type="checkbox" checked={filterErrors} onChange={e=>setFilterErrors(e.target.checked)} className="rounded" />
              <span>Show Errors Only</span>
            </label>
          </div>
          <div className="overflow-x-auto bg-white rounded shadow border">
            <table className="min-w-full text-xs text-left border-collapse">
              <thead className="bg-gray-100 border-b uppercase">
                <tr>
                  <th className="p-2 border">Row</th>
                  <th className="p-2 border">Acc</th>
                  <th className="p-2 border">Height</th>
                  <th className="p-2 border">Class</th>
                  <th className="p-2 border">HOA (ft)</th>
                  <th className="p-2 border">Pole ID</th>
                  <th className="p-2 border">Details</th>
                  <th className="p-2 border">Circ Check</th>
                  <th className="p-2 border">HOA Error</th>
                  <th className="p-2 border">Anchor Details</th>
                  <th className="p-2 border">Owner</th>
                  <th className="p-2 border">Species</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="p-2 border">{row.rowNum}</td>
                    <td className="p-2 border">{row.accessible}</td>
                    <td className="p-2 border">{row.height}</td>
                    <td className="p-2 border">{row.classVal}</td>
                    <td className="p-2 border">{row.hoa}</td>
                    <td className="p-2 border">{row.poleID}</td>
                    <td className="p-2 border max-w-xs truncate">{row.poleDetails}</td>
                    <td className={`p-2 border font-semibold ${row.circCheck !== "MATCH" ? "bg-red-100 text-red-700" : ""}`}>{row.circCheck}</td>
                    <td className={`p-2 border font-semibold ${row.hoaCheck !== "MATCH" ? "bg-red-100 text-red-700" : ""}`}>{row.hoaCheck}</td>
                    <td className={`p-2 border font-semibold ${row.anchorDetails.includes("Incorrect") ? "bg-red-100 text-red-700" : ""}`}>{row.anchorDetails}</td>
                    <td className={`p-2 border font-semibold ${!row.isOwnerValid ? "bg-red-100 text-red-700" : ""}`}>{row.ownership}</td>
                    <td className={`p-2 border font-semibold ${!row.isSpeciesValid ? "bg-red-100 text-red-700" : ""}`}>{row.species}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
