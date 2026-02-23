// models/fabricante.model.js

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Generate a URL-safe slug from a string
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const fabricanteSchema = new Schema({
  razonSocial: { type: String, required: true, unique: true },
  cuit: { type: String, required: true, unique: true },
  // URL-safe slug for branded registration portal (e.g. /mi-fabricante)
  slug: { type: String, unique: true, sparse: true, lowercase: true },
  // Referencia al usuario que es el apoderado de esta empresa
  usuarioApoderado: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  // Referencias a usuarios que son administradores de esta empresa
  administradores: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],
  logo: { type: String },
  // Branding for the public registration portal
  portalLogo: {
    url: { type: String },
    key: { type: String },
    originalName: { type: String }
  },
  portalColor: { type: String, default: '#1a73e8' },
  estado: { type: String, enum: ['Habilitado', 'Deshabilitado'], default: 'Habilitado' }
}, {
  timestamps: true,
});

// Auto-generate slug from razonSocial before saving if slug is not set
fabricanteSchema.pre('save', async function (next) {
  if (!this.slug) {
    const baseSlug = generateSlug(this.razonSocial);
    let slug = baseSlug;
    let counter = 1;
    // Ensure uniqueness
    while (await mongoose.model('Fabricante').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  next();
});

const Fabricante = mongoose.model('Fabricante', fabricanteSchema);
module.exports = Fabricante;