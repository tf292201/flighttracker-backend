CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    callsign VARCHAR(100),
    tail_num VARCHAR(50),
    man_num VARCHAR(50),
    man_year INTEGER,
    reg_name VARCHAR(100),
    man_name VARCHAR(100),
    model_num VARCHAR(100),
    thumbnail_src TEXT,
    photographer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
