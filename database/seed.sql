-- Seed Data for Find The Outfit (Safe & Idempotent)
USE `find_the_outfit`;

-- 1. Insert Users (PBKDF2-SHA256, 100000 iterations, format pbkdf2$iterations$salthex$hashhex)
-- Passwords:
-- shivi: Shivi@123
-- claire_vane: Claire@123
-- sophia_atelier: Sophia@123
INSERT IGNORE INTO `users` (`username`, `email`, `password_hash`, `display_name`, `bio`, `avatar_path`, `location`, `is_private`) VALUES
('shivi', 'shivi@findtheoutfit.com', 'pbkdf2$100000$1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d$6dd6ceab1c53cac2a9e95c49af6dce48ac05a05f8c7ffc1aa16e9d5a68fe4727', 'Shivi', 'Curator of minimalist silhouettes, vintage tailoring, and quiet luxury aesthetics 🍂 Co-founder of The Modern Minimal.', '', 'New York & Paris', 0),
('claire_vane', 'claire@findtheoutfit.com', 'pbkdf2$100000$2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e$b2866a3fb9ed3c70ee41cdf9690f72af66b90e4fc07ac8210f5d4e9bcfddd8a1', 'Claire Vane', 'Parisian tailoring, monochromatic neutrals and everyday French elegance. Styling director at Atelier Vane.', '', 'Paris, France', 0),
('sophia_atelier', 'sophia@findtheoutfit.com', 'pbkdf2$100000$3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f$363b20336e4cb3dca33d9f4fae23af6369c9879faebe07ce4dd99a0d7942c230', 'Sophia Lindqvist', 'Heavy ribbed knitwear, bias-cut silks, and monochromatic cream layering.', '', 'Stockholm, Sweden', 0);

-- Update passwords for claire_vane and sophia_atelier if they already exist
UPDATE `users` SET `password_hash` = 'pbkdf2$100000$2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e$b2866a3fb9ed3c70ee41cdf9690f72af66b90e4fc07ac8210f5d4e9bcfddd8a1' WHERE `username` = 'claire_vane';
UPDATE `users` SET `password_hash` = 'pbkdf2$100000$3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f$363b20336e4cb3dca33d9f4fae23af6369c9879faebe07ce4dd99a0d7942c230' WHERE `username` = 'sophia_atelier';

-- 2. Insert Products from products.csv
INSERT IGNORE INTO `products` (`product_id`, `product_name`, `image_path`, `brand`, `price`, `source`, `url`) VALUES
('p001', 'Men''s Black Leather Jacket', 'p001.jpg', 'Generic', '849', 'Amazon', 'https://www.amazon.in/Leather-Jacket-Sleeve-Collar-Casual/dp/B0HK463LYJ/'),
('p002', 'Red Hoodie', 'p002.jpg', 'WearIndia', '549', 'Amazon', 'https://www.amazon.in/WearIndia-Hoodies-Sweatshirt-Kangaroo-X-Small/dp/B083Y3L5SP/'),
('p003', 'Red Lehenga', 'p003.jpg', 'Zeel Clothing', '3849', 'Amazon', 'https://www.amazon.in/Zeel-Clothing-Embroidered-Georgette-5124-Red-Women-Lehenga-Choli-Latest/dp/B0CQG123V6/'),
('p004', 'SIRIL Women''s Shimmer Georgette Embroidery Mirror Work Saree', 'p005.jpg', 'SIRIL', '999', 'Amazon', 'https://www.amazon.in/SIRIL-Georgette-Embroidery-Unstitched-5691S1934_Green/dp/B0H7CCR9W8'),
('p005', 'Women''s Cotton Blend Oversized Fit Half Sleeve Printed Round Neck T-Shirt', 'p005.jpg', 'Jawdrobe', '317', 'Amazon', 'https://www.amazon.in/Jawdrobe-Oversized-Printed-T-Shirt-Tshirt-Vintage-White-m/dp/B0DNZP96DC'),
('p006', 'ANNI Designer Women''s Viscose Blend Printed Short Kurti', 'p006.jpg', 'ANNI DESIGNER', '299', 'Amazon', 'https://www.amazon.in/ANNI-Designer-Viscose-RED-VKS02_M-VKS02_Red-VKS02_Medium/dp/B0GNMNX4FP'),
('p007', 'Slip Dress', 'p007.jpg', 'Savana', '1267', 'Savana', 'https://www.savana.com/details/slip-dress-2259242?vid=308&skcPGs=370309-472830'),
('p008', 'High Waist Medium Wash Straight Leg Jeans', 'p008.jpg', 'Savana', '1253', 'Savana', 'https://www.savana.com/details/high-waist-medium-wash-straight-leg-jeans-2298832?vid=475&skcPGs=375812-488774'),
('p009', 'Dress and Jacket for Women', 'p009.jpg', 'Meesho', '291', 'Meesho', 'https://www.meesho.com/dress-and-jacket-for-women-women-dress-dresse-for-women-women-dress-crepe-dress/p/6lk7da'),
('p0010', 'Stylish Embroidered Kurti Pant Dupatta Set', 'p0010.jpg', 'Meesho', '304', 'Meesho', 'https://www.meesho.com/stylish-embroidered-kurti-pant-dupatta-set-for-women-dark-pink-ethnic-suit-georgette-dupatta-festive-wear-kurta-set-3-piece-combo/p/8vjnq7');

