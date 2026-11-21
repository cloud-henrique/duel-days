# Spec Delta

## ADDED Requirements

### Requirement: Entrada dos personagens em cena
Um personagem SHALL entrar em cena só esmaecendo, sem se deslocar na vertical, e só na primeira aparição dele no
encontro (ou na cena avulsa); nas fases seguintes ele SHALL já estar em cena. A troca de expressão SHALL trocar só o
rosto, sem animação. Quando o jogador entra em cena, o duelista SHALL continuar deslizando do centro para o lado dele.

#### Scenario: Entrada esmaecendo
- **WHEN** o jogador encontra a Tea
- **THEN** a Tea aparece no palco esmaecendo, no lugar final dela, sem subir de baixo

#### Scenario: Troca de expressão
- **WHEN** a fala seguinte do Joey tem outra expressão
- **THEN** só o rosto do Joey muda, sem animação, e o corpo fica parado

#### Scenario: Mudança de fase do encontro
- **WHEN** o jogador escolhe Conversar depois da saudação, ou a fala de antes do duelo começa depois do menu
- **THEN** o duelista continua em cena sem sumir nem entrar de novo, mesmo que a nova fala tenha outra expressão

#### Scenario: Jogador entra em cena
- **WHEN** a primeira fala do jogador aparece numa cena em que o duelista estava sozinho
- **THEN** o avatar do jogador aparece esmaecendo e o duelista desliza do centro para o lado dele
