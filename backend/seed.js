require("dotenv").config();
const bcrypt = require("bcrypt");
const { createClient } = require("redis");
const pool = require("./src/config/db");

const TOTAL_PEOPLE = 150;
const CELEBRITY_COUNT = 32;
const EVERYONE_PASSWORD = "password123";
const CELEBRITY_THRESHOLD = 1000;
const MAX_TIMELINE_LENGTH = 800;
const MIN_TWEETS_PER_PERSON = 10;
const MAX_TWEETS_PER_PERSON = 16;
const PHOTO_CHANCE = 0.35;

const FIRST_NAMES_MALE = ["Arjun","Rohan","Aditya","Vikram","Karan","Amit","Rahul","Sanjay","Vijay","Anil","Suresh","Ravi","Manoj","Deepak","Ajay","Nikhil","Rajesh","Kunal","Varun","Siddharth","Arun","Gaurav","Naveen","Sandeep","Pankaj","Harish","Vinod","Prakash","Ramesh","Ashok","Yash","Aman","Rohit","Vishal","Abhishek"];
const FIRST_NAMES_FEMALE = ["Priya","Ananya","Neha","Pooja","Kavya","Sneha","Divya","Anjali","Meera","Riya","Shreya","Isha","Nisha","Swati","Kritika","Aishwarya","Deepika","Sonia","Rekha","Sunita","Anita","Lakshmi","Kavita","Preeti","Radha","Shalini","Nandini","Bhavna","Rashmi","Suman","Geeta","Manisha","Kiran","Sarita","Vandana"];
const LAST_NAMES = ["Sharma","Verma","Gupta","Singh","Kumar","Patel","Reddy","Rao","Nair","Iyer","Menon","Joshi","Mehta","Shah","Chopra","Malhotra","Kapoor","Bhatt","Desai","Pillai","Agarwal","Bansal","Mishra","Yadav","Chauhan","Pandey","Saxena","Bose","Das","Ghosh"];

const BIOS = ["Coffee lover. Weekend traveler.","Just here for the memes.","Software engineer by day, gamer by night.","Trying to figure life out, one day at a time.","Cricket fan. Foodie. Bookworm.","Building cool things on the internet.","Music is life.","Dog parent. Chai enthusiast.","Learning something new every day.","Movies, cricket, and good food.","Small town, big dreams.","Photographer in progress.","Living for weekend treks.","Overthinker. Occasional writer.","Foodie exploring one city at a time."];

const PLAIN_TWEETS = ["Just had the best filter coffee of my life.","Anyone else obsessed with this weather today?","Working on something exciting, can't wait to share it.","Weekend plans: absolutely nothing, and I love it.","This traffic is testing my patience today.","Finally finished that book I've been reading for months.","Trying out a new recipe, wish me luck.","Mondays hit different when you had a good weekend.","Just deployed my first project, feeling proud.","Rain today made the evening so much better.","Can we talk about how good this song is?","Late night coding sessions hit different.","Missing home food so much right now.","Started learning something new today, excited!","Power cut in the middle of an important call, classic.","Nothing beats a good cup of chai on a rainy day.","Finally cleaned my room, feels like a fresh start.","Why does the weekend go by so fast?","That moment when your code finally runs without errors.","Auto drivers today deserve an award for patience.","Binge watched an entire season last night, no regrets.","Trying to eat healthy this week, let's see how long it lasts.","Found a new favorite street food spot today.","Gym motivation hit me out of nowhere today.","Can't believe how fast this year is flying by.","Just booked tickets for a weekend getaway!","Power nap turned into a 3 hour sleep, oops.","New phone update broke half my apps again.","Grateful for small wins today.","Finally tried that new restaurant everyone's talking about.","Working from home has its own kind of chaos.","Missed my train by two minutes, story of my life.","The chai at this place is unbeatable.","Long call with an old friend today, needed that.","Just aced an interview, feeling on top of the world.","Discovered a great playlist for late night drives.","Finally understood recursion after three tries, small victories.","Power yoga this morning, feeling energized.","New laptop finally arrived, time to get productive.","Sunday market visit was totally worth it.","Can't decide between tea and coffee today.","First day at the new job, nervous but excited.","Family dinner tonight, can't wait.","Rewatching old movies never gets old.","Finally fixed that annoying bug that's been bothering me all week.","Weather changed overnight, perfect for a walk.","New year, same goals, still working on them.","Found my old diary today, what a nostalgia trip.","Cooked dinner for the first time this week, feeling accomplished.","Excited for the new season premiere tonight.","Finally got my code to production, huge relief.","Sunday mornings are made for slow coffee and no plans.","New badminton racket, ready to lose gracefully.","Can't stop listening to this new album.","Finally organized my desk, productivity mode activated.","Weekend hike left me sore but so worth it.","Just finished a great workout, endorphins are real.","Rain check on all plans today, staying in with a book.","New recipe attempt was a success this time.","Trying to be more consistent with journaling this month."];

