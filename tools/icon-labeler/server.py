#!/usr/bin/env python3
"""Servidor local do labeler de ícones de ação (só biblioteca padrão), irmão do labeler de expressões.

Uso (da raiz do repo):  python3 tools/icon-labeler/server.py [porta]
Abra http://127.0.0.1:5174

Antes, recorte os ícones: .venv/bin/python scripts/extract_action_icons.py

- Serve index.html e os recortes de assets/action-icons.
- GET  /api/data   -> manifest + labels salvos
- POST /api/labels -> grava assets/action-icons/labels.json (escrita atômica)
Escuta só em 127.0.0.1.
"""
import json, mimetypes, os, sys, tempfile
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import unquote, urlparse

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
ICONS = os.path.join(ROOT, 'assets', 'action-icons')
MANIFEST = os.path.join(ICONS, 'manifest.json')
LABELS = os.path.join(ICONS, 'labels.json')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5174


def read_json(path, default):
    try:
        with open(path, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return default


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype='application/json; charset=utf-8'):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode('utf-8')
        elif isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        self.wfile.write(body)

    def _static(self, base, rel):
        path = os.path.abspath(os.path.join(base, rel))
        if not path.startswith(base + os.sep) or not os.path.isfile(path):
            return self._send(404, {'error': 'not found'})
        ctype = mimetypes.guess_type(path)[0] or 'application/octet-stream'
        with open(path, 'rb') as f:
            data = f.read()
        self._send(200, data, ctype)

    def do_GET(self):
        p = unquote(urlparse(self.path).path)
        if p in ('/', '/index.html'):
            return self._static(HERE, 'index.html')
        if p == '/api/data':
            return self._send(200, {'manifest': read_json(MANIFEST, {'icons': []}), 'labels': read_json(LABELS, {})})
        if p.startswith('/icons/'):
            return self._static(ICONS, p[len('/icons/'):])
        self._send(404, {'error': 'not found'})

    def do_POST(self):
        if urlparse(self.path).path != '/api/labels':
            return self._send(404, {'error': 'not found'})
        try:
            n = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(n))
            if not isinstance(data, dict) or not all(isinstance(v, str) for v in data.values()):
                raise ValueError('labels must map icon id -> meaning')
        except Exception as e:  # noqa: BLE001
            return self._send(400, {'error': str(e)})
        fd, tmp = tempfile.mkstemp(dir=ICONS, suffix='.tmp')
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=1, ensure_ascii=False, sort_keys=True)
        os.replace(tmp, LABELS)
        self._send(200, {'ok': True})

    def log_message(self, *args):
        pass


if __name__ == '__main__':
    if not os.path.isfile(MANIFEST):
        sys.exit(f'manifest não encontrado: {MANIFEST}\nRode antes: .venv/bin/python scripts/extract_action_icons.py')
    print(f'Labeler de ícones em http://127.0.0.1:{PORT}  (Ctrl+C para sair)')
    ThreadingHTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
