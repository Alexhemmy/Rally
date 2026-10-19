import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seeds the PRD 7.2 launch taxonomy: Industry → Category → Specialty.
 * Admin-managed tables, so entries can be added without a release (CAT).
 * Run: npx tsx prisma/seed-taxonomy.ts
 */

type Spec = [string, string, string[]]; // [categorySlug, categoryName, specialties]
type Ind = [string, string, Spec[]];

const TAXONOMY: Ind[] = [
  ['music', 'Music', [
    ['afrobeats', 'Afrobeats & Afro-fusion', ['afrobeats', 'afro-fusion', 'amapiano', 'highlife', 'fuji-juju']],
    ['gospel', 'Gospel & Worship', ['gospel-choir', 'worship-leader', 'gospel-rap']],
    ['hiphop', 'Hip Hop & Rap', ['trap', 'drill', 'conscious-rap']],
    ['rb-soul', 'R&B & Soul', ['rnb', 'soul']],
    ['electronic', 'Electronic & DJs', ['dj', 'producer-dj', 'afro-house']],
  ]],
  ['music-production', 'Music Production & Songwriting', [
    ['production', 'Production & Engineering', ['beatmaker', 'mixing-mastering', 'instrumentalist', 'arranger']],
    ['songwriting', 'Songwriting', ['songwriter', 'topline-writer']],
  ]],
  ['film-tv', 'Film & TV', [
    ['acting', 'Acting', ['film-actor', 'tv-actor', 'voice-actor']],
    ['production-film', 'Film Production', ['director', 'scriptwriter', 'cinematographer', 'editor']],
  ]],
  ['streaming-gaming', 'Streaming & Gaming', [
    ['streaming', 'Streaming', ['live-streamer', 'esports-player', 'gaming-team']],
    ['gaming', 'Game Creation', ['game-developer', 'game-reviewer']],
  ]],
  ['influencers', 'Influencers & Lifestyle', [
    ['lifestyle', 'Lifestyle', ['fashion', 'beauty', 'fitness', 'travel', 'food-influencer', 'parenting']],
    ['tech-faith', 'Tech & Faith', ['tech-reviewer', 'motivational-speaker', 'faith-speaker']],
  ]],
  ['comedy', 'Comedy', [
    ['comedy', 'Comedy', ['stand-up', 'skit-maker', 'sketch-group', 'mc-host', 'impressionist']],
  ]],
  ['content-creators', 'Content Creators', [
    ['creators', 'Content Creation', ['video-creator', 'podcaster', 'educator', 'commentator', 'blogger']],
  ]],
  ['writers', 'Writers & Publishing', [
    ['writing', 'Writing', ['novelist', 'poet', 'journalist', 'screenwriter', 'serial-writer', 'spoken-word']],
  ]],
  ['visual-arts', 'Visual Arts & Design', [
    ['visual', 'Visual Arts', ['painter', 'illustrator', 'photographer', 'sculptor', 'animator']],
    ['design', 'Design', ['graphic-designer', 'fashion-designer']],
  ]],
  ['artisans', 'Artisans & Crafts', [
    ['crafts', 'Crafts', ['tailor', 'weaver', 'potter', 'woodworker', 'jeweler', 'leatherworker', 'hairstylist', 'makeup-artist', 'baker', 'caterer']],
  ]],
  ['dance-performance', 'Dance & Performance', [
    ['dance', 'Dance & Theatre', ['dancer', 'choreographer', 'theatre-actor', 'troupe']],
  ]],
  ['sports', 'Sports', [
    ['sports', 'Sports', ['athlete', 'coach', 'club-team', 'trainer']],
  ]],
  ['food-culinary', 'Food & Culinary', [
    ['culinary', 'Culinary', ['chef', 'home-cook', 'food-entrepreneur']],
  ]],
  ['public-life', 'Public Life & Business', [
    ['public', 'Public Life', ['entrepreneur', 'advocate', 'thought-leader', 'community-leader']],
  ]],
  ['groups-brands', 'Groups & Brands', [
    ['groups', 'Groups & Brands', ['band', 'crew', 'studio', 'label', 'collective']],
  ]],
];

async function main() {
  console.log('Seeding taxonomy…');
  let industries = 0, categories = 0, specialties = 0;

  for (const [indSlug, indName, cats] of TAXONOMY) {
    const industry = await prisma.industry.upsert({
      where: { slug: indSlug },
      update: { name: indName },
      create: { slug: indSlug, name: indName, sortOrder: industries },
    });
    industries++;

    let catOrder = 0;
    for (const [catSlug, catName, specs] of cats) {
      const category = await prisma.category.upsert({
        where: { slug: catSlug },
        update: { name: catName, industryId: industry.id },
        create: { slug: catSlug, name: catName, industryId: industry.id },
      });
      categories++;
      catOrder++;

      for (const specSlug of specs) {
        await prisma.specialty.upsert({
          where: { slug: specSlug },
          update: { categoryId: category.id },
          create: {
            slug: specSlug,
            name: specSlug
              .split('-')
              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
              .join(' '),
            categoryId: category.id,
          },
        });
        specialties++;
      }
    }
  }

  console.log(`Taxonomy seeded: ${industries} industries, ${categories} categories, ${specialties} specialties.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
