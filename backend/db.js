const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const user = process.env.dbuser
    const password = process.env.dbpassword
    const uri = `mongodb+srv://${user}:${password}@cluster0.kmoi5xm.mongodb.net/meeting?retryWrites=true&w=majority&appName=Cluster0`;

    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('MongoDB connected successfully!');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;