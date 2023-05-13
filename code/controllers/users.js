import { Group, User } from "../models/User.js";
import { transactions } from "../models/model.js";
import { verifyAuth } from "./utils.js";

/**
 * Return all the users
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having attributes `username`, `email` and `role`
  - Optional behavior:
    - empty array is returned if there are no users
 */
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json(error.message);
    }
}

/**
 * Return information of a specific user
  - Request Body Content: None
  - Response `data` Content: An object having attributes `username`, `email` and `role`.
  - Optional behavior:
    - error 401 is returned if the user is not found in the system
 */
export const getUser = async (req, res) => {
    try {
        const cookie = req.cookies
        if (!cookie.accessToken || !cookie.refreshToken) {
            return res.status(401).json({ message: "Unauthorized" }) // unauthorized
        }
        const username = req.params.username
        const user = await User.findOne({ refreshToken: cookie.refreshToken })
        if (!user) return res.status(401).json({ message: "User not found" })
        if (user.username !== username) return res.status(401).json({ message: "Unauthorized" })
        res.status(200).json(user)
    } catch (error) {
        res.status(500).json(error.message)
    }
}

/**
 * Create a new group
  - Request Body Content: An object having a string attribute for the `name` of the group and an array that lists all the `memberEmails`
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name`
    of the created group and an array for the `members` of the group), an array that lists the `alreadyInGroup` members
    (members whose email is already present in a group) and an array that lists the `membersNotFound` (members whose email
    +does not appear in the system)
  - Optional behavior:
    - error 401 is returned if there is already an existing group with the same name
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const createGroup = async (req, res) => {
    try {
      let name = req.body.name;
      let memberEmails = req.body.memberEmails;
      let members = [];
      let membersNotFound = [];
      let alreadyInGroup = [];
      for (let email of memberEmails) {
        // verify that the user exists
        let user = await User.findOne({email: email});
        if (user === null) {
          // if not existent, push into membersNotFound
          membersNotFound.push(email);
        } else {
          // check if user is already in a group
          let in_group = await Group.findOne({"members.email": email});
          if (in_group === null) {
            // if user is not in a group, add it to members
            members.push({ email: email, user: user._id });
          } else {
            // if user already in a group, add it to alreadyInGroup
            alreadyInGroup.push({ email: email, user: user._id });
          }
        }
      }
      try {
        // create a group
        const new_group = await Group.create({
          name,
          members,
        });
        // if All memberEmails does not exist or Already in Group error handling
        if (members.length === 0) {
          res.status(401).json({error: "All memberEmails does not exist or Already in Group"});
        } else {
          // all ok, return the group created
          res.status(200).json({ group: new_group, alreadyInGroup: alreadyInGroup, membersNotFound: membersNotFound });
        }
      } catch (error) {
        // already an existing group with the same name error
        res.status(401).json(error.message);        
      }
    } catch (err) {
        res.status(500).json(err.message);
    }
}

/**
 * Return all the groups
  - Request Body Content: None
  - Response `data` Content: An array of objects, each one having a string attribute for the `name` of the group
    and an array for the `members` of the group
  - Optional behavior:
    - empty array is returned if there are no groups
 */
