// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');
const express = require('express');

const app = express();

app.get('/audio/:fileName', (req, res) => {
  res.contentType('audio/mpeg3');
  res.download(path.join(__dirname, '../dist', req.path), req.params.fileName);
});

app.use(
  express.static('dist', {
    maxAge: 1000 * 60 * 60 * 24
  })
);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Express server started.');
});
