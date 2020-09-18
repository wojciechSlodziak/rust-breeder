import express, { static } from 'express';
const app = express();

app.use(static('dist'));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log('Express server started.');
});
