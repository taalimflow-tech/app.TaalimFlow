-- Create test schools for school code verification
INSERT INTO schools (name, code, location, admin_key, teacher_key, active, created_at, updated_at)
VALUES 
  ('مدرسة تجريبية', 'TST1', 'الجزائر', 'admin123', 'teacher123', true, NOW(), NOW()),
  ('مدرسة المجتهد', 'da', 'الجزائر', 'admin456', 'teacher456', true, NOW(), NOW()),
  ('Test School', 'TEST', 'Algeria', 'admin789', 'teacher789', true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  admin_key = EXCLUDED.admin_key,
  teacher_key = EXCLUDED.teacher_key,
  active = EXCLUDED.active,
  updated_at = NOW();