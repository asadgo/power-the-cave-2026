/* Cave Fuel Log — BACKUP  ·  Google Apps Script v2
   Tabs:  📋 Fuel log        = human view + the place leads TYPE on a bad day
          ⛽ Bad-day totals  = fuel on hand / poured / gal-per-hour, formula-driven
          raw                = machine columns; the Worker writes here (identical to data/reality.csv)
   Install: Extensions ▸ Apps Script ▸ replace all ▸ Save ▸ pick "setup" in the function dropdown ▸ Run (authorize once).
   The existing Web app deployment keeps working (doPost behavior unchanged). */

const RAW='raw', HUMAN='📋 Fuel log', TOT='⛽ Bad-day totals';
const HEADERS=['date','time','logged_by','gen1_hours','gen2_hours','gal_gen1','gal_gen2','gal_delivered','drum1_gal','drum2_gal','notes','received_utc'];
const HUMAN_HDR=['When','Who','Gen 1 hours','Gen 2 hours','Fuel → gen 1','Fuel → gen 2','Delivery','Drum 1','Drum 2','Notes','Retracted by / reason'];

function ss(){return SpreadsheetApp.getActiveSpreadsheet();}
function raw(){let s=ss().getSheetByName(RAW);if(!s){s=ss().getSheets()[0];s.setName(RAW);}if(s.getLastRow()===0)s.appendRow(HEADERS);return s;}

/* ---------- Worker → raw (unchanged contract) ---------- */
function doPost(e){
  const sh=raw();
  let r={};try{r=JSON.parse(e.postData.contents||'{}');}catch(err){}
  sh.appendRow(HEADERS.map(k=>k==='received_utc'?new Date().toISOString():String(r[k]==null?'':r[k])));
  return ContentService.createTextOutput('ok');
}
function doGet(){return ContentService.createTextOutput('fuel-log mirror alive');}