-- 3. Insert Posts for user 'shivi' and 'claire_vane' safely without overwriting
INSERT INTO `posts` (`user_id`, `image_path`, `caption`, `category`, `created_at`)
SELECT u.user_id, 'backend/uploads/post_shivi_1.jpg', 'Autumnal layering in oat and espresso. Double-breasted camel wool drape with tailored trousers.', 'Minimal', NOW() - INTERVAL 2 HOUR
FROM `users` u WHERE u.username = 'shivi'
AND NOT EXISTS (SELECT 1 FROM `posts` p WHERE p.user_id = u.user_id AND p.image_path = 'backend/uploads/post_shivi_1.jpg');

INSERT INTO `posts` (`user_id`, `image_path`, `caption`, `category`, `created_at`)
SELECT u.user_id, 'backend/uploads/post_shivi_2.jpg', 'Vintage leather bomber paired with high-waisted ecru denim. Effortless city weekend aesthetic.', 'Streetwear', NOW() - INTERVAL 1 DAY
FROM `users` u WHERE u.username = 'shivi'
AND NOT EXISTS (SELECT 1 FROM `posts` p WHERE p.user_id = u.user_id AND p.image_path = 'backend/uploads/post_shivi_2.jpg');

INSERT INTO `posts` (`user_id`, `image_path`, `caption`, `category`, `created_at`)
SELECT u.user_id, 'backend/uploads/post_shivi_3.jpg', 'Monochromatic silk and heavy knit pairing for early winter.', 'Old Money', NOW() - INTERVAL 3 DAY
FROM `users` u WHERE u.username = 'shivi'
AND NOT EXISTS (SELECT 1 FROM `posts` p WHERE p.user_id = u.user_id AND p.image_path = 'backend/uploads/post_shivi_3.jpg');

INSERT INTO `posts` (`user_id`, `image_path`, `caption`, `category`, `created_at`)
SELECT u.user_id, 'backend/uploads/post_claire_1.jpg', 'Morning coffee in Saint-Germain. Structured camel trench and pleated wool slacks.', 'Old Money', NOW() - INTERVAL 4 HOUR
FROM `users` u WHERE u.username = 'claire_vane'
AND NOT EXISTS (SELECT 1 FROM `posts` p WHERE p.user_id = u.user_id AND p.image_path = 'backend/uploads/post_claire_1.jpg');

-- 4. Follows
INSERT IGNORE INTO `follows` (`follower_id`, `following_id`)
SELECT u1.user_id, u2.user_id FROM `users` u1, `users` u2 WHERE u1.username = 'shivi' AND u2.username = 'claire_vane';

INSERT IGNORE INTO `follows` (`follower_id`, `following_id`)
SELECT u1.user_id, u2.user_id FROM `users` u1, `users` u2 WHERE u1.username = 'claire_vane' AND u2.username = 'shivi';

INSERT IGNORE INTO `follows` (`follower_id`, `following_id`)
SELECT u1.user_id, u2.user_id FROM `users` u1, `users` u2 WHERE u1.username = 'sophia_atelier' AND u2.username = 'shivi';

-- 5. Likes
INSERT IGNORE INTO `likes` (`user_id`, `post_id`)
SELECT u.user_id, p.post_id FROM `users` u, `posts` p
WHERE u.username = 'claire_vane' AND p.image_path = 'backend/uploads/post_shivi_1.jpg';

INSERT IGNORE INTO `likes` (`user_id`, `post_id`)
SELECT u.user_id, p.post_id FROM `users` u, `posts` p
WHERE u.username = 'sophia_atelier' AND p.image_path = 'backend/uploads/post_shivi_1.jpg';

INSERT IGNORE INTO `likes` (`user_id`, `post_id`)
SELECT u.user_id, p.post_id FROM `users` u, `posts` p
WHERE u.username = 'shivi' AND p.image_path = 'backend/uploads/post_claire_1.jpg';

-- 6. Comments
INSERT INTO `comments` (`post_id`, `user_id`, `comment_text`)
SELECT p.post_id, u.user_id, 'Absolute perfection Shivi! The camel drape is breathtaking.'
FROM `posts` p, `users` u
WHERE p.image_path = 'backend/uploads/post_shivi_1.jpg' AND u.username = 'claire_vane'
AND NOT EXISTS (SELECT 1 FROM `comments` c WHERE c.post_id = p.post_id AND c.user_id = u.user_id AND c.comment_text LIKE 'Absolute perfection%');

INSERT INTO `comments` (`post_id`, `user_id`, `comment_text`)
SELECT p.post_id, u.user_id, 'Flawless tailoring and silhouette.'
FROM `posts` p, `users` u
WHERE p.image_path = 'backend/uploads/post_shivi_1.jpg' AND u.username = 'sophia_atelier'
AND NOT EXISTS (SELECT 1 FROM `comments` c WHERE c.post_id = p.post_id AND c.user_id = u.user_id AND c.comment_text LIKE 'Flawless tailoring%');

-- 7. Saved Posts
INSERT IGNORE INTO `saved_posts` (`user_id`, `post_id`)
SELECT u.user_id, p.post_id FROM `users` u, `posts` p
WHERE u.username = 'shivi' AND p.image_path = 'backend/uploads/post_claire_1.jpg';

INSERT IGNORE INTO `saved_posts` (`user_id`, `post_id`)
SELECT u.user_id, p.post_id FROM `users` u, `posts` p
WHERE u.username = 'claire_vane' AND p.image_path = 'backend/uploads/post_shivi_1.jpg';
