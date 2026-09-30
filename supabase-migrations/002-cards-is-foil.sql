-- Agrega la columna is_foil a la tabla cards (fondo holográfico para PNG transparentes)
ALTER TABLE cards
  ADD COLUMN IF NOT EXISTS is_foil BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN cards.is_foil IS 'TRUE = mostrar fondo holográfico detrás de la imagen PNG transparente';
