# Peter

> calm work tracking

Peter is a project management tool. It created for speed, simplicity, and customization. You will find it boring and that is intentionally. I don't want you to fall in love with this tool. Peter is a tool that serve its purpose and don't come between you and your work.

The application is created using traditional and proven MVC architecture. Following are list of major technologies used while creating this application. Refer the wiki for more details.

1. Node (v24)
2. npm (v11)
3. PostgreSQL (v17)
4. Redis (v8)
5. Express (v4)
6. Pug
7. Unpoly (v3)

### Setup

1. Clone the repo.

```bash
git clone https://github.com/chauhankiran/peter
```

2. `cd` into it.

```bash
cd peter
```

3. Install the dependencies.

```bash
npm i
```

4. Copy the `.env.example` and make the `.env` file.

```bash
cp .env.example .env
```

5. Adjust the environment variables within created `.env` file.
6. Create a database with name `peter` or whatever you define in `.env` file.
7. Run migrations.

```bash
npm run migrate
```

8. Run the application.

```bash
npm start

# OR

npm run dev
```

9. Open http://localhost:3000 and have fun!
