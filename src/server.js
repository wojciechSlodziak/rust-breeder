// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');
const app = express();

app.use(
  express.static('dist', {
    maxAge: 1000 * 60 * 60 * 24
  })
);

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Express server started.');
});
