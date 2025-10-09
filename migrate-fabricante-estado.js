// migrate-fabricante-estado.js
// Migration script to update fabricante estado from 'Activado' to 'Habilitado'

const mongoose = require('mongoose');
require('dotenv').config();

const Fabricante = require('./models/fabricante.model');

const migrateEstados = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Update all fabricantes with estado 'Activado' to 'Habilitado'
    const resultActivado = await Fabricante.updateMany(
      { estado: 'Activado' },
      { $set: { estado: 'Habilitado' } }
    );
    console.log(`✅ Updated ${resultActivado.modifiedCount} fabricantes from 'Activado' to 'Habilitado'`);

    // Update all fabricantes with estado 'Desactivado' to 'Deshabilitado'
    const resultDesactivado = await Fabricante.updateMany(
      { estado: 'Desactivado' },
      { $set: { estado: 'Deshabilitado' } }
    );
    console.log(`✅ Updated ${resultDesactivado.modifiedCount} fabricantes from 'Desactivado' to 'Deshabilitado'`);

    // Show final count
    const habilitados = await Fabricante.countDocuments({ estado: 'Habilitado' });
    const deshabilitados = await Fabricante.countDocuments({ estado: 'Deshabilitado' });
    console.log(`\n📊 Final state:`);
    console.log(`   - Habilitado: ${habilitados}`);
    console.log(`   - Deshabilitado: ${deshabilitados}`);

    mongoose.connection.close();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
};

migrateEstados();
