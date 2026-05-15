require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Clear existing users
    await User.deleteMany();

    const users = [
      {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        password: 'password123',
        role: 'admin'
      },
      {
        nom: 'Martin',
        prenom: 'Alice',
        email: 'alice.martin@example.com',
        password: 'password123',
        role: 'manager'
      },
      {
        nom: 'Bernard',
        prenom: 'Lucas',
        email: 'lucas.bernard@example.com',
        password: 'password123',
        role: 'user'
      }
    ];

    await User.create(users);
    console.log('3 Users Created Successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error with seeding: ${error.message}`);
    process.exit(1);
  }
};

seedUsers();
