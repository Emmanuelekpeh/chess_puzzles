const express = require('express');
const komodoApi = require('./komodoApi');
const app = express();

app.use(express.json());
app.use('/api', komodoApi);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Komodo API server running on port ${PORT}`);
}); 