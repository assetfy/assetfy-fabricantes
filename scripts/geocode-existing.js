/**
 * Migration script: Geocode existing representantes and registered products.
 *
 * For representantes: geocodes their `direccion` field using Nominatim.
 * For registered inventario: assigns CABA coordinates as placeholder
 *   (since existing records don't have address fields).
 *
 * Usage: node scripts/geocode-existing.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Representante = require('../models/representante.model');
const Inventario = require('../models/inventario.model');
const { geocodeAddress, CABA_COORDS } = require('../utils/geocoding');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/assetfy';

async function migrateRepresentantes() {
    const representantes = await Representante.find({
        $or: [
            { 'coordenadas.lat': null },
            { 'coordenadas.lng': null },
            { coordenadas: { $exists: false } }
        ],
        direccion: { $exists: true, $ne: '' }
    });

    console.log(`Found ${representantes.length} representantes without coordinates.`);

    let success = 0;
    let failed = 0;

    for (const rep of representantes) {
        try {
            console.log(`  Geocoding representante "${rep.nombre}": "${rep.direccion}"...`);
            const coords = await geocodeAddress(rep.direccion);
            if (coords) {
                rep.coordenadas = coords;
                await rep.save();
                console.log(`    -> ${coords.lat}, ${coords.lng}`);
                success++;
            } else {
                console.log(`    -> No coordinates found, skipping.`);
                failed++;
            }
        } catch (err) {
            console.error(`    -> Error: ${err.message}`);
            failed++;
        }
    }

    console.log(`Representantes: ${success} geocoded, ${failed} failed.\n`);
}

async function migrateInventario() {
    const inventarios = await Inventario.find({
        registrado: 'Si',
        $or: [
            { 'comprador.coordenadas.lat': null },
            { 'comprador.coordenadas.lng': null },
            { 'comprador.coordenadas': { $exists: false } }
        ]
    });

    console.log(`Found ${inventarios.length} registered products without coordinates.`);

    let updated = 0;

    for (const inv of inventarios) {
        try {
            // If they have an address, try to geocode it; otherwise use CABA default
            if (inv.comprador?.direccion && inv.comprador?.provincia) {
                const coords = await geocodeAddress(inv.comprador.direccion, inv.comprador.provincia);
                inv.comprador.coordenadas = coords || CABA_COORDS;
            } else {
                // No address on file — assign CABA as placeholder
                inv.comprador.coordenadas = CABA_COORDS;
                if (!inv.comprador.direccion) {
                    inv.comprador.direccion = '';
                }
                if (!inv.comprador.provincia) {
                    inv.comprador.provincia = 'Ciudad Autónoma de Buenos Aires';
                }
            }
            await inv.save();
            updated++;
        } catch (err) {
            console.error(`  Error updating inventario ${inv.idInventario}: ${err.message}`);
        }
    }

    console.log(`Inventario: ${updated} updated with coordinates.\n`);
}

async function main() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.\n');

        console.log('=== Migrating Representantes ===');
        await migrateRepresentantes();

        console.log('=== Migrating Registered Products ===');
        await migrateInventario();

        console.log('Migration complete!');
    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB.');
    }
}

main();
