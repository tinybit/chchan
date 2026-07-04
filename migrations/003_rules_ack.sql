-- First approved login routes through the rules page until accepted.
alter table users add column rules_accepted_at timestamptz;
