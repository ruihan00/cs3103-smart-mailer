DROP TABLE IF EXISTS clicks; 
DROP TABLE IF EXISTS email_logs;
DROP TABLE IF EXISTS mailers;


CREATE TABLE IF NOT EXISTS mailers (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clicks (
    id SERIAL,
    clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    mailer_id TEXT NOT NULL REFERENCES mailers(id),
    PRIMARY KEY (id, clicked_at)  -- Include both id and clicked_at in the primary key
) PARTITION BY RANGE (clicked_at);

CREATE TABLE IF NOT EXISTS email_logs (
    id SERIAL PRIMARY KEY,
    mailer_id TEXT NOT NULL REFERENCES mailers(id),
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_department TEXT,
    success BOOLEAN NOT NULL,
    log_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

