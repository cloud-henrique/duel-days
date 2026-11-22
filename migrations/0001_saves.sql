-- O save de cada jogador (change save-na-nuvem). Uma linha por e-mail; `data` nulo é a lápide de "Apagar progresso".
CREATE TABLE saves (
  email      TEXT PRIMARY KEY,
  rev        INTEGER NOT NULL,
  version    INTEGER NOT NULL,
  data       TEXT,
  device     TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- As versões substituídas, apagadas ou descartadas num conflito (as 10 últimas de cada jogador).
CREATE TABLE save_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  email      TEXT NOT NULL,
  rev        INTEGER NOT NULL,
  version    INTEGER NOT NULL,
  data       TEXT,
  device     TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  reason     TEXT NOT NULL
);
CREATE INDEX save_history_email ON save_history (email, id);
