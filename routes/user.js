"use strict";

/** Routes for users. */

const jsonschema = require("jsonschema");

const express = require("express");
const { ensureCorrectUser, authenticateJWT } = require("../middleware/auth");
const { BadRequestError } = require("../helpers/expressError");
const User = require("../models/user");
const Aircraft = require("../models/aircraftspotted");
const { createToken } = require("../helpers/tokens");
const userNewSchema = require("../schemas/userNewSchema.json");

const router = express.Router();


router.post("/login", async function (req, res, next) {
  try {
    const { username, password } = req.body;
    const user = await User.authenticate(username, password);
    const token = createToken(user);
    return res.json({ user, token });
  } catch (err) {
    return next(err);
  }
});

router.post("/logout", function (req, res, next) {
  try {
    
    return res.json({ message: "Logout successful" });
  } catch (err) {
    return next(err);
  }
});



router.post("/register", async function (req, res, next) {
  try {
    const validator = jsonschema.validate(req.body, userNewSchema);
    if (!validator.valid) {
      const errs = validator.errors.map(e => e.stack);
      throw new BadRequestError(errs);
    }

    const user = await User.register(req.body);
    const token = createToken(user);
    return res.status(201).json({ user, token });
  } catch (err) {
    return next(err);
  }
});


/** GET / => { users: [ {username, firstName, lastName, email }, ... ] }
 *
 * Returns list of all users.
 *
 * Authorization required: admin
 **/

router.get("/", async function (req, res, next) {
  try {
    const users = await User.findAll();
    return res.json({ users });
  } catch (err) {
    return next(err);
  }
});


/** GET /[username] => { user }
 *
 * Returns { username, firstName, isAdmin, jobs }
 *  
 *
 * Authorization required: same user-as-:username
 **/

router.get("/:username", authenticateJWT, ensureCorrectUser, async function (req, res, next) {
  try {
    const user = await User.get(req.params.username);
    const userId = await User.getUserIdByUsername(req.params.username);
    const flights = await Aircraft.getSpottedFlights(userId);
    return res.json({ user, flights});
  } catch (err) {
    return next(err);
  }
});



/** DELETE /[username]  =>  { deleted: username }
 *
 * Authorization required: admin or same-user-as-:username
 **/

router.delete("/:username", ensureCorrectUser, async function (req, res, next) {
  try {
    await User.remove(req.params.username);
    return res.json({ deleted: req.params.username });
  } catch (err) {
    return next(err);
  }
});




module.exports = router;
