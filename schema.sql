CREATE TABLE IF NOT EXISTS registration_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    total_fee DECIMAL(10,2) DEFAULT 0.00,
    paid BOOLEAN DEFAULT FALSE,
    adults_count INT DEFAULT 1,
    kids_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    name VARCHAR(255) NOT NULL,
    type ENUM('adult', 'child') DEFAULT 'adult',
    arrived BOOLEAN DEFAULT FALSE,
    profession VARCHAR(100),
    irish_county VARCHAR(100),
    kerala_district VARCHAR(100),
    email VARCHAR(255),
    whatsapp VARCHAR(50),
    mobile VARCHAR(50),
    address_kerala TEXT,
    eircode VARCHAR(20),
    FOREIGN KEY (group_id) REFERENCES registration_groups(id) ON DELETE CASCADE
);
