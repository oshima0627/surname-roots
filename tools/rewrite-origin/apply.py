# out-*.json の origin を src/data/surnames/<slug>.json に書き戻す。
# ファイルの整形（CRLF・2スペース・配列の1行書き）を壊さないよう、origin 行だけを文字列置換する。
import json,glob,sys,re
S=sys.argv[1]; dry='--dry' in sys.argv
n=0
for f in sorted(glob.glob(f'{S}/out-*.json')):
    for it in json.load(open(f,encoding='utf-8')):
        p=f"src/data/surnames/{it['slug']}.json"
        raw=open(p,'rb').read().decode('utf-8')
        m=re.search(r'^(  "origin": )(".*")(,?)\r?$', raw, re.M)
        assert m, p
        old=json.loads(m.group(2)); new=it['origin'].strip()
        if old==new: continue
        newraw=raw[:m.start(2)]+json.dumps(new,ensure_ascii=False)+raw[m.end(2):]
        if not dry: open(p,'wb').write(newraw.encode('utf-8'))
        n+=1
print(('dry-run ' if dry else '')+f'updated {n}')