/* ---------- one-time setup: builds the two human tabs ---------- */
function setup(){
  const s=ss();raw();
  let h=s.getSheetByName(HUMAN);if(!h)h=s.insertSheet(HUMAN,0);
  let t=s.getSheetByName(TOT);if(!t)t=s.insertSheet(TOT,1);
  buildHuman(h);buildTotals(t);
  s.setActiveSheet(h);
}
function buildHuman(h){
  h.clear();h.setFrozenRows(2);
  h.getRange('A1').setValue('THE CAVE · FUEL LOG (backup)  —  newest first. Bad day? Scroll to the yellow input area at the bottom and type new rows there; they sync to raw automatically.')
   .setFontWeight('bold').setFontColor('#6b6b6b');
  h.getRange(2,1,1,HUMAN_HDR.length).setValues([HUMAN_HDR]).setFontWeight('bold').setBackground('#e8e6df');
  const col=(i,c)=>h.getRange(2,i).setBackground(c).setFontColor('#ffffff');
  col(3,'#2f6fad');col(5,'#2f6fad');col(4,'#c2568f');col(6,'#c2568f');col(8,'#0d9488');col(9,'#0d9488');
  h.getRange('A3').setFormula(
   '=IFERROR(SORT(ARRAYFORMULA(IF(LEN(raw!A2:A),{' +
   'TEXT(raw!A2:A,"ddd m/d")&" "&TEXT(raw!B2:B,"h:mm am/pm"),' +
   'raw!C2:C, raw!D2:D, raw!E2:E, raw!F2:F, raw!G2:G, raw!H2:H, raw!I2:I, raw!J2:J, raw!K2:K,' +
   'IFERROR(VLOOKUP("RETRACT#"&(ROW(raw!A2:A)-1)&":",' +
   '{REGEXEXTRACT(raw!K2:K,"^(RETRACT#\\d+:)"), raw!C2:C&" — "&REGEXREPLACE(raw!K2:K,"^RETRACT#\\d+:\\s*","")},2,FALSE),"")' +
   '},)), 1, FALSE),"")');
  h.setColumnWidth(1,150);h.setColumnWidth(2,90);h.setColumnWidths(3,7,80);h.setColumnWidth(10,220);h.setColumnWidth(11,220);
  const rng=h.getRange('A3:K1000');
  h.setConditionalFormatRules([
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=AND(LEN($A3),LEN($K3))').setStrikethrough(true).setFontColor('#9a9a9a').setRanges([rng]).build(),
    SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=REGEXMATCH($J3,"^RETRACT#")').setFontColor('#c0392b').setRanges([rng]).build()]);
  const top=1004;
  h.getRange(top,1).setValue('BAD-DAY INPUT — type here only if the web page is down. One line per event. Blank fields are fine. Date as 2026-08-27, time as 14:30. Retraction = notes "RETRACT#<raw row>: reason".').setFontWeight('bold').setFontColor('#8a5a00');
  h.getRange(top+1,1,1,11).setValues([['date','time','logged_by','gen1_hours','gen2_hours','gal_gen1','gal_gen2','gal_delivered','drum1_gal','drum2_gal','notes']]).setFontWeight('bold').setBackground('#fff3c4');
  h.getRange(top+2,1,40,11).setBackground('#fffbe6');
  h.getRange(top+2,1,40,2).setNumberFormat('@');
}
function buildTotals(t){
  t.clear();
  const rows=[
   ['THE CAVE · BAD-DAY TOTALS','(same math as the page tiles, computed from raw)'],
   ['',''],
   ['Fuel on hand (gal)','=IFERROR(LET(d,FILTER(ROW(raw!A2:A),LEN(raw!I2:I),NOT(REGEXMATCH(raw!K2:K,"^RETRACT#"))),last,MAX(d),base,INDEX(raw!I:I,last)+INDEX(raw!J:J,last),after,FILTER(N(raw!H2:H)-N(raw!F2:F)-N(raw!G2:G),ROW(raw!A2:A)>last),base+SUM(after)),"—")'],
   ['Last drum check','=IFERROR(LET(d,FILTER(ROW(raw!A2:A),LEN(raw!I2:I)),last,MAX(d),INDEX(raw!A:A,last)&" "&INDEX(raw!B:B,last)&" by "&INDEX(raw!C:C,last)),"—")'],
   ['',''],
   ['Poured — total (gal)','=SUM(raw!F2:F)+SUM(raw!G2:G)'],
   ['Poured — gen 1 (gal)','=SUM(raw!F2:F)'],
   ['Poured — gen 2 (gal)','=SUM(raw!G2:G)'],
   ['Delivered — total (gal)','=SUM(raw!H2:H)'],
   ['',''],
   ['Gen 1 gal/hr','=IFERROR(SUM(raw!F2:F)/(MAX(raw!D2:D)-MIN(FILTER(raw!D2:D,LEN(raw!D2:D)))),"needs 2 meter readings")'],
   ['Gen 2 gal/hr','=IFERROR(SUM(raw!G2:G)/(MAX(raw!E2:E)-MIN(FILTER(raw!E2:E,LEN(raw!E2:E)))),"needs 2 meter readings")'],
   ['',''],
   ['Last entry','=IFERROR(INDEX(raw!A:A,COUNTA(raw!A:A))&" "&INDEX(raw!B:B,COUNTA(raw!A:A))&" by "&INDEX(raw!C:C,COUNTA(raw!A:A)),"—")'],
   ['Entries logged','=MAX(0,COUNTA(raw!A:A)-1)'],
   ['',''],
   ['Note','Retracted rows are excluded from Fuel on hand. The pour/delivery sums include every row; on a bad day subtract a retracted pour by hand.']];
  t.getRange(1,1,rows.length,2).setValues(rows);
  t.getRange('A1').setFontWeight('bold');t.getRange('A3:A17').setFontWeight('bold');
  t.getRange('B3').setFontSize(18).setFontWeight('bold').setFontColor('#0d9488');
  t.setColumnWidth(1,220);t.setColumnWidth(2,460);
}
/* ---------- bad-day: yellow input area on the human tab → raw ---------- */
function onEdit(e){
  try{
    const sh=e.range.getSheet();if(sh.getName()!==HUMAN)return;
    const r=e.range.getRow();if(r<1006)return;
    const vals=sh.getRange(r,1,1,11).getValues()[0];
    if(!vals[0]||!vals[2])return;
    if(sh.getRange(r,12).getValue()==='synced')return;
    raw().appendRow([...vals.map(v=>String(v==null?'':v)),new Date().toISOString()]);
    sh.getRange(r,12).setValue('synced').setFontColor('#0d9488');
  }catch(err){}
}
