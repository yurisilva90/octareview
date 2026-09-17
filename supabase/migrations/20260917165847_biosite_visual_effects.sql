alter table public.smart_pages
  add column if not exists button_effect text not null default 'shadow'
    check (button_effect in ('none', 'shadow', 'lift', 'glow')),
  add column if not exists form_background_color text not null default '#ffffff'
    check (form_background_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists form_border_color text not null default '#e2e8f0'
    check (form_border_color ~ '^#[0-9a-fA-F]{6}$'),
  add column if not exists form_border_width smallint not null default 1
    check (form_border_width between 0 and 3),
  add column if not exists form_effect text not null default 'shadow'
    check (form_effect in ('none', 'shadow', 'glass', 'glow')),
  add column if not exists cover_shape text not null default 'curve'
    check (cover_shape in ('straight', 'curve', 'wave')),
  add column if not exists profile_border_enabled boolean not null default true,
  add column if not exists profile_border_color text not null default '#ffffff'
    check (profile_border_color ~ '^#[0-9a-fA-F]{6}$');
