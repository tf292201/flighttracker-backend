const db = require("../db");

class Aircraft {
    static async addAircraft({ callsign, tailNum, manNum, manYear, regName, manName, modelNum, thumbnailSrc, photographer, origin_country, userId }) {
        const result = await db.query(
          `INSERT INTO flights
            (callsign, tail_num, man_num, man_year, reg_name, man_name, model_num, thumbnail_src, photographer, origin_country, user_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING tail_num, man_num, man_year, reg_name, man_name, model_num, thumbnail_src, photographer, origin_country, user_id`,
          [callsign, tailNum, manNum, manYear, regName, manName, modelNum, thumbnailSrc, photographer, origin_country, userId]
        );
    
        const aircraft = result.rows[0];
        return aircraft;
      }

      static async getSpottedFlights(userId) {
        try {
          const query = `
            SELECT * 
            FROM flights 
            WHERE user_id = $1;
          `;
          const { rows } = await db.query(query, [userId]);
          return rows;
        } catch (error) {
          throw new Error('Error fetching spotted flights: ' + error.message);
        }
    }
}

module.exports = Aircraft;
