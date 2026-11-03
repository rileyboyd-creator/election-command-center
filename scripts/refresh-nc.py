"""Official NCSBE precinct results; never mix with civicAPI totals."""
import csv,io,json,zipfile,urllib.request,datetime,pathlib,sys
year=2022 if '--history' in sys.argv else 2026
date='20221108' if year==2022 else '20261103'
url=f'https://s3.amazonaws.com/dl.ncsbe.gov/ENRS/{year}_{date[4:6]}_{date[6:]}/results_pct_{date}.zip'
stamp=datetime.datetime.now(datetime.timezone.utc).isoformat()
def failed(kind,value,traceback):
    if year==2026:
        p=pathlib.Path('data/secondary/health.json');p.parent.mkdir(parents=True,exist_ok=True)
        p.write_text(json.dumps({'checked_at':stamp,'status':'error','message':str(value),'last_good_preserved':True}))
    sys.__excepthook__(kind,value,traceback)
sys.excepthook=failed

local=next((a.split('=',1)[1] for a in sys.argv if a.startswith('--input=')),None)
if local:
    raw=pathlib.Path(local).read_bytes();modified=None
else:
    with urllib.request.urlopen(url,timeout=35) as response:
        raw=response.read(100_000_001);modified=response.headers.get('Last-Modified')
    if len(raw)>100_000_000: raise ValueError('Response too large')
z=zipfile.ZipFile(io.BytesIO(raw));files=[n for n in z.namelist() if n.endswith('.txt')]
if len(files)!=1: raise ValueError('Unexpected ZIP layout')
rows=csv.DictReader(io.StringIO(z.read(files[0]).decode('utf-8-sig')),delimiter='\t')
totals={};counties={};seen=set();names=set()
for row in rows:
    if row['Contest Name'].strip()!='US SENATE': continue
    if row['Election Date']!=('11/08/2022' if year==2022 else '11/03/2026'): raise ValueError('Wrong election date')
    name=row['Choice'].strip();party={'DEM':'Democratic','REP':'Republican','LIB':'Libertarian','GRE':'Green','UNA':'Independent'}.get(row['Choice Party'].strip(),'Other')
    key=(row['County'],row['Precinct'],row['Contest Group ID'],name)
    if key in seen: raise ValueError('Duplicate precinct/candidate')
    seen.add(key);votes=int(row['Total Votes'])
    if votes<0: raise ValueError('Negative votes')
    totals[(name,party)]=totals.get((name,party),0)+votes
    county=row['County'].title();counts=counties.setdefault(county,{})
    counts[(name,party)]=counts.get((name,party),0)+votes
if len(counties)!=100 or not totals: raise ValueError('Incomplete NC Senate coverage')
def candidates(t): return [{'name':n,'party':p,'votes':v} for (n,p),v in t.items()]
out={'id':'US-2026-SEN-NC' if year==2026 else 'US-2022-SEN-NC','provider':'North Carolina State Board of Elections','state':'NC','year':year,'source':url,'source_updated':modified,'retrieved_at':stamp,'status':'historical' if year==2022 else 'official-unofficial','candidates':candidates(totals),'counties':[{'name':n,'candidates':candidates(c)} for n,c in counties.items()],'definition':'Sum of Total Votes across unique precinct/candidate rows for US SENATE. Historical county matching uses unique normalized county names; no FIPS supplied in this file. Official authority data; 2026 returns remain unofficial.'}
path=pathlib.Path('data/history/NC-2022-senate.json' if year==2022 else 'data/secondary/NC.json');path.parent.mkdir(parents=True,exist_ok=True)
path.with_suffix('.tmp').write_text(json.dumps(out,indent=2));path.with_suffix('.tmp').replace(path)
print(json.dumps({'year':year,'counties':len(counties),'candidates':candidates(totals)}))

if year==2026: pathlib.Path('data/secondary/health.json').write_text(json.dumps({'checked_at':stamp,'status':'ok','message':'Official NC results parsed and validated.'}))
