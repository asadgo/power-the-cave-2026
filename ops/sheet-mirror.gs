const HEADERS=['date','time','logged_by','gen1_hours','gen2_hours','gal_gen1','gal_gen2','gal_delivered','drum1_gal','drum2_gal','notes','received_utc'];
function doPost(e){
  const sh=SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if(sh.getLastRow()===0)sh.appendRow(HEADERS);
  let r={};try{r=JSON.parse(e.postData.contents||'{}');}catch(err){}
  sh.appendRow(HEADERS.map(k=>k==='received_utc'?new Date().toISOString():String(r[k]==null?'':r[k])));
  return ContentService.createTextOutput('ok');
}
function doGet(){return ContentService.createTextOutput('fuel-log mirror alive');}
