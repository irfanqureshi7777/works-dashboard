// ---------- REPLACE EXISTING renderTable + installRowClickHandlers WITH THIS ----------
function slug(s){
  return (''+s).toLowerCase().replace(/\s+/g,'_').replace(/[^\w\-]/g,'').replace(/^_+|_+$/g,'');
}

function renderTable(rows){
  const out = qs('output'); if (!out) return;
  out.innerHTML = '';
  if (!rows) rows = [];
  if (!Array.isArray(rows)) { try { rows = Object.values(rows); } catch(e){ rows = []; } }
  if (!rows || rows.length === 0) { out.innerHTML = '<div class="card">No data for selected filters</div>'; return; }

  // define headers with keys (data-col) and display labels
  const headers = [
    {k:'sr', label:'S No.'},
    {k:'engineer', label:'Engineer'},
    {k:'gp', label:'Gram Panchayat'},
    {k:'type_of_work', label:'Type of work'},
    {k:'name_of_work', label:'Name of work'},
    {k:'year_of_work', label:'Year of Work'},
    {k:'status', label:'Status'},
    {k:'unskilled', label:'Unskilled'},
    {k:'semi_skilled', label:'Semi-skilled'},
    {k:'skilled', label:'Skilled'},
    {k:'material', label:'Material'},
    {k:'contingency', label:'Contingency'},
    {k:'total_cost', label:'Total Cost'},
    {k:'unskilled_exp', label:'Unskilled Exp'},
    {k:'semi_skilled_exp', label:'Semi-skilled Exp'},
    {k:'skilled_exp', label:'Skilled Exp'},
    {k:'material_exp', label:'Material Exp'},
    {k:'contingency_exp', label:'Contingency Exp'},
    {k:'total_exp', label:'Total Exp'},
    {k:'category', label:'Category'},
    {k:'balance_mandays', label:'Balance Mandays'},
    {k:'pct_expenditure', label:'% expenditure'},
    {k:'remark', label:'Remark'}
  ];

  let html = '<table id="worksTable"><thead><tr>';
  headers.forEach(h => {
    html += '<th data-col="'+h.k+'">' + escapeHtml(h.label) + '</th>';
  });
  html += '</tr></thead><tbody>';

  const toNumLocal = v => { if (v === null || v === undefined) return NaN; const s = (''+v).replace(/,/g,'').trim(); if (s === '') return NaN; const n = Number(s); return isNaN(n)?NaN:n; };

  rows.forEach((r, ridx)=>{
    let arr = Array.isArray(r) ? r.slice() : (r && typeof r === 'object' ? Object.values(r) : [r]);
    arr = arr.map(x => x===null||x===undefined? '' : (''+x).trim());

    const map = {};
    map['engineer'] = arr[1] !== undefined ? arr[1] : '';
    map['gp'] = arr[2] !== undefined ? arr[2] : '';
    map['type_of_work'] = arr[3] !== undefined ? arr[3] : '';
    map['name_of_work'] = arr[4] !== undefined ? arr[4] : '';
    map['year_of_work'] = arr[5] !== undefined ? arr[5] : '';
    map['status'] = arr[6] !== undefined ? arr[6] : '';

    map['unskilled'] = toNumLocal(arr[7]);
    map['semi_skilled'] = toNumLocal(arr[8]);
    map['skilled'] = toNumLocal(arr[9]);
    map['material'] = toNumLocal(arr[10]);
    map['contingency'] = toNumLocal(arr[11]);
    const sheetTotalCost = toNumLocal(arr[12]);
    map['total_cost'] = !isNaN(sheetTotalCost) ? sheetTotalCost : NaN;

    map['unskilled_exp'] = toNumLocal(arr[13]);
    map['semi_skilled_exp'] = toNumLocal(arr[14]);
    map['skilled_exp'] = toNumLocal(arr[15]);
    map['material_exp'] = toNumLocal(arr[16]);
    map['contingency_exp'] = toNumLocal(arr[17]);
    const sheetTotalExp = toNumLocal(arr[18]);
    map['total_exp'] = !isNaN(sheetTotalExp) ? sheetTotalExp : NaN;

    map['category'] = arr[19] !== undefined ? arr[19] : '';
    map['balance_mandays'] = arr[20] !== undefined ? arr[20] : '';
    map['pct_expenditure'] = arr[21] !== undefined ? arr[21] : '';
    map['remark'] = arr[22] !== undefined ? arr[22] : '';

    try {
      if (isNaN(map['total_cost'])) {
        const totalPl = [map['unskilled'],map['semi_skilled'],map['skilled'],map['material'],map['contingency']].reduce((a,b)=> a + (isNaN(b)?0:b), 0);
        if (!isNaN(totalPl) && totalPl !== 0) map['total_cost'] = totalPl;
      }
      if (isNaN(map['total_exp'])) {
        const totalEx = [map['unskilled_exp'],map['semi_skilled_exp'],map['skilled_exp'],map['material_exp'],map['contingency_exp']].reduce((a,b)=> a + (isNaN(b)?0:b), 0);
        if (!isNaN(totalEx) && totalEx !== 0) map['total_exp'] = totalEx;
      }
    } catch(e){}

    function comp(pl, ex){
      const p = toNumLocal(pl), e = toNumLocal(ex);
      if (isNaN(p) && isNaN(e)) return '';
      if (isNaN(p) && !isNaN(e)) return (0 - e);
      if (!isNaN(p) && isNaN(e)) return p;
      return (p - e);
    }
    map['unskilled_balance'] = comp(map['unskilled'], map['unskilled_exp']);
    map['semi_skilled_balance'] = comp(map['semi_skilled'], map['semi_skilled_exp']);
    map['skilled_balance'] = comp(map['skilled'], map['skilled_exp']);
    map['material_balance'] = comp(map['material'], map['material_exp']);
    map['contingency_balance'] = comp(map['contingency'], map['contingency_exp']);
    map['total_balance'] = comp(map['total_cost'], map['total_exp']);

    map._raw = arr.slice();

    // build the row HTML with data-col on each td
    html += '<tr data-payload=\'' + escapeHtml(JSON.stringify(map)) + '\'>';
    // sr column
    html += '<td data-col="sr">' + (ridx + 1) + '</td>';

    // fill other columns in same order as headers.slice(1)
    headers.slice(1).forEach(h => {
      let val = '';
      try {
        if (h.k === 'sr') val = (ridx+1);
        else if (map.hasOwnProperty(h.k)) {
          if (h.k === 'pct_expenditure') {
            let rv = ('' + (map[h.k] || '')).toString().trim();
            if (rv === '') val = '';
            else if (rv.indexOf('%') !== -1) val = rv;
            else {
              let pnum = Number(rv);
              if (isNaN(pnum)) val = rv;
              else {
                if (Math.abs(pnum) <= 1) pnum = pnum * 100;
                val = Math.round(pnum) + '%';
              }
            }
          } else if (h.k === 'balance_mandays') {
            const bm = Number(('' + (map[h.k] || '')).replace(/,/g,'')); val = isNaN(bm)? (map[h.k] || '') : String(Math.round(bm));
          } else if (['unskilled','semi_skilled','skilled','material','contingency','total_cost','unskilled_exp','semi_skilled_exp','skilled_exp','material_exp','contingency_exp','total_exp','unskilled_balance','semi_skilled_balance','skilled_balance','material_balance','contingency_balance','total_balance'].indexOf(h.k) !== -1) {
            const n = map[h.k]; val = (n === '' || n === null || n === undefined) ? '' : (isNaN(n) ? ''+n : fmt(n));
          } else {
            val = (map[h.k] === null || map[h.k] === undefined) ? '' : (''+map[h.k]);
            // small cleanup for engineer field
            if (h.k === 'engineer') val = (''+val).replace(/^\s*\d+\s*[\.\-\)\:]*\s*/,'').trim();
          }
        } else {
          val = '';
        }
      } catch(e){ val = ''; }
      html += '<td data-col="'+h.k+'">' + escapeHtml(val) + '</td>';
    });

    html += '</tr>';
  });

  html += '</tbody></table>';
  out.innerHTML = html;
  installRowClickHandlers(); // will attach to worksTable rows
  dbg('debugDash','Rendered ' + rows.length + ' rows (sheet-mapped).');

  // let other UI hooks know table is ready (index.html exposes window.__worksUI)
  try { if (window.__worksUI && typeof window.__worksUI.rebuild === 'function') window.__worksUI.rebuild(); } catch(e){}
}

function installRowClickHandlers(){
  const table = qs('worksTable'); if (!table) return;
  table.querySelectorAll('tbody tr').forEach(tr=>{
    tr.style.cursor = 'pointer';
    tr.onclick = () => {
      const p = tr.getAttribute('data-payload'); if (!p) return;
      let payload;
      try { payload = JSON.parse(decodeHtml(p)); } catch(e){ payload = { _raw: p }; }
      showModalDetail(payload);
    };
  });
}
// ---------- END REPLACEMENT ----------
