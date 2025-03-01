app.post('/upload', isAuthenticated, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'ews', maxCount: 1 },
  { name: 'caste', maxCount: 1 },
  { name: 'gate', maxCount: 1 }
]), async (req, res) => {
  const files = req.files;
  const verificationResults = {};
  const userName = req.session.user.name;

  for (const [fieldName, fileArray] of Object.entries(files)) {
    for (const file of fileArray) {
      try {
        let textContent = null;

        if (file.mimetype === 'application/pdf') {
          textContent = await convertPdfToText(file.path);
        } else if (file.mimetype.startsWith('image/')) {
          textContent = await convertImageToText(file.path);
        } else {
          verificationResults[fieldName] = { verified: false, message: 'Unsupported file format' };
          continue;
        }

        const contentVerification = verifyTextContent(textContent);
        const nameVerification = await verifyNameInText(userName, textContent);

        if (contentVerification && nameVerification) {
          verificationResults[fieldName] = { verified: true, message: 'File verified successfully' };
          // Move the file to a permanent location
          const finalPath = path.join(__dirname, 'uploads', file.filename);
          fs.renameSync(file.path, finalPath);
        } else {
          verificationResults[fieldName] = { verified: false, message: 'File failed verification' };
          // Optionally, delete the temporary file
          fs.unlinkSync(file.path);
        } 
      } catch (error) {
        console.error(`Error processing ${file.fieldname}:`, error);
        verificationResults[fieldName] = { verified: false, message: 'Error processing file' };
      }
    }
  }

  const allVerified = Object.values(verificationResults).every(result => result.verified);

  res.json({
    message: allVerified ? 'Files uploaded and verified successfully' : 'Some files failed verification',
    verificationResults: verificationResults
  });
});