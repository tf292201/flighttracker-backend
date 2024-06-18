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
    static async findByIcao24(icao24) {
      try {
          // First query to get data from MASTER34
          const query1 = `
              SELECT * 
              FROM "MASTER34"
              WHERE TRIM("MODE S CODE HEX") ILIKE $1;
          `;
          const { rows: masterRows } = await db.query(query1, [icao24]);



          if (masterRows.length === 0) {
              return null; // If no row is found
          }

          const masterRow = masterRows[0];

          // Extract MFR MDL CODE from the first query's result
          const mfrMdlCode = masterRow['MFR MDL CODE'];

          // Second query to get data from ACFTREF using MFR MDL CODE
          const query2 = `
              SELECT * 
              FROM "ACFTREF"
              WHERE "CODE" = $1;
          `;
          const { rows: acftrefRows } = await db.query(query2, [mfrMdlCode]);
            console.log(acftrefRows);
            console.log(masterRow);
          return {
              masterRow,
              acftrefRow: acftrefRows[0] || null // Return the first row or null if not found
          };
      } catch (error) {
          throw new Error('Error finding aircraft by ICAO24: ' + error.message);
      }
  }
  static async removeFlight(userId, callsign) {
    try {
      // Step 1: Delete the flight from the flights table where user_id and callsign match
      const deleteResult = await db.query('DELETE FROM flights WHERE user_id = $1 AND callsign = $2 RETURNING *', [userId, callsign]);
  
      if (deleteResult.rows.length === 0) {
        throw new Error('Flight not found for the user');
      }
  
      return deleteResult.rows[0]; // Return the deleted flight entry
    } catch (error) {
      throw new Error('Error deleting spotted aircraft: ' + error.message);
    }
  }
    
  static async removeAll() {
    try {
        await db.query('DELETE FROM flights');
    } catch (error) {
        throw new Error('Error removing all flights: ' + error.message);
    }
}
}

module.exports = Aircraft;
