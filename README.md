## Archivos necesarios para levantar el proyecto

1. El archivo `.env`**copiar y pegar en la raíz del proyecto (junto a `docker-compose.yml`).
2. El archivo `backup_kernotec.sql`: La base de datos. Pégarlo también junto a la raíz.
3. La carpeta con las imágenes: Pegar las imágenes dentro de `backend/public/uploads/`.
4. tener Docker Desktop** abierto y ejecutándose.

## Pasos para levantar el proyecto

### Paso 1: Levantar solo la base de datos
docker-compose up -d postgres

### Paso 2: Pasar la base de datos a Docker
docker cp backup_kernotec.sql kernotec_postgres:/backup_kernotec.sql

### Paso 3: importar la base de datos
docker exec -it kernotec_postgres psql -U strapi -d kernotec_cms -f /backup_kernotec.sql

### Paso 4: Levantar el Backend y Frontend
docker-compose up -d --build

**Para poder ver el proyecto**
- Sitio Web (Frontend):**(http://localhost:3000)
- Panel de Admin (Strapi):** (http://localhost:1337/admin)


## Manejo de Imágenes

### Inyectar imágenes 
docker cp backend/public/uploads/. kernotec_strapi:/srv/app/public/uploads/

## Extraer imágenes 
docker cp kernotec_strapi:/srv/app/public/uploads/. backend/public/uploads/