export const getGroups = async (req, res) => {
    try {
      const groups = await Group.find();
      res.status(200).json(groups);
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Return information of a specific group
  - Request Body Content: None
  - Response `data` Content: An object having a string attribute for the `name` of the group and an array for the 
    `members` of the group
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const getGroup = async (req, res) => {
    try {
      const group = await Group.findOne({name: req.params.name});
      if (group === null) {
        res.status(401).json({error: "Group Does Not exist"});
      } else {
        res.status(200).json(group);
      }
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Add new members to a group
  - Request Body Content: An array of strings containing the emails of the members to add to the group
  - Response `data` Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include the new members as well as the old ones), 
    an array that lists the `alreadyInGroup` members (members whose email is already present in a group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are already in a group
 */
export const addToGroup = async (req, res) => {
    try {
      let name = req.params.name;
      let memberEmails = req.body.memberEmails;
      let members = [];
      let membersNotFound = [];
      let alreadyInGroup = [];
      for (let email of memberEmails) {
        // verify that the user exists
        let user = await User.findOne({email: email});
        if (user === null) {
          // if not existent, push into membersNotFound
          membersNotFound.push(email);
        } else {
          // check if user is already in a group
          let in_group = await Group.findOne({"members.email": email});
          if (in_group === null) {
            // if user is not in a group, add it to members
            members.push({ email: email, user: user._id });
          } else {
            // if user already in a group, add it to alreadyInGroup
            alreadyInGroup.push({ email: email, user: user._id });
          }
        }
      }
      // find and return the updated version of the group (with new option)
      const updated_group = await Group.findOneAndUpdate({ name: name }, { $push: { members: members } }, { new: true });
      let err;
      // Group Does Not exist or All memberEmails does not exist or Already in Group error handling
      if (updated_group === null) {
        err = { error: "Group Does Not exist" };
      } else if (members.length === 0) {
        err = { error: "All memberEmails does not exist or Already in Group" };
      }
      if (err) {
        res.status(401).json(err);
      } else {
        res.status(200).json({ group: updated_group, alreadyInGroup: alreadyInGroup, membersNotFound: membersNotFound });
      }
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Remove members from a group
  - Request Body Content: An object having an attribute `group` (this object must have a string attribute for the `name` of the
    created group and an array for the `members` of the group, this array must include only the remaining members),
    an array that lists the `notInGroup` members (members whose email is not in the group) and an array that lists 
    the `membersNotFound` (members whose email does not appear in the system)
  - Optional behavior:
    - error 401 is returned if the group does not exist
    - error 401 is returned if all the `memberEmails` either do not exist or are not in the group
 */
export const removeFromGroup = async (req, res) => {
    try {
      // users = user to remove from group, name = name of the group to delete
      let users = req.body.users;
      let name = req.params.name;
      let notInGroup = [];
      let membersNotFound = [];
      for (let email of users) {
        
      }
    } catch (err) {
        res.status(500).json(err.message)
    }
}

/**
 * Delete a user
  - Request Parameters: None
  - Request Body Content: A string equal to the `email` of the user to be deleted
  - Response `data` Content: An object having an attribute that lists the number of `deletedTransactions` and a boolean attribute that
    specifies whether the user was also `deletedFromGroup` or not.
  - Optional behavior:
    - error 401 is returned if the user does not exist 
 */
export const deleteUser = async (req, res) => {
  try {
    /*// return the number of deleted user (in our case possible values are only 1 or 0, since email is unique)
    const n_el_deleted = await User.deleteOne({email: req.body.email});
    if (n_el_deleted.deletedCount === 0) {
      // no user deleted, the user does not exist
      res.status(401).json({error: "User Does Not exist"});
    } else {
      // user deleted wuth success
      res.status(200).json({message: "User deleted Successfully"});
    }*/
  } catch (err) {
      res.status(500).json(err.message)
  }
}

/**
 * Delete a group
  - Request Body Content: A string equal to the `name` of the group to be deleted
  - Response `data` Content: A message confirming successful deletion
  - Optional behavior:
    - error 401 is returned if the group does not exist
 */
export const deleteGroup = async (req, res) => {
    try {
      // return the number of deleted groups (in our case possible values are only 1 or 0, since name is unique)
      const n_el_deleted = await Group.deleteOne({name: req.body.name});
      if (n_el_deleted.deletedCount === 0) {
        // no group deleted, the group does not exist
        res.status(401).json({error: "Group Does Not exist"});
      } else {
        // group deleted wuth success
        res.status(200).json({message: "Group deleted Successfully"});
      }
    } catch (err) {
        res.status(500).json(err.message)
    }
}