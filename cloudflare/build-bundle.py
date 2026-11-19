from pathlib import Path
import json,base64
root=Path(__file__).resolve().parents[1]
mimes={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.webmanifest':'application/manifest+json; charset=utf-8','.png':'image/png'}
a={}
for f in ('index.html','styles.css','app.js','config.js','sw.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'):
 p=root/f;a['/'+f]=[mimes[p.suffix],base64.b64encode(p.read_bytes()).decode()]
worker=(root/'cloudflare/worker.js').read_text().split('\n',1)[1]
compiled='const ASSETS = '+json.dumps(a,separators=(',',':'))+';\n'+worker
(root/'cloudflare/worker-bundled.js').write_text(compiled)
(root/'_worker.js').write_text(compiled)
print(len(compiled))