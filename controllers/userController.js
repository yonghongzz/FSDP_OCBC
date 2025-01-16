const User = require("../models/user");
const bcrypt = require("bcryptjs");

const getAllUsers = async (req, res) => {
    try {
      const users = await User.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving users");
    }
};

const getUserById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const user = await User.getUserById(id);
      if (!user) {
        return res.status(404).send("User not found");
      }
      res.json(user);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving user");
    }
};

const getUserId = async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.getUserId(username);
    if (!user) {
      return res.status(404).send("User not found");
    }
    console.log(user);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving id");
  }
};

const createUser = async (req, res) => {
    const newUser = req.body;

    const existingEmail = await User.getUserByEmail(newUser.email);
    if (existingEmail) {
        return res.status(400).json({ message: "Email is already in use" });
    }

    const existingName = await User.getUserByName(newUser.username);
    if (existingName) {
        return res.status(400).json({ message: "Display name is already in use" });
    }

    try {
      const createdUser = await User.createUser(newUser);
      res.status(201).json(createdUser);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error creating user");
    }
};

const updateUser = async (req, res) => {
    const id = parseInt(req.params.id);
    const newUserData = req.body;
  
    try {
      const user = await User.getUserById(id);
      if (!user) {
          return res.status(404).send("User not found");
      }
  
      if (user.user_id != req.user.user_id) {
        return res.status(403).json({ message: "You are not authorized to update this user" });
      }
  
      const updatedUser = await User.updateUser(id, newUserData);
      if (!updatedUser) {
        return res.status(404).send("User not found");
      }
      res.json(updatedUser);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error updating user");
    }
};

const loginUser = async (req, res) => {
    const logUser = req.body;
    try {
      const { token, refreshToken } = await User.loginUser(logUser);
      if (!token) {
        return res.status(404).send("Invalid email or password");
      }
      res.status(200).json({
        message: "Login successful",
        token: token,
        refreshToken: refreshToken
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving user");
    }
};

const refreshAccessToken = async (req, res) => {
    const refreshToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
    try {
      const token = await User.refreshAccessToken(refreshToken);
      if (!token) {
        return res.status(404).send("Invalid refresh token");
      }
      res.status(200).json({
        message: "successful",
        token: token
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error generating token");
    }
};

const logout = async (req, res) => {
    const refreshToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
    try {
      const success = await User.logout(refreshToken);
      if (!success) {
        return res.status(404).send("Unsuccessful");
      }
      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).send("Error logging out");
    }
};

const checkPassword = async (req, res) => {
    const {id, password} = req.body;
    try {
      const user = await User.getUserById(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      if (user.user_id != req.user.user_id) {
        return res.status(403).json({ message: "You are not authorized to check this password" });
      }
      
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials", check: false });
      }
  
      // Passwords match
      return res.status(200).json({ message: "Password match", check: true });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving user");
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    loginUser,
    checkPassword,
    refreshAccessToken,
    logout,
    getUserId,
};