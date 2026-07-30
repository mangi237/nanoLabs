// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const BusBoy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

admin.initializeApp();

exports.uploadImage = functions.https.onRequest((req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const busboy = BusBoy({ headers: req.headers });
  const tmpdir = os.tmpdir();
  const uploads = {};
  const fields = {};

  busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const filepath = path.join(tmpdir, filename);
    uploads[fieldname] = { file: filepath, mimetype };
    file.pipe(fs.createWriteStream(filepath));
  });

  busboy.on('field', (fieldname, val) => {
    fields[fieldname] = val;
  });

  busboy.on('finish', async () => {
    try {
      const bucket = admin.storage().bucket();
      const imageFile = uploads.image;
      
      if (!imageFile) {
        return res.status(400).send('No image file provided');
      }

      const filename = `patients/${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const file = bucket.file(filename);

      await file.save(fs.readFileSync(imageFile.file), {
        metadata: {
          contentType: imageFile.mimetype,
        },
      });

      // Make the file public
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      
      res.status(200).json({ imageUrl: publicUrl });
    } catch (error) {
      console.error('Error uploading image:', error);
      res.status(500).send('Error uploading image');
    } finally {
      // Clean up temporary files
      Object.values(uploads).forEach(upload => {
        fs.unlinkSync(upload.file);
      });
    }
  });

  busboy.end(req.rawBody);
});