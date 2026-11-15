#!/bin/sh
# Baixa scripts Lua e banco de cartas do ProjectIgnis (código aberto) para raw/data.
set -e
cd "$(dirname "$0")/.."; mkdir -p raw/data; cd raw/data
[ -d CardScripts ] || git clone --depth 1 https://github.com/ProjectIgnis/CardScripts.git
[ -d BabelCDB ] || git clone --depth 1 https://github.com/ProjectIgnis/BabelCDB.git
