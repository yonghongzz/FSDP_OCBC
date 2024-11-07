const Staff = require("../models/staff");
const bcrypt = require("bcryptjs");

const getAllStaffs = async (req, res) => {
    try {
      const staffs = await Staff.getAllStaffs();
      res.json(staffs);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving staffs");
    }
};

const getStaffById = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
      const staff = await Staff.getStaffById(id);
      if (!staff) {
        return res.status(404).send("Staff not found");
      }
      res.json(staff);
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving staff");
    }
};

/*
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
*/

/*
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
*/

const loginStaff = async (req, res) => {
    const logStaff = req.body;
    try {
      const { token, refreshToken } = await Staff.loginStaff(logStaff);
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
      res.status(500).send("Error retrieving staff");
    }
};

const refreshAccessToken = async (req, res) => {
    const refreshToken = req.headers.authorization && req.headers.authorization.split(" ")[1];
    try {
      const token = await Staff.refreshAccessToken(refreshToken);
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
    const refreshToken = req.headers.authorization?.split(" ")[1];
    if (!refreshToken) {
        return res.status(400).send("No refresh token provided");
    }

    try {
        const success = await Staff.logout(refreshToken);
        if (!success) {
            return res.status(404).send("Token not found");
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
      const staff = await Staff.getStaffById(id);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }
  
      if (staff.staff_id != req.staff.staff_id) {
        return res.status(403).json({ message: "You are not authorized to check this password" });
      }
      
      const passwordMatch = await bcrypt.compare(password, staff.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials", check: false });
      }
  
      // Passwords match
      return res.status(200).json({ message: "Password match", check: true });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving staff");
    }
};

module.exports = {
    getAllStaffs,
    getStaffById,
    loginStaff,
    checkPassword,
    refreshAccessToken,
    logout
};