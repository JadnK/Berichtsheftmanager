# Berichtsheftmanager

Der **Berichtsheftmanager** ist eine Web-Anwendung zur digitalen Verwaltung von Ausbildungs-Berichtsheften.  
Ziel ist es, Wochenberichte strukturiert, übersichtlich und zentral zu erfassen.

---

## Features

- Digitale Verwaltung von Berichtsheften
- Strukturierte Einträge (z. B. Tätigkeiten, Notizen)
- Moderne Web-Oberfläche
- Docker-kompatibel
- MySQL-Datenbank
- Anbindung an die OpenAI API

---

## Tech-Stack

- Next.js  
- TypeScript  
- Prisma  
- MySQL  
- Docker (optional)  
- Caddy (optional, Reverse Proxy)

---

## Voraussetzungen

- Node.js (LTS empfohlen)
- npm
- MySQL-Datenbank
- OpenAI API Key

---

## Konfiguration (.env)

Das Projekt benötigt zwingend eine `.env` Datei im Projekt-Root.

### Benötigte Environment-Variablen

    OPENAI_API_KEY=dein_openai_api_key
    DATABASE_URL="mysql://USER:PASSWORT@HOST:PORT/DATENBANK"

### Wichtiger Hinweis für Docker

Wenn du Docker verwendest und deine MySQL-Datenbank **nicht im selben Container** läuft, muss als Host folgender Wert genutzt werden:

    host.docker.internal

Beispiel:

    DATABASE_URL="mysql://USER:PASSWORT@host.docker.internal:3306/DATENBANK"

---

## Installation mit Docker (empfohlen)

### Container starten

    docker compose up -d --build


Die Anwendung ist anschließend erreichbar unter:

    http://localhost:4200

---

## Installation ohne Docker (lokal)

### Schritte

    npm install
    npm run db:generate
    npm run db:push
    npm run dev

Danach läuft die App unter:

    http://localhost:4200

---

## Prisma & Datenbank

- npm run db:generate  
  Generiert den Prisma Client

- npm run db:push  
  Überträgt das Schema in die MySQL-Datenbank (ideal für Development)

---

## Linting

    npm run dev
