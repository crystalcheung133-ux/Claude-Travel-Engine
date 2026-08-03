import json, pathlib
DATA_JS=pathlib.Path(__file__).resolve().parent.parent/'data.js'
s=DATA_JS.read_text(encoding='utf-8')

def extract(name):
    marker=f'const {name}='
    start=s.index(marker)+len(marker)
    return json.JSONDecoder().raw_decode(s[start:])[0]

places=extract('PLACES')
order=extract('GUIDE_ORDER')
missing=[]
for pid in order:
    place=places.get(pid)
    if not place:
        missing.append((pid,'missing place'))
        continue
    address=str(place.get('address') or '').strip()
    maps=str(place.get('maps') or '').strip()
    if not address:
        missing.append((pid,'empty address field'))
    if not maps:
        missing.append((pid,'empty map field'))
assert not missing, missing
print(f'Guide address integrity: PASS — {len(order)} Guide entities have structured address/map fields')
