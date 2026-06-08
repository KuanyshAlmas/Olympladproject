# Railway deploy

Бұл жоба Railway-де бір сервис ретінде жұмыс істейді: Django API, WebSocket және React/Vite frontend бір контейнерден беріледі. Деректер жоғалмауы үшін production-да SQLite емес, Railway PostgreSQL қолдану керек.

## 1. Railway services

1. Railway-де жаңа Project ашыңыз.
2. `PostgreSQL` service қосыңыз.
3. Осы репозиторийден app service қосыңыз.
4. App service variables:

```text
DEBUG=False
SECRET_KEY=<ұзын random secret>
DATABASE_URL=${{Postgres.DATABASE_URL}}
PERPLEXITY_API_KEY=<Perplexity API key>
TIME_ZONE=Asia/Almaty
MEDIA_ROOT=/data/media
```

Егер event poster сияқты upload файлдарды жоғалтпау керек болса, app service-ке Volume қосып, mount path ретінде `/data` қойыңыз. Database деректері PostgreSQL-де сақталады, upload файлдар Volume-де сақталады.

## 2. Deploy

Railway `Dockerfile` арқылы build жасайды:

1. Frontend build: `npm ci && npm run build`
2. Python dependencies install
3. `collectstatic`
4. Start кезінде:

```bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
daphne -b 0.0.0.0 -p "$PORT" config.asgi:application
```

## 3. Local SQLite деректерін Railway PostgreSQL-ге көшіру

Алдымен local backup жасаңыз:

```bash
venv/bin/python manage.py dumpdata --natural-foreign --natural-primary --exclude contenttypes --exclude auth.permission --indent 2 > backup.json
```

Содан кейін Railway PostgreSQL-дің public connection URL-ын алыңыз. Railway Postgres service ішінде `Connect` бөлімінен public `DATABASE_URL` көшіріңіз де local terminal-да production database-ке жүктеңіз:

```bash
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:PORT/DBNAME'
export DEBUG=False
venv/bin/python manage.py migrate --noinput
venv/bin/python manage.py loaddata backup.json
```

Осыдан кейін app қайта deploy болса да деректер PostgreSQL-де қалады.

## 4. Backups

Production үшін Railway PostgreSQL service ішінде native Backups қосуды ұмытпаңыз. Deploy app контейнерін қайта жасайды, бірақ PostgreSQL service және оның backups бөлек сақталады.
