# MAASIN TOUR GUIDE — Express Backend Starter

This starter sets up an Express API connected to MongoDB. It begins with the requested GET endpoints:

- `GET /api/spots` — list tourist spots, with optional search/filter/sort/pagination.
- `GET /api/spots/:id` — get one tourist spot by MongoDB ObjectId.
- `GET /api/health` — check that the API is running.

Authentication pages and authentication routes are not included.

## Requirements

- Node.js 18 or newer
- npm
- MongoDB running locally, or a MongoDB Atlas connection string

## Setup

1. Open this folder in VS Code.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env`.
4. Set `MONGODB_URI` in `.env`:
   - Local MongoDB: `mongodb://127.0.0.1:27017/maasin_tour_guide`
   - Atlas: paste your Atlas connection string, replacing credentials/placeholders.
5. Start the API in development mode:

   ```bash
   npm run dev
   ```

6. Open `http://localhost:5000/api/health`.

## GET endpoint examples

### List all published spots

`GET http://localhost:5000/api/spots`

### Get one spot by ID

`GET http://localhost:5000/api/spots/REPLACE_WITH_MONGODB_OBJECT_ID`

The ID must be a real MongoDB ObjectId belonging to an existing record.

### Search spots

`GET http://localhost:5000/api/spots?search=church`

### Filter by category

`GET http://localhost:5000/api/spots?category=Nature`

### Sort and paginate

`GET http://localhost:5000/api/spots?sort=name_asc&page=1&limit=10`

### Include all statuses (for management UI)

`GET http://localhost:5000/api/spots?status=all`

## Example success response

```json
{
  "data": [],
  "pagination": {
    "total": 0,
    "page": 1,
    "limit": 20,
    "totalPages": 0
  }
}
```

`data` will be empty until records are inserted. The next development step is to add POST, PUT, and DELETE endpoints and then test them with Postman or Thunder Client.

## Important security note

The requested version has no authentication. Do not expose write endpoints publicly without adding an appropriate access-control strategy.
