const pg = require("pg");
const express = require("express");
const client = new pg.Client(
  "postgres://Almig:Jodahoale3@@localhost/acme_icecream"
);

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies

// Function to create the flavors table
const createTable = async () => {
  try {
    await client.query(`
      DROP TABLE IF EXISTS flavors;
      CREATE TABLE flavors (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        is_favorite BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Flavors table created successfully.");
  } catch (error) {
    console.error("Error creating flavors table:", error.message);
  }
};

// Function to seed the flavors table with initial data
const seedFlavors = async () => {
  try {
    await client.query(`
      INSERT INTO flavors (name, is_favorite) VALUES
      ('Vanilla', true),
      ('Chocolate', false),
      ('Strawberry', false),
      ('Mint Chocolate Chip', true),
      ('Cookies and Cream', false);
    `);
    console.log("Base flavors seeded successfully.");
  } catch (error) {
    console.error("Error seeding flavors:", error.message);
  }
};

// Initialization function to create table, seed data, and start the server
const init = async () => {
  try {
    await client.connect();
    console.log("Connected to Database");

    await createTable(); // Creates the table if it doesn’t exist
    await seedFlavors(); // Seeds the table with initial data

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (error) {
    console.error("Failed to initialize the server:", error.message);
  }
};

// Route to get all flavors
app.get("/api/flavors", async (req, res) => {
  try {
    const result = await client.query("SELECT * FROM flavors");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Error fetching flavors" });
  }
});

// Route to get a single flavor by ID
app.get("/api/flavors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("SELECT * FROM flavors WHERE id = $1", [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error fetching flavor" });
  }
});

// Route to create a new flavor
app.post("/api/flavors", async (req, res) => {
  try {
    const { name, is_favorite } = req.body;
    const result = await client.query(
      "INSERT INTO flavors (name, is_favorite) VALUES ($1, $2) RETURNING *",
      [name, is_favorite]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error creating flavor" });
  }
});

// Route to delete a flavor by ID
app.delete("/api/flavors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await client.query("DELETE FROM flavors WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Error deleting flavor" });
  }
});

// Route to update a flavor by ID
app.put("/api/flavors/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_favorite } = req.body;
    const result = await client.query(
      "UPDATE flavors SET name = $1, is_favorite = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [name, is_favorite, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Flavor not found" });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Error updating flavor" });
  }
});


init();