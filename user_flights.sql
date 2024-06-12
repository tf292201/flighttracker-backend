CREATE TABLE user_flights (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    flight_id INTEGER REFERENCES flights(id),
    spotted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
