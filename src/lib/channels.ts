export interface ChannelScheduleItem {
  episodeNumber: number;
  title: string;
  episode: string;
  startsAt: string;
  endsAt: string;
}

export interface AnimeLiveChannel {
  id: string;
  name: string;
  callsign: string;
  category: "all" | "shonen" | "retro" | "marathon" | "music" | "movies";
  categoryLabel: string;
  logo: string;
  banner: string;
  seriesTitle?: string;
  anilistId?: number;
  audio?: "sub" | "dub";
  startEpisode?: number;
  totalEpisodes?: number;
  episodeDurationMinutes?: number;
  nowPlaying: {
    title: string;
    episode: string;
    description: string;
    progressPercent: number;
    startsAt: string;
    endsAt: string;
  };
  nextUp: {
    title: string;
    episode: string;
    startsAt: string;
  };
  streamUrl: string;
  streamType: "hls" | "embed";
  viewers: number;
  quality: string;
  badge?: string;
}

export const CINEMA_PLAYLIST = [
  { anilistId: 21519, title: "Your Name. (Kimi no Na wa)", runtime: 107, desc: "Two high schoolers who have never met share a magical connection through their dreams in Makoto Shinkai's masterpiece." },
  { anilistId: 20954, title: "A Silent Voice (Koe no Katachi)", runtime: 130, desc: "A former bully seeks redemption and reaches out to the deaf girl he tormented years earlier in an emotional journey." },
  { anilistId: 199, title: "Spirited Away", runtime: 125, desc: "During her family's move to the suburbs, a 10-year-old girl wanders into a magical world ruled by spirits, gods, and witches." },
  { anilistId: 164, title: "Princess Mononoke", runtime: 134, desc: "Ashitaka finds himself in the middle of a war between forest gods and a tatara mining colony in this Studio Ghibli epic." },
  { anilistId: 431, title: "Howl's Moving Castle", runtime: 119, desc: "When an unconfident young woman is cursed with an old body by a spiteful witch, she encounters the legendary wizard Howl." },
  { anilistId: 106286, title: "Weathering With You (Tenki no Ko)", runtime: 112, desc: "A high-school runaway in Tokyo meets a girl who appears to be able to manipulate the weather with her heart." },
  { anilistId: 145945, title: "Suzume (Suzume no Tojimari)", runtime: 122, desc: "A 17-year-old girl named Suzume journeys across Japan closing magical doors that unleash catastrophic disasters." },
  { anilistId: 131573, title: "Jujutsu Kaisen 0", runtime: 105, desc: "Yuta Okkotsu gains control of an extremely powerful Cursed Spirit and enrolls in Tokyo Jujutsu High School." },
  { anilistId: 112151, title: "Demon Slayer: Mugen Train", runtime: 117, desc: "Tanjiro, Nezuko, and the Flame Hashira Kyojuro Rengoku face the terrifying Enmu aboard the Infinity Train." },
];

export const ANIME_CHANNELS: AnimeLiveChannel[] = [
  {
    id: "toonami-aftermath",
    name: "Toonami Aftermath",
    callsign: "TOON-01",
    category: "retro",
    categoryLabel: "Classic & Retro",
    seriesTitle: "Cowboy Bebop",
    anilistId: 1,
    audio: "sub",
    startEpisode: 1,
    totalEpisodes: 26,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Cowboy Bebop",
      episode: "Session 5: Ballad of Fallen Angels",
      description: "Spike Spiegel confronts his nemesis Vicious in a cathedral shootout for the ages.",
      progressPercent: 42,
      startsAt: "09:30 AM",
      endsAt: "10:00 AM",
    },
    nextUp: {
      title: "Cowboy Bebop",
      episode: "Session 6: Sympathy for the Devil",
      startsAt: "10:00 AM",
    },
    streamUrl: "https://vidnest.fun/anime/1/5/sub",
    streamType: "embed",
    viewers: 14820,
    quality: "1080p HD",
    badge: "POPULAR",
  },
  {
    id: "crunchyroll-live",
    name: "Crunchyroll TV Live",
    callsign: "CR-02",
    category: "shonen",
    categoryLabel: "Shonen & Action",
    seriesTitle: "Jujutsu Kaisen",
    anilistId: 113415,
    audio: "sub",
    startEpisode: 1,
    totalEpisodes: 24,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Jujutsu Kaisen",
      episode: "Episode 1: Ryomen Sukuna",
      description: "Yuji Itadori swallows a cursed finger to save his friends and gains immense cursed energy.",
      progressPercent: 68,
      startsAt: "09:40 AM",
      endsAt: "10:05 AM",
    },
    nextUp: {
      title: "Jujutsu Kaisen",
      episode: "Episode 2: For Myself",
      startsAt: "10:05 AM",
    },
    streamUrl: "https://vidnest.fun/anime/113415/1/sub",
    streamType: "embed",
    viewers: 28940,
    quality: "1080p FHD",
    badge: "TRENDING",
  },
  {
    id: "dragonball-247",
    name: "Dragon Ball 24/7",
    callsign: "DBZ-03",
    category: "marathon",
    categoryLabel: "24/7 Marathon",
    seriesTitle: "Dragon Ball Z",
    anilistId: 813,
    audio: "dub",
    startEpisode: 80,
    totalEpisodes: 291,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1569003339405-ea396a5a8a90?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Dragon Ball Z",
      episode: "Episode 95: Transformed at Last! Goku Ascends to Super Saiyan",
      description: "Consumed by rage after Frieza's brutality, Goku awakens the legendary golden warrior.",
      progressPercent: 55,
      startsAt: "09:35 AM",
      endsAt: "10:00 AM",
    },
    nextUp: {
      title: "Dragon Ball Z",
      episode: "Episode 96: Explosion of Anger! Goku Avenges Krillin",
      startsAt: "10:00 AM",
    },
    streamUrl: "https://vidnest.fun/anime/813/95/dub",
    streamType: "embed",
    viewers: 19430,
    quality: "1080p HD",
    badge: "24/7",
  },
  {
    id: "naruto-shippuden-247",
    name: "Naruto Universe 24/7",
    callsign: "NAR-04",
    category: "marathon",
    categoryLabel: "24/7 Marathon",
    seriesTitle: "Naruto Shippuden",
    anilistId: 1735,
    audio: "sub",
    startEpisode: 150,
    totalEpisodes: 500,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Naruto Shippuden",
      episode: "Episode 167: Planetary Devastation",
      description: "Naruto loses control in Six-Tails mode against Pain in the ruins of Konoha.",
      progressPercent: 80,
      startsAt: "09:25 AM",
      endsAt: "09:50 AM",
    },
    nextUp: {
      title: "Naruto Shippuden",
      episode: "Episode 168: The Fourth Hokage",
      startsAt: "09:50 AM",
    },
    streamUrl: "https://vidnest.fun/anime/1735/167/sub",
    streamType: "embed",
    viewers: 22100,
    quality: "1080p HD",
    badge: "24/7",
  },
  {
    id: "one-piece-grandline",
    name: "One Piece Grand Line 24/7",
    callsign: "OP-05",
    category: "marathon",
    categoryLabel: "24/7 Marathon",
    seriesTitle: "One Piece",
    anilistId: 21,
    audio: "sub",
    startEpisode: 1000,
    totalEpisodes: 1100,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "One Piece",
      episode: "Episode 1015: Straw Hat Luffy! The Man Who Will Become the Pirate King",
      description: "The Roof Piece battle begins atop Onigashima with breathtaking animation.",
      progressPercent: 30,
      startsAt: "09:45 AM",
      endsAt: "10:10 AM",
    },
    nextUp: {
      title: "One Piece",
      episode: "Episode 1016: The Monster Battle! Three Stubborn Captains",
      startsAt: "10:10 AM",
    },
    streamUrl: "https://vidnest.fun/anime/21/1015/sub",
    streamType: "embed",
    viewers: 31250,
    quality: "1080p FHD",
    badge: "FEATURED",
  },
  {
    id: "retro-crush",
    name: "RetroCrush Vintage Anime",
    callsign: "RETR-06",
    category: "retro",
    categoryLabel: "Classic & Retro",
    seriesTitle: "City Hunter",
    anilistId: 1482,
    audio: "sub",
    startEpisode: 1,
    totalEpisodes: 51,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "City Hunter",
      episode: "Episode 12: Ryo Saeba's Dangerous Proposal",
      description: "Tokyo's legendary sweeper takes on a dangerous criminal syndicate with style.",
      progressPercent: 45,
      startsAt: "09:30 AM",
      endsAt: "09:55 AM",
    },
    nextUp: {
      title: "City Hunter",
      episode: "Episode 13: The Mysterious Woman's Secret",
      startsAt: "09:55 AM",
    },
    streamUrl: "https://vidnest.fun/anime/1482/12/sub",
    streamType: "embed",
    viewers: 9450,
    quality: "720p HD",
    badge: "CLASSIC",
  },
  {
    id: "pokemon-kanto-paldea",
    name: "Pokémon Channel 24/7",
    callsign: "PKMN-07",
    category: "marathon",
    categoryLabel: "24/7 Marathon",
    seriesTitle: "Pokémon",
    anilistId: 527,
    audio: "dub",
    startEpisode: 1,
    totalEpisodes: 276,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Pokémon",
      episode: "Episode 1: Pokémon - I Choose You!",
      description: "Ash Ketchum of Pallet Town begins his journey alongside an unruly Pikachu.",
      progressPercent: 60,
      startsAt: "09:35 AM",
      endsAt: "10:00 AM",
    },
    nextUp: {
      title: "Pokémon",
      episode: "Episode 2: Pokémon Emergency!",
      startsAt: "10:00 AM",
    },
    streamUrl: "https://vidnest.fun/anime/527/1/dub",
    streamType: "embed",
    viewers: 16800,
    quality: "1080p HD",
    badge: "24/7",
  },
  {
    id: "attack-on-titan-live",
    name: "Attack on Titan Live Channel",
    callsign: "AOT-08",
    category: "shonen",
    categoryLabel: "Shonen & Action",
    seriesTitle: "Attack on Titan",
    anilistId: 16498,
    audio: "sub",
    startEpisode: 1,
    totalEpisodes: 87,
    episodeDurationMinutes: 25,
    logo: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Attack on Titan",
      episode: "Episode 1: To You, in 2000 Years",
      description: "The Colossal Titan breaches Wall Maria, shattering humanity's century of peace.",
      progressPercent: 25,
      startsAt: "09:45 AM",
      endsAt: "10:10 AM",
    },
    nextUp: {
      title: "Attack on Titan",
      episode: "Episode 2: That Day",
      startsAt: "10:10 AM",
    },
    streamUrl: "https://vidnest.fun/anime/16498/1/sub",
    streamType: "embed",
    viewers: 24700,
    quality: "1080p FHD",
    badge: "HD",
  },
  {
    id: "lofi-anime-radio",
    name: "Lofi Anime Radio 24/7",
    callsign: "LOFI-09",
    category: "music",
    categoryLabel: "Music & Chill",
    logo: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Chill Anime Beats & Rainy Nights",
      episode: "Continuous 24/7 Broadcast",
      description: "Relaxing hip hop beats, Ghibli reimagined melodies, and peaceful study session streams.",
      progressPercent: 50,
      startsAt: "Live",
      endsAt: "Continuous",
    },
    nextUp: {
      title: "Tokyo Midnight Jazz Lofi",
      episode: "Live Session",
      startsAt: "Next",
    },
    streamUrl: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&mute=0",
    streamType: "embed",
    viewers: 45200,
    quality: "1080p Live",
    badge: "RELAX",
  },
  {
    id: "ghibli-symphony-live",
    name: "Studio Ghibli Symphony 24/7",
    callsign: "GHIB-10",
    category: "music",
    categoryLabel: "Music & Chill",
    logo: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Joe Hisaishi Orchestral Masterpieces",
      episode: "Spirited Away & Howl's Moving Castle",
      description: "Immersive orchestral performances of Hayao Miyazaki's most legendary films.",
      progressPercent: 75,
      startsAt: "Live",
      endsAt: "Continuous",
    },
    nextUp: {
      title: "Princess Mononoke Symphonic Suite",
      episode: "Live Orchestra",
      startsAt: "Next",
    },
    streamUrl: "https://www.youtube.com/embed/H01wKj19Nac?autoplay=1&mute=0",
    streamType: "embed",
    viewers: 18300,
    quality: "1080p Live",
    badge: "MUSIC",
  },
  {
    id: "anime-cinema-247",
    name: "Anime Cinema 24/7 (Movies)",
    callsign: "CINE-11",
    category: "movies",
    categoryLabel: "Feature Films",
    seriesTitle: "Theatrical Anime Cinema",
    logo: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=150&auto=format&fit=crop&q=80",
    banner: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1200&auto=format&fit=crop&q=80",
    nowPlaying: {
      title: "Your Name. (Kimi no Na wa)",
      episode: "Full Feature Film (1080p)",
      description: "Two high schoolers who have never met share a magical connection through their dreams in Makoto Shinkai's masterpiece.",
      progressPercent: 62,
      startsAt: "09:00 AM",
      endsAt: "10:47 AM",
    },
    nextUp: {
      title: "A Silent Voice (Koe no Katachi)",
      episode: "Full Feature Film",
      startsAt: "10:50 AM",
    },
    streamUrl: "https://vidnest.fun/anime/21519/1/sub",
    streamType: "embed",
    viewers: 34100,
    quality: "1080p FHD",
    badge: "CINEMA",
  },
];

export const CHANNEL_MIRRORS = [
  {
    id: "vidnest",
    name: "Vidnest HD (Primary)",
    getUrl: (id: number, ep: number, audio: string) => `https://vidnest.fun/anime/${id}/${ep}/${audio}`,
  },
  {
    id: "vidsrc",
    name: "VidSrc (Cinema)",
    getUrl: (id: number, ep: number) => `https://vidsrc.to/embed/tv/${id}/1/${ep}`,
  },
  {
    id: "multiembed",
    name: "MultiEmbed (VIP)",
    getUrl: (id: number, ep: number) => `https://multiembed.mov/?video_id=${id}&tmdb=0&s=1&e=${ep}`,
  },
  {
    id: "2embed",
    name: "2Embed (Fast)",
    getUrl: (id: number, ep: number) => `https://www.2embed.cc/embedtv/${id}&s=1&e=${ep}`,
  },
];

export function getChannelLiveState(channel: AnimeLiveChannel, now: Date = new Date()) {
  if (channel.category === "music") {
    return {
      currentEpisodeNumber: 1,
      totalEpisodes: 1,
      progressPercent: 50,
      startsAt: "Live",
      endsAt: "Continuous",
      nextStartsAt: "Continuous",
      currentTitle: channel.nowPlaying.title,
      currentEpisode: "Continuous 24/7 Live Broadcast",
      currentDesc: channel.nowPlaying.description,
      nextTitle: channel.nextUp.title,
      nextEpisode: channel.nextUp.episode,
      upcoming: [] as ChannelScheduleItem[],
      anilistId: undefined as number | undefined,
    };
  }

  if (channel.id === "anime-cinema-247") {
    const slotDurationMin = 120;
    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const movieIdx = Math.floor(minutesSinceMidnight / slotDurationMin) % CINEMA_PLAYLIST.length;
    const nextMovieIdx = (movieIdx + 1) % CINEMA_PLAYLIST.length;
    const minuteInSlot = minutesSinceMidnight % slotDurationMin;
    const progressPercent = Math.min(100, Math.round((minuteInSlot / slotDurationMin) * 100));

    const currentMovie = CINEMA_PLAYLIST[movieIdx];
    const nextMovie = CINEMA_PLAYLIST[nextMovieIdx];

    const slotStartHour = Math.floor((Math.floor(minutesSinceMidnight / slotDurationMin) * slotDurationMin) / 60);
    const slotStartMin = (Math.floor(minutesSinceMidnight / slotDurationMin) * slotDurationMin) % 60;
    const slotEndHour = (slotStartHour + 2) % 24;

    const formatHour = (h: number, m: number) => {
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const upcoming: ChannelScheduleItem[] = [1, 2, 3, 4].map((offset) => {
      const idx = (movieIdx + offset) % CINEMA_PLAYLIST.length;
      const m = CINEMA_PLAYLIST[idx];
      const startH = (slotStartHour + offset * 2) % 24;
      return {
        episodeNumber: idx + 1,
        title: m.title,
        episode: "Full Feature Film",
        startsAt: formatHour(startH, slotStartMin),
        endsAt: formatHour((startH + 2) % 24, slotStartMin),
      };
    });

    return {
      currentEpisodeNumber: movieIdx + 1,
      totalEpisodes: CINEMA_PLAYLIST.length,
      progressPercent,
      startsAt: formatHour(slotStartHour, slotStartMin),
      endsAt: formatHour(slotEndHour, slotStartMin),
      nextStartsAt: formatHour(slotEndHour, slotStartMin),
      currentTitle: currentMovie.title,
      currentEpisode: "Full Feature Film (1080p)",
      currentDesc: currentMovie.desc,
      nextTitle: nextMovie.title,
      nextEpisode: "Full Feature Film",
      upcoming,
      anilistId: currentMovie.anilistId,
    };
  }

  // Standard anime episode marathon (25-minute slots):
  const slotDurationMin = 25;
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
  const baseEpOffset = channel.startEpisode || 1;
  const total = channel.totalEpisodes || 100;

  const currentSlotIndex = Math.floor(minutesSinceMidnight / slotDurationMin);
  const currentEpNum = ((currentSlotIndex + baseEpOffset - 1) % total) + 1;
  const nextEpNum = (currentEpNum % total) + 1;

  const minuteInSlot = minutesSinceMidnight % slotDurationMin;
  const progressPercent = Math.min(100, Math.round((minuteInSlot / slotDurationMin) * 100));

  const slotStartMinutes = currentSlotIndex * slotDurationMin;
  const slotEndMinutes = slotStartMinutes + slotDurationMin;

  const formatMin = (totalMins: number) => {
    const norm = ((totalMins % 1440) + 1440) % 1440;
    const h = Math.floor(norm / 60);
    const m = norm % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
  };

  const upcoming: ChannelScheduleItem[] = [1, 2, 3, 4, 5].map((offset) => {
    const ep = ((currentEpNum + offset - 1) % total) + 1;
    const startM = slotStartMinutes + offset * slotDurationMin;
    return {
      episodeNumber: ep,
      title: channel.seriesTitle || channel.name,
      episode: `Episode ${ep}`,
      startsAt: formatMin(startM),
      endsAt: formatMin(startM + slotDurationMin),
    };
  });

  return {
    currentEpisodeNumber: currentEpNum,
    totalEpisodes: total,
    progressPercent,
    startsAt: formatMin(slotStartMinutes),
    endsAt: formatMin(slotEndMinutes),
    nextStartsAt: formatMin(slotEndMinutes),
    currentTitle: channel.seriesTitle || channel.nowPlaying.title,
    currentEpisode: `Episode ${currentEpNum}`,
    currentDesc: channel.nowPlaying.description,
    nextTitle: channel.seriesTitle || channel.nextUp.title,
    nextEpisode: `Episode ${nextEpNum}`,
    upcoming,
    anilistId: channel.anilistId,
  };
}
