const { MongoClient } = require("mongodb");

async function dropAllIndexes() {
  const client = new MongoClient(
    "mongodb+srv://shadafunmi421:P6iCaCfKNOxkZ7v4@apicluster.z36wa.mongodb.net/?retryWrites=true&w=majority&appName=apicluster",
    {
      useUnifiedTopology: true,
    }
  );

  try {
    // Connect to the MongoDB client
    await client.connect();

    // Fetch the first database name dynamically
    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    const dbName = databases.databases[0].name; // Fetch the first database (or customize selection)
    console.log("Using database:", dbName);

    const db = client.db(dbName);
    const users = db.collection("users");

    // Get all indexes
    const indexes = await users.indexes();
    console.log("Current indexes:", indexes);

    // Drop all indexes except for the default _id index
    for (let index of indexes) {
      if (index.name !== "_id_") {
        console.log(`Dropping index: ${index.name}`);
        await users.dropIndex(index.name);
      }
    }

    // Verify indexes after dropping
    const updatedIndexes = await users.indexes();
    console.log("Indexes after dropping:", updatedIndexes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    // Close the MongoDB client connection
    await client.close();
  }
}

async function dropUsernameIndex() {
  const client = new MongoClient(
    "mongodb+srv://shadafunmi421:P6iCaCfKNOxkZ7v4@apicluster.z36wa.mongodb.net/?retryWrites=true&w=majority&appName=apicluster",
    { useUnifiedTopology: true }
  );

  try {
    await client.connect();

    const adminDb = client.db().admin();
    const databases = await adminDb.listDatabases();
    const dbName = databases.databases[0].name;

    const db = client.db(dbName);
    console.log(dbName); // Replace "test" with your actual database name
    const users = db.collection("users");

    // Drop the specific `username_1` index
    await users.dropIndex("username_1");
    console.log("Dropped `username_1` index.");

    // Verify remaining indexes
    const indexes = await users.indexes();
    console.log("Indexes after dropping:", indexes);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.close();
  }
}

dropUsernameIndex();

// Run the function
dropAllIndexes();
