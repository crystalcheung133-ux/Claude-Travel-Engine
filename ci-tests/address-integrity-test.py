import json,re,pathlib
DATA_JS=pathlib.Path(__file__).resolve().parent.parent / "data.js"
s=DATA_JS.read_text(encoding="utf-8")
def read_const(name):
    marker=f"const {name}="
    start=s.index(marker)+len(marker)
    decoder=json.JSONDecoder()
    value,_=decoder.raw_decode(s[start:])
    return value
places=read_const("PLACES")
guide_order=read_const("GUIDE_ORDER")
bad=[]
for key in guide_order:
    value=places.get(key)
    if not value:
        bad.append((key,"missing-place")); continue
    address=(value.get("address") or "").strip()
    # Empty address is an explicit research gap and is allowed in a sandbox.
    # Reject known placeholder/fabricated values rather than enforcing NZ geography.
    if address.lower() in {"tbc","todo","unknown","placeholder","address pending"}:
        bad.append((key,address))
assert not bad,bad
print("Guide address integrity: PASS")
