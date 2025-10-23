-- Ensure categories table exists and is populated
INSERT INTO categories (name, description, slug) VALUES 
('Programming', 'Software development and programming courses', 'programming'),
('Data Science', 'Data analysis, machine learning, and AI courses', 'data-science'),
('Web Development', 'Frontend and backend web development', 'web-development'),
('Mobile Development', 'iOS and Android app development', 'mobile-development'),
('DevOps', 'DevOps and infrastructure courses', 'devops'),
('Cybersecurity', 'Security and ethical hacking courses', 'cybersecurity'),
('AI/ML', 'Artificial Intelligence and Machine Learning', 'ai-ml'),
('Cloud Computing', 'AWS, Azure, GCP cloud platforms', 'cloud-computing'),
('Database', 'Database design and management', 'database'),
('UI/UX Design', 'User interface and experience design', 'ui-ux-design'),
('Digital Marketing', 'Online marketing and growth strategies', 'digital-marketing'),
('Business', 'Business skills and entrepreneurship', 'business'),
('Other', 'Other miscellaneous courses', 'other')
ON CONFLICT (name) DO NOTHING;