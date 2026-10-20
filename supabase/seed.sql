-- Optional example data so the menu isn't empty on day one.
-- Run after schema.sql. Edit or delete anything from /admin afterwards.

with ing as (
  insert into public.ingredients (name, type, in_stock, homemade, addon) values
    ('Espresso',           'espresso', true,  false, true),
    ('Oat milk',           'milk',     true,  false, true),
    ('Whole milk',         'milk',     true,  false, false),
    ('Brown sugar syrup',  'syrup',    true,  true,  true),
    ('Vanilla syrup',      'syrup',    true,  true,  true),
    ('Matcha',             'tea',      true,  false, false),
    ('Vanilla cold foam',  'foam',     false, true,  true),
    ('Cinnamon',           'topping',  true,  false, true)
  returning id, name
),
dr as (
  insert into public.drinks (name, category, description, sort_order) values
    ('Brown Sugar Oat Latte', 'Coffee', 'Espresso, oat milk and a deep caramel-y syrup.', 1),
    ('Vanilla Latte',         'Coffee', 'The classic. Ask for it iced.',                   2),
    ('Iced Matcha Latte',     'Tea',    'Whisked matcha over milk and ice.',               3)
  returning id, name
)
insert into public.drink_ingredients (drink_id, ingredient_id)
select dr.id, ing.id
from (values
  ('Brown Sugar Oat Latte', 'Espresso'),
  ('Brown Sugar Oat Latte', 'Oat milk'),
  ('Brown Sugar Oat Latte', 'Brown sugar syrup'),
  ('Vanilla Latte',         'Espresso'),
  ('Vanilla Latte',         'Whole milk'),
  ('Vanilla Latte',         'Vanilla syrup'),
  ('Iced Matcha Latte',     'Matcha'),
  ('Iced Matcha Latte',     'Whole milk')
) as x(drink, ingredient)
join dr  on dr.name  = x.drink
join ing on ing.name = x.ingredient;
