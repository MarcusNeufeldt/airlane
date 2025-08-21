-- Initialize Airlane database schema for Turso
-- Based on prisma/schema.prisma

-- User table
CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Diagram table  
CREATE TABLE IF NOT EXISTS Diagram (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    nodes TEXT NOT NULL, -- JSON stored as text
    edges TEXT NOT NULL, -- JSON stored as text
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    lockedByUserId TEXT,
    lockExpiresAt DATETIME,
    ownerId TEXT NOT NULL,
    FOREIGN KEY (ownerId) REFERENCES User(id)
);

-- ChatMessage table
CREATE TABLE IF NOT EXISTS ChatMessage (
    id TEXT PRIMARY KEY,
    diagramId TEXT NOT NULL,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (diagramId) REFERENCES Diagram(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_email ON User(email);
CREATE INDEX IF NOT EXISTS idx_diagram_owner ON Diagram(ownerId);
CREATE INDEX IF NOT EXISTS idx_diagram_created ON Diagram(createdAt);
CREATE INDEX IF NOT EXISTS idx_chatmessage_diagram ON ChatMessage(diagramId);
CREATE INDEX IF NOT EXISTS idx_chatmessage_created ON ChatMessage(createdAt);