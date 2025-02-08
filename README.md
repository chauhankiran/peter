# Peter

> Lightweight CRM System

**Currently under heavy development. Far from an alpha release.**

Peter is a CRM system for the small and medium sized businesses. The application is created using traditional and proven MVC architecture. Following are list of major technologies used while creating this application.

1. Node (`v22.13.1`)
2. Express (`v4.21.0`)
3. Postgres (`v15.10`)
4. Redis (`v7.4.2`)
5. Pug (`v3.0.3`)

## Getting Started

1. Clone the repo.

```
https://github.com/chauhankiran/peter.git
```

2. cd into it.

```
cd peter
```

3. Install the dependencies.

```
npm i
```

4. Copy the `.env.example` and make the `.env` file.

```
cp .env.example .env
```

5. Adjust the environment variables within created `.env` file.
6. Create a database with name `peter` or whatever you define in `.env` file.
7. Run migrations.

```
npm run migrate
```

8. Run seeders.

```
npm run seed
```

9. Run the application.

```
npm run dev
```

10. Open http://localhost:3000 and have fun!

## License

```
Peter
Copyright (C) 2025 Kiran Chauhan <kc@marichi.dev>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```
