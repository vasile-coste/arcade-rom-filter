const Express = require('express');
const fileUpload = require('express-fileupload');
const http = require('http');
const path = require('path');

const opn = require('open');
const pf = require('portfinder');
const { argv } = require('process');
const { WebSocketServer } = require('ws');

let bodyParser = require('body-parser');

// include scripts
const { CheckFiles, FilterMame, CopyRoms } = require('./events/index.js');

// creat app
const app = Express();

const server = http.createServer(app);
const wsServer = new WebSocketServer({ server });

app.use(fileUpload());
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.use(Express.static(path.join(__dirname, 'public')));

app.post('/checkFile', function (req, res) {
  const data = CheckFiles(req.body.emulator, __dirname);
  res.send(data);
});

app.post('/upload-file', function (req, res) {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  const file = req.files.file;
  const ext = file.name.split(".");
  const fileName = req.body.emulator + '.' + ext[ext.length - 1];
  const uploadPath = __dirname + '/' + fileName;

  // Use the mv() method to place the file somewhere on your server
  file.mv(uploadPath, function (err) {
    if (err) {
      console.log(err)
      return res.status(500).send(err);
    }
    console.log(`Uploaded file ${file.name} to ${fileName}`)

    res.send(fileName);
  });
});

const open = async (PORT) => {
  opn(`http://localhost:${PORT}`);
};

const listen = (PORT) => {
  server.listen(PORT, () => {
    if (argv.includes('--no-open')) {
      console.log(`The webserver is now running at http://localhost:${PORT}`);
    } else {
      console.log('The webserver is now running!');
      try {
        console.log('Opening the app in the default browser...');
        open(PORT);
        console.log('Done. Check if a browser window has opened');
      } catch (e) {
        console.log(`Failed. Open up http://localhost:${PORT} manually in your browser.`);
      }
    }
  });
};

// exit app
const cleanExit = async (svr) => {
  console.log('Killing any dangling processes...');
  console.log('Stopping the server...');
  svr.close(() => console.log('Done'));
  setTimeout(() => process.exit(0), 2500);
};

// start app
pf.getPortPromise()
  .then((port) => {
    console.log(`Listening at port ${port}`);
    listen(port);
  })
  .catch((err) => {
    console.log(`Unable to determine free ports.\nReason: ${err}`);
    console.log('Falling back to 8080.');
    listen(8080);
  });

process.on('uncaughtException', (reason) => {
  console.log(`An error occured.\n${reason.stack}`);
});

process.on('unhandledRejection', (reason) => {
  console.log(`An error occured.\n${reason.stack}`);
});

process.on('SIGTERM', () => cleanExit(server));


wsServer.on('connection', (ws) => {
  ws.on('message', async (msg) => {
    /** @type {Record<string, any>} */
    const message = JSON.parse(msg);

    // Theres no file handler, soo...

    switch (message.event) {
      case 'filterMame':
        await FilterMame(message.data, path.join(__dirname), ws);;
        break;
      case 'copyRoms':
        await CopyRoms(message.data, path.join(__dirname), ws);;
        break;
      case 'exit':
        process.kill(process.pid, 'SIGTERM');
    }
  });
});