-- Recipe management tables
CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  source_type VARCHAR(20) NOT NULL CHECK (source_type IN ('url', 'pdf', 'docx', 'cookbook', 'manual')),
  source_url TEXT,
  source_file_name VARCHAR(255),
  source_cookbook_ref VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipes_name ON recipes(name);
CREATE INDEX idx_recipes_source_type ON recipes(source_type);

-- Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_text TEXT NOT NULL,
  quantity DECIMAL(10, 2),
  unit VARCHAR(50),
  ingredient_name VARCHAR(255),
  category VARCHAR(50),
  sort_order INTEGER DEFAULT 0
);

CREATE INDEX idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX idx_ingredients_category ON ingredients(category);

-- Weekly meal plans
CREATE TABLE IF NOT EXISTS weekly_plans (
  id SERIAL PRIMARY KEY,
  week_number INTEGER NOT NULL,
  year INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week_number, year)
);

CREATE INDEX idx_weekly_plans_active ON weekly_plans(is_active);

-- Planned meals
CREATE TABLE IF NOT EXISTS planned_meals (
  id SERIAL PRIMARY KEY,
  weekly_plan_id INTEGER NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  meal_type VARCHAR(20) NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner')),
  notes TEXT
);

CREATE INDEX idx_planned_meals_weekly_plan ON planned_meals(weekly_plan_id);
CREATE INDEX idx_planned_meals_day ON planned_meals(day_of_week);

-- Recipe files (for PDFs/DOCX)
CREATE TABLE IF NOT EXISTS recipe_files (
  id SERIAL PRIMARY KEY,
  recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_data BYTEA NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recipe_files_recipe_id ON recipe_files(recipe_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grocery list overlay (syncs purchased/removed/custom items across devices)
CREATE TABLE IF NOT EXISTS grocery_list_items (
  id SERIAL PRIMARY KEY,
  weekly_plan_id INTEGER NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  purchased BOOLEAN DEFAULT false,
  removed BOOLEAN DEFAULT false,
  custom BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_grocery_list_items_plan ON grocery_list_items(weekly_plan_id);
