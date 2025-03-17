const xlsx = require('xlsx');
const Dataset = require('../models/dataset'); // Adjust the path to your model
const Log = require('../models/log'); // Adjust the path to your model
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Set up multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Set the destination directory for uploaded files
  },
  filename: (req, file, cb) => {
    // Extract the file extension from the original filename
    const extension = path.extname(file.originalname);
    // Set the filename to "dataset" with the original file's extension
    cb(null, `dataset${extension}`);
  }
});

// Function to clear the uploads directory
const clearUploadsDirectory = () => {
  const directory = 'uploads/';
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), err => {
        if (err) throw err;
      });
    }
  });
};

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });
// In-memory progress tracking (volatile, will reset if server restarts)
let clients = [];
let importProgress = {
  totalItems:0,
  processed: 0
};

// SSE endpoint
const events = (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
};

const sendProgressUpdate = () => {
 
  clients.forEach(client => client.write(`data: ${JSON.stringify({  processed: importProgress.processed,totalItems:importProgress.totalItems })}\n\n`));
};

const importExcelData = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'No file uploaded' });
    }

    const file = req.file;

    if (file.size === 0) {
      return res.status(400).json({ status: 'error', message: 'Uploaded file is empty' });
    }

    // Process file to get total count
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    let data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No data found in the uploaded file' });
    }
    await Dataset.deleteMany({});
    data = data.filter(item => item.id && item.name && item.schema);

    // Save log entry


    importProgress.processed = 0;

    // Define chunk size
    const chunkSize = 8000; // Adjust chunk size as needed

    // Function to process each chunk
    const processChunk = async (chunk) => {
      await Dataset.insertMany(chunk);
      importProgress.processed += chunk.length; // Update processed count
      importProgress.totalItems =data.length; // Update processed count
      sendProgressUpdate(); // Send progress update
    };

    // Process data in chunks
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await processChunk(chunk);
    }


    res.status(200).json({ status: 'success', message: 'Data imported successfully!' });

  } catch (error) {
    console.error('Error importing data:', error);
    res.status(500).json({ status: 'error', message: 'Error importing data' });
  }
};

const saveLog=async(req,res)=>{
  const { fileName ,totalItems} = req.body;

  try {
    const logEntry = new Log({
      fileName:fileName ,
      numberOfItems: totalItems,
      uploadedAt: new Date()
    });
    await logEntry.save();
    res.status(200).json({ status: 'success', message: 'Log Saved successfully!' });
  }
  catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching data' });
  }
}

const searchData = async (req, res) => {
  const { sortBy, orderBy, page = 1, pageSize, searchText, country, schema } = req.body;

  try {
    const query = {};

    if (searchText) {
      query.$or = [
        { name: new RegExp(searchText, 'i') },
        { aliases: new RegExp(searchText, 'i') }
      ];
    }

    if (country && country.length > 0 && country[0] !== 'All') {
      query.countries = { $in: country.map(c => new RegExp(`\\b${c}\\b`, 'i')) };
    }

    if (schema && schema.length > 0 && schema[0] !== 'All') {
      query.schema = { $in: schema.map(s => new RegExp(`^${s}$`, 'i')) };
    }

    const totalItems = await Dataset.countDocuments(query);
    let dataQuery = Dataset.find(query)
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    dataQuery = dataQuery.sort({ [sortBy]: orderBy.toLowerCase() === 'asc' ? 1 : -1 });

    const data = await dataQuery;

    res.status(200).json({
      status: 'success',
      data,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching data' });
  }
};

const getAllLogs = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    const totalItems = await Log.countDocuments();
    const logs = await Log.find()
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    res.status(200).json({
      status: 'success',
      data: logs,
      pagination: {
        totalItems,
        totalPages: Math.ceil(totalItems / pageSize),
        currentPage: page
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ status: 'error', message: 'Error fetching logs' });
  }
};

module.exports = { upload,clearUploadsDirectory, importExcelData,searchData,saveLog ,getAllLogs,events};