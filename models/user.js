const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");
const { 
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
} = require("../helpers/expressError");

class User {
    static async register({ username, password, email }) {
        const duplicateCheck = await db.query(
            `SELECT username
            FROM users
            WHERE username = $1`,
            [username]
        );

        if (duplicateCheck.rows[0]) {
            throw new BadRequestError(`Username '${username}' is already taken`);
        }

        try {
            const hashedPassword = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
        
            const result = await db.query(
                `INSERT INTO users
                (username, password, email)
                VALUES ($1, $2, $3)
                RETURNING username, email`,
                [username, hashedPassword, email]
            );

            const user = result.rows[0];
            return user;
        } catch (error) {
        
            // Handle any errors that may occur during password hashing
            throw new BadRequestError('Error registering user');
        
        }
    }

    static async authenticate(username, password) { 
        const result = await db.query(
            `SELECT username,
                    password,
                    email
            FROM users
            WHERE username = $1`,
            [username]
        );

        const user = result.rows[0];

        if (!user) {
            throw new NotFoundError(`User with username '${username}' not found`);
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new UnauthorizedError('Invalid password');
        }

        delete user.password;
        return user;
    }

    static async findAll() {
        const result = await db.query(
            `SELECT username, email
            FROM users
            ORDER BY username`
        );

        return result.rows;
    }

    static async get(username) {
        const userRes = await db.query(
            `SELECT username, email
            FROM users
            WHERE username = $1`,
            [username]
        );

        const user = userRes.rows[0];

        if (!user) throw new NotFoundError(`No user: ${username}`);

        return user;
    }

    static async getUserIdByUsername(username) {
        try {
          const result = await db.query(
            `SELECT id FROM users WHERE username = $1`,
            [username]
          );
          return result.rows[0].id;
        } catch (error) {
          console.error('Error getting userId by username:', error);
          throw error;
        }
    }
}
 module.exports = User;