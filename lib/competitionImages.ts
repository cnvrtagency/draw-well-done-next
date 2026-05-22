type CompetitionImageLike = {
  main_image_url?: string | null;
  image_original_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  image_thumb_url?: string | null;
};

export function competitionCardImageUrl(c: CompetitionImageLike): string | null {
  return c.image_card_url || c.main_image_url || c.image_original_url || null;
}

export function competitionDetailImageUrl(c: CompetitionImageLike): string | null {
  return c.image_detail_url || c.image_card_url || c.main_image_url || c.image_original_url || null;
}

export function competitionThumbImageUrl(c: CompetitionImageLike): string | null {
  return c.image_thumb_url || c.image_card_url || c.main_image_url || c.image_original_url || null;
}
