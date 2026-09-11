import json,glob,sys,os
S=sys.argv[1]
files=sorted(glob.glob('src/data/surnames/*.json'))
items=[]
for f in files:
    d=json.load(open(f,encoding='utf-8'))
    if '名字由来' in d['origin'] or '語源辞典' in d['origin'] or 'ウィキペディア' in d['origin'] or 'myoji-yurai' in d['origin']:
        items.append({'slug':d['slug'],'kanji':d['kanji'],'origin':d['origin']})
print('targets',len(items))
n=8; size=(len(items)+n-1)//n
for i in range(n):
    chunk=items[i*size:(i+1)*size]
    json.dump(chunk,open(f'{S}/in-{i+1}.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
    print(f'in-{i+1}.json',len(chunk))