const HASHTAG_TWEETS = ["Deadline week again #coding #grind","Nothing beats a good match #cricket","Weekend trip loading #travel #wanderlust","Best meal I've had all month #foodie","Finally hit a new PR at the gym #fitness","New playlist on repeat #music","Long overdue #weekend plans with friends","Chasing deadlines and coffee #tech #life","Monsoon vibes hitting different #monsoon","Another late night debugging session #coding","Match day nerves are real #cricket #sports","Exploring a new city this weekend #travel","Trying every dish on the menu today #foodie","Rest day but still restless #fitness","This track is stuck in my head #music","Weekend mood: do absolutely nothing #weekend","Startup life is a rollercoaster #tech","Rain, chai, and good vibes #monsoon #chai","Shipped a feature today, feeling good #coding","Cheering from the stands today #cricket"];

function randomName(i) {
  const isMale = i % 2 === 0;
  const first = isMale ? FIRST_NAMES_MALE[Math.floor(Math.random() * FIRST_NAMES_MALE.length)] : FIRST_NAMES_FEMALE[Math.floor(Math.random() * FIRST_NAMES_FEMALE.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}
function randomFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickRandomUnique(arr, count) { return [...arr].sort(() => 0.5 - Math.random()).slice(0, Math.min(count, arr.length)); }
function timelineKey(userId) { return `timeline:${userId}`; }

async function seed() {
  const redisClient = createClient({ url: process.env.REDIS_URL });
  await redisClient.connect();

  console.log("Wiping old Postgres data...");
  await pool.query("TRUNCATE tweets, follows, likes, notifications, users, blocks, mutes RESTART IDENTITY CASCADE");

  console.log("Wiping old Redis timeline caches...");
  await redisClient.flushDb();

  const passwordHash = await bcrypt.hash(EVERYONE_PASSWORD, 10);
  const people = [];

  console.log(`Creating ${TOTAL_PEOPLE} people (${CELEBRITY_COUNT} celebrities)...`);
  for (let i = 0; i < TOTAL_PEOPLE; i++) {
    const isCelebrity = i < CELEBRITY_COUNT;
    const displayName = randomName(i);
    const usernameBase = displayName.toLowerCase().replace(/\s+/g, "_");
    const followerCount = isCelebrity ? randomInt(1000000, 5000000) : 0;
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name, bio, follower_count)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username`,
      [`${usernameBase}${i}`, `person${i}@example.com`, passwordHash, displayName, randomFrom(BIOS), followerCount]
    );
    people.push({ id: result.rows[0].id, username: result.rows[0].username, isCelebrity });
  }

  const celebrityIds = people.filter((p) => p.isCelebrity).map((p) => p.id);
  const regularIds = people.filter((p) => !p.isCelebrity).map((p) => p.id);
  const followersOf = {};
  function addFollow(followerId, authorId) {
    if (!followersOf[authorId]) followersOf[authorId] = [];
    followersOf[authorId].push(followerId);
  }

  console.log("Creating follow relationships...");
  for (const personId of regularIds) {
    for (const celebId of celebrityIds) {
      await pool.query(`INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [personId, celebId]);
      addFollow(personId, celebId);
    }
    const others = regularIds.filter((id) => id !== personId);
    const randomFollows = pickRandomUnique(others, randomInt(10, 25));
    for (const followId of randomFollows) {
      await pool.query(`INSERT INTO follows (follower_id, following_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [personId, followId]);
      addFollow(personId, followId);
    }
  }

  console.log("Syncing honest follower counts for regular users...");
  await pool.query(
    `UPDATE users u SET follower_count = COALESCE(sub.cnt, 0)
     FROM (SELECT following_id, COUNT(*) AS cnt FROM follows GROUP BY following_id) sub
     WHERE u.id = sub.following_id AND u.id != ALL($1::int[])`,
    [celebrityIds]
  );

  console.log("Writing tweets and fanning them out to followers' cached timelines...");
  const allTweetIdsByAuthor = {}; // authorId -> [tweetId, ...], used for seeding likes/notifications below
  let tweetCount = 0;
  for (const person of people) {
    const numTweets = randomInt(MIN_TWEETS_PER_PERSON, MAX_TWEETS_PER_PERSON);
    const hashtagPicks = pickRandomUnique(HASHTAG_TWEETS, 2);
    const plainPicks = pickRandomUnique(PLAIN_TWEETS, numTweets - hashtagPicks.length);
    const allTexts = [...hashtagPicks, ...plainPicks];
    allTweetIdsByAuthor[person.id] = [];

    for (const text of allTexts) {
      const imageUrl = Math.random() < PHOTO_CHANCE ? `https://picsum.photos/seed/${person.username}-${tweetCount}/600/400` : null;
      const result = await pool.query(
        `INSERT INTO tweets (user_id, content, image_url) VALUES ($1, $2, $3) RETURNING id`,
        [person.id, text, imageUrl]
      );
      const tweetId = result.rows[0].id;
      allTweetIdsByAuthor[person.id].push(tweetId);
      tweetCount++;

      if (!person.isCelebrity) {
        const followers = followersOf[person.id] || [];
        for (const followerId of followers) {
          const key = timelineKey(followerId);
          await redisClient.lPush(key, tweetId.toString());
          await redisClient.lTrim(key, 0, MAX_TIMELINE_LENGTH - 1);
        }
      }
    }
  }

  await redisClient.quit();

  // Seed some sample likes + notifications for the first 15 regular
  // people, so logging in as e.g. person0-person14 shows a populated
  // notification bell immediately, without needing a second account.
  console.log("Seeding sample likes and notifications for demo purposes...");
  const demoRecipients = regularIds.slice(0, 15);
  for (const recipientId of demoRecipients) {
    const recipientTweets = allTweetIdsByAuthor[recipientId] || [];
    if (recipientTweets.length === 0) continue;
    const actors = pickRandomUnique(regularIds.filter((id) => id !== recipientId), randomInt(2, 5));
    for (const actorId of actors) {
      const targetTweetId = randomFrom(recipientTweets);
      const type = randomFrom(["like", "like", "follow", "reply"]);
      if (type === "like") {
        await pool.query(`INSERT INTO likes (user_id, tweet_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [actorId, targetTweetId]);
        await pool.query(`UPDATE tweets SET like_count = like_count + 1 WHERE id = $1`, [targetTweetId]);
        await pool.query(
          `INSERT INTO notifications (recipient_id, actor_id, type, tweet_id) VALUES ($1, $2, 'like', $3)`,
          [recipientId, actorId, targetTweetId]
        );
      } else if (type === "follow") {
        await pool.query(
          `INSERT INTO notifications (recipient_id, actor_id, type) VALUES ($1, $2, 'follow')`,
          [recipientId, actorId]
        );
      } else {
        await pool.query(
          `INSERT INTO notifications (recipient_id, actor_id, type, tweet_id) VALUES ($1, $2, 'reply', $3)`,
          [recipientId, actorId, targetTweetId]
        );
      }
    }
  }

  console.log("\nDone!");
  console.log(`Every seeded account's password is: ${EVERYONE_PASSWORD}`);
  console.log(`Total people: ${TOTAL_PEOPLE}, Celebrities: ${CELEBRITY_COUNT}, Tweets: ${tweetCount}`);
  console.log(`Tip: log in as person0@example.com through person14@example.com to see a pre-populated notification bell.`);
  console.log(`Celebrity user IDs: ${celebrityIds.join(", ")}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
