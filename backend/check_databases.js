require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin_samet:r3r3EJlfhULHw74wrR66@194.146.36.252:27017/sufyan-yaprak?authSource=admin";

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB.");
    
    // Get list of all databases
    const adminDb = mongoose.connection.db.admin();
    const dbsList = await adminDb.listDatabases();
    
    console.log("\nDatabases on the server:");
    dbsList.databases.forEach(db => {
      console.log(` - ${db.name} (Size: ${db.sizeOnDisk} bytes)`);
    });

    console.log("\nScanning all databases for 'kimmer7li' or 'daflongbahceseti' or 'KİMMER'...");

    for (const dbInfo of dbsList.databases) {
      const dbName = dbInfo.name;
      // Skip system databases
      if (['admin', 'local', 'config'].includes(dbName)) continue;

      try {
        const dbConnection = mongoose.connection.useDb(dbName);
        
        // Find collections in this database
        const collections = await dbConnection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        
        console.log(`\nScanning Database: [ ${dbName} ]`);

        // Check LeafPages / pages
        const leafPageColName = collectionNames.find(name => name.toLowerCase().includes('leafpage') || name.toLowerCase().includes('page'));
        if (leafPageColName) {
          const col = dbConnection.model('TempLeafPage_' + dbName, new mongoose.Schema({}, { strict: false }), leafPageColName);
          const match = await col.findOne({
            $or: [
              { slug: { $regex: /k.mmer/i } },
              { name: { $regex: /k.mmer/i } },
              { productName: { $regex: /k.mmer/i } },
              { slug: { $regex: /daflong/i } }
            ]
          });
          if (match) {
            console.log(`  🎉 FOUND MATCH in '${leafPageColName}' collection of '${dbName}':`);
            console.log(`     Slug: ${match.slug} | Name: ${match.name} | Product: ${match.productName}`);
          }
        }

        // Check Sites / sites
        const sitesColName = collectionNames.find(name => name.toLowerCase().includes('site'));
        if (sitesColName) {
          const col = dbConnection.model('TempSite_' + dbName, new mongoose.Schema({}, { strict: false }), sitesColName);
          const match = await col.findOne({
            $or: [
              { subdomain: { $regex: /k.mmer/i } },
              { name: { $regex: /k.mmer/i } },
              { subdomain: { $regex: /daflong/i } }
            ]
          });
          if (match) {
            console.log(`  🎉 FOUND MATCH in '${sitesColName}' collection of '${dbName}':`);
            console.log(`     Subdomain: ${match.subdomain} | Name: ${match.name}`);
          }
        }

      } catch (err) {
        console.error(`  Error scanning ${dbName}:`, err.message);
      }
    }

    process.exit(0);
  })
  .catch((err) => {
    console.error("DB Connection Error:", err);
    process.exit(1);
  });
