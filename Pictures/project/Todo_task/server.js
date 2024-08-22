const express = require('express');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/todos', require('./routes/todos'));
app.use('/api/todos', require('./routes/todos'))

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
