# Organigramm – Katholische Kirche (PostgreSQL + Node.js)

Dieses Projekt erstellt ein Organigramm der katholischen Kirche
(Papst, Kardinal, Erzbischof, Bischof, Pfarrer, Diakon, Gläubige/r)
aus einer PostgreSQL-Datenbank.

Es werden zwei Grafik-Dateien erzeugt:

- kirche.svg
- kirche.png

---

## 1. Projektinhalt

Im Projektordner liegen u. a.:

- schema.sql – Datenbankschema 
- index.js – Node.js-Script, das die Grafik erzeugt
- README.md – diese Anleitung
- package.json – npm-Konfiguration
- kirche.svg / kirche.png – bereits erzeugte Beispielgrafiken

---

## 2. Benötigte Tools

- Node.js (inkl. npm)
- PostgreSQL
- Linux/macOS Kommandozeile (oder WSL unter Windows)

---

## 3. Datenbank erstellen

1. PostgreSQL-Server starten.
2. Neue Datenbank anlegen (Name kann angepasst werden):

    createdb kirche

3. Schema und Daten aus schema.sql importieren:

    psql -d kirche -f schema.sql

Danach existiert die Tabelle roles mit folgender Hierarchie:

Papst → Kardinal → Erzbischof → Bischof → Pfarrer → Diakon → Gläubige/r

---

## 4. Node.js-Abhängigkeiten installieren

Im Projektordner:

    npm install pg sharp

Dadurch wird der node_modules-Ordner lokal neu angelegt.

---

## 5. Datenbank-Zugang konfigurieren

Die Verbindung zu PostgreSQL wird in index.js über Umgebungsvariablen konfiguriert:

    const client = new Client({
      host: process.env.PGHOST || "localhost",
      port: process.env.PGPORT || 5432,
      user: process.env.PGUSER || "postgres",
      password: process.env.PGPASSWORD || "",
      database: process.env.PGDATABASE || "kirche"
    });

### Linux / macOS (Beispiel)

    export PGHOST=localhost
    export PGUSER=postgres
    export PGPASSWORD=IHR_POSTGRES_PASSWORT
    export PGDATABASE=kirche

### Windows PowerShell (Beispiel)

    $env:PGHOST="localhost"
    $env:PGUSER="postgres"
    $env:PGPASSWORD="IHR_POSTGRES_PASSWORT"
    $env:PGDATABASE="kirche"

Benutzername, Passwort und Datenbankname können je nach Installation angepasst werden.

---

## 6. Script ausführen

Im Projektordner:

    node index.js

Das Script:

1. verbindet sich mit der PostgreSQL-Datenbank,
2. liest alle Rollen aus der Tabelle roles,
3. baut daraus eine Baumstruktur (Papst oben, dann Kardinal, …),
4. erzeugt eine SVG-Grafik kirche.svg,
5. konvertiert die SVG zusätzlich in eine PNG-Grafik kirche.png.

Die bereits vorhandenen kirche.svg / kirche.png können dabei überschrieben oder als Referenz verwendet werden.
