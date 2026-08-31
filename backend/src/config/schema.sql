-- ============================================
-- SKYPOST - CORE SCHEMA
-- ============================================

CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    username        VARCHAR(30) UNIQUE NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    display_name    VARCHAR(50),
    bio             VARCHAR(160),
    avatar_url      TEXT,
    follower_count  INTEGER DEFAULT 0,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tweets (
    id                BIGSERIAL PRIMARY KEY,
    user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content           VARCHAR(280) NOT NULL,
    reply_to_id       BIGINT REFERENCES tweets(id),
    original_tweet_id BIGINT REFERENCES tweets(id),
    image_url         TEXT,
    like_count        INTEGER DEFAULT 0,
    is_deleted        BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMP DEFAULT NOW(),
    search_vector     tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED
);

CREATE INDEX idx_tweets_user_id ON tweets(user_id);
CREATE INDEX idx_tweets_created_at ON tweets(created_at DESC);
CREATE INDEX idx_tweets_search ON tweets USING GIN(search_vector);
CREATE INDEX idx_tweets_original ON tweets(original_tweet_id);

CREATE TABLE follows (
    follower_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);

CREATE TABLE likes (
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tweet_id        BIGINT NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, tweet_id)
);

CREATE TABLE notifications (
    id              SERIAL PRIMARY KEY,
    recipient_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            VARCHAR(20) NOT NULL,
    tweet_id        BIGINT REFERENCES tweets(id),
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);

CREATE TABLE blocks (
    blocker_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blocked_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (blocker_id, blocked_id)
);

CREATE TABLE mutes (
    muter_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    muted_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at      TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (muter_id, muted_id)
);
