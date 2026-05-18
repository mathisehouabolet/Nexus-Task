require('dotenv').config();
const { MongoClient } = require('mongodb');

const LOCAL_URI = 'mongodb://localhost:27017';
const LOCAL_DB_NAME = 'todolisting';
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('Error: MONGODB_URI is not defined in your .env file');
  process.exit(1);
}

async function migrate() {
  let localClient;
  let atlasClient;

  try {
    console.log('Connecting to local MongoDB (localhost:27017)...');
    localClient = await MongoClient.connect(LOCAL_URI);
    const localDb = localClient.db(LOCAL_DB_NAME);
    console.log('Connected to local MongoDB successfully!');

    console.log('Connecting to MongoDB Atlas...');
    atlasClient = await MongoClient.connect(ATLAS_URI);
    const atlasDb = atlasClient.db(); 
    console.log(`Connected to MongoDB Atlas (DB: ${atlasDb.databaseName}) successfully!`);

    const collections = ['users', 'projects', 'tasks', 'activities'];

    for (const colName of collections) {
      console.log(`\nProcessing collection: ${colName}...`);
      
      const localColl = localDb.collection(colName);
      const atlasColl = atlasDb.collection(colName);

      // Fetch all local documents
      const docs = await localColl.find({}).toArray();
      console.log(`Found ${docs.length} documents in local collection '${colName}'`);

      // Clear the target Atlas collection to avoid duplicates
      console.log(`Clearing collection '${colName}' on Atlas...`);
      await atlasColl.deleteMany({});

      if (docs.length > 0) {
        console.log(`Migrating ${docs.length} documents to Atlas...`);
        const result = await atlasColl.insertMany(docs);
        console.log(`Successfully migrated ${result.insertedCount} documents!`);
      } else {
        console.log('Nothing to migrate (collection is empty).');
      }
    }

    console.log('\nMigration completed successfully! 🎉');
  } catch (err) {
    console.error('Migration failed with error:', err.message);
  } finally {
    if (localClient) await localClient.close();
    if (atlasClient) await atlasClient.close();
  }
}

migrate();
