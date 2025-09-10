# D&D Calendar - Claude Notes

## Port Configuration
- **Backend**: Port 3002 ✅ 
- **Frontend**: Port 3002 ✅ (cal.catto.at - NICHT 3000!)
- Port 3000 ist für cat.catto.at reserviert

## Commands
- Backend starten: `./backend/start-server.sh` (mit PM2 Auto-Restart) oder `cd backend && PORT=3002 npm start`
- Frontend starten: `cd frontend && PORT=3002 npm start`
- Server Status: `pm2 status`
- Server Logs: `pm2 logs dnd-calendar-backend`

## Sprachen
Aktuell verfügbare Fantasy-Sprachen:
- Infernal 🔥: Azrath, Sorzul, Vezthar, Mangrath, Drakthul, Umveth, Zeyror, Nexrath
- Dwarven ⛏️: Aurgrim, Soldrak, Wisdrom, Mangar, Draktor, Umkil, Leybrun, Nexdorn
- Common 🌍: Auronday, Sonday, Wisday, Mansday, Darkday, Umday, Leyday, Nextday
- Elvish 🧝: Auro'dae, Sol'dae, Wis'dae, Man'dae, Drak'dae, Um'dae, Ley'dae, Nex'dae