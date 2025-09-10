-- Create redeemed_rewards table to track unlocked rewards
CREATE TABLE IF NOT EXISTS redeemed_rewards (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    reward_id VARCHAR(255) NOT NULL,
    reward_title VARCHAR(255) NOT NULL,
    tokens_spent INTEGER NOT NULL,
    redeemed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_user_id ON redeemed_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_redeemed_rewards_reward_id ON redeemed_rewards(reward_id);
