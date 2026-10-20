-- Optional example data so the menu isn't empty on day one.
-- Run after schema.sql. Edit or delete anything from /admin afterwards.

with ing as (
  insert into public.ingredients (name, type, in_stock, homemade) values
    ('Espresso',           'espresso', true,  false),
    ('Oat milk',           'milk',     true,  false),
    ('Whole milk',         'milk',     true,  false),
    ('Brown sugar syrup',  'syrup',    true,  true),
    ('Vanilla syrup',      'syrup',    true,  true),
    ('Matcha',             'tea',      true,  false),
    ('Cold foam',          'topping',  false, true),
    ('Cinnamon',           'topping',  true,  false)
  returning id, name
),
dr as (
  insert into public.drinks (name, category, description, sort_order) values
    ('Brown Sugar Oat Latte', 'Coffee', 'Espresso, oat milk and a deep caramel-y syrup.', 1),
    ('Vanilla Latte',         'Coffee', 'The classic. Ask for it iced.',                   2),
    ('Iced Matcha Latte',     'Tea',    'Whisked matcha over milk and ice.',               3)
  returning id, name
)
insert into public.drink_ingredients (drink_id, ingredient_id, optional)
select dr.id, ing.id, x.optional
from (values
  ('Brown Sugar Oat Latte', 'Espresso',          false),
  ('Brown Sugar Oat Latte', 'Oat milk',          false),
  ('Brown Sugar Oat Latte', 'Brown sugar syrup', false),
  ('Brown Sugar Oat Latte', 'Cinnamon',          true),
  ('Vanilla Latte',         'Espresso',          false),
  ('Vanilla Latte',         'Whole milk',        false),
  ('Vanilla Latte',         'Vanilla syrup',     false),
  ('Iced Matcha Latte',     'Matcha',            false),
  ('Iced Matcha Latte',     'Whole milk',        false),
  ('Iced Matcha Latte',     'Cold foam',         true)
) as x(drink, ingredient, optional)
join dr  on dr.name  = x.drink
join ing on ing.name = x.ingredient;
