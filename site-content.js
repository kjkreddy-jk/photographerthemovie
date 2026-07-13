(function registerPhotographerSiteContent(global) {
  'use strict';

  // Campaign editors: update approved release, media, people and outbound-link data here.
  const content = {
    build: {
      version: '1.5.0'
    },
    film: {
      title: 'Photographer',
      releaseDate: '2026-08-15',
      contentRating: 'U/A',
      releaseFormat: '2D',
      heroVideoId: '0c78E4Fr-OI'
    },
    navigation: [
      { label: 'Trailer', href: '#top' },
      { label: 'Story', href: '#story' },
      { label: 'Tickets', href: '#tickets' },
      { label: 'Videos', href: '#videos' },
      { label: 'Shorts', href: '#shorts' },
      { label: 'Cast', href: '#cast' }
    ],
    booking: {
      cities: ['Chennai', 'Bengaluru', 'Hyderabad', 'Kochi', 'Mumbai', 'Coimbatore'],
      partners: [
        { label: 'BookMyShow', href: 'https://in.bookmyshow.com' },
        { label: 'PVR INOX', href: 'https://www.pvrinox.com' }
      ]
    },
    social: {
      film: [
        { label: 'Instagram', href: 'https://www.instagram.com/photographerthemovie/' },
        { label: 'Facebook', href: 'https://www.facebook.com/PhotographerTheMovie' }
      ],
      artist: [
        { label: 'Instagram', href: 'https://www.instagram.com/captashrafali/' },
        { label: 'Facebook', href: 'https://www.facebook.com/ashraftheactor/' }
      ]
    },
    videos: [
      { title: 'Official Trailer', kind: 'Trailer', duration: '2:14', videoId: 'hero' },
      { title: 'Teaser', kind: 'Teaser', duration: '0:58', videoId: null },
      { title: 'Into Mathikettan — Making Of', kind: 'Featurette', duration: '5:32', videoId: null },
      { title: 'Motion Poster', kind: 'First Look', duration: '0:45', videoId: null },
      { title: '"Kaadu" — Song Promo', kind: 'Music', duration: '3:10', videoId: null },
      { title: 'In Conversation with the Cast', kind: 'Interview', duration: '12:04', videoId: null }
    ],
    shorts: [
      { title: 'First frame', meta: 'BTS', views: '204K', videoId: null },
      { title: "Building Veera's camera", meta: 'Props', views: '88K', videoId: null },
      { title: 'Forest at dawn', meta: 'On location', views: '156K', videoId: null },
      { title: 'Day 12 on set', meta: 'Diary', views: '73K', videoId: null },
      { title: 'The sound of Mathikettan', meta: 'Score', views: '49K', videoId: null },
      { title: 'Meet the team', meta: 'Cast', views: '132K', videoId: null }
    ],
    cast: [
      { name: 'Veera', role: 'The Photographer', tag: 'Lead', socialProfile: 'artist' },
      { name: 'Kani', role: 'The Guide', tag: 'Lead', socialProfile: 'film' },
      { name: 'Ravindran', role: 'The Rival', tag: 'Supporting', socialProfile: null },
      { name: 'Thangam', role: 'The Mother', tag: 'Supporting', socialProfile: null },
      { name: 'The Curator', role: 'Gallery Owner', tag: 'Supporting', socialProfile: null }
    ],
    crew: [
      { role: 'Written & Directed by', name: 'Announcement pending' },
      { role: 'Produced by', name: 'Announcement pending' },
      { role: 'Director of Photography', name: 'Announcement pending' },
      { role: 'Original Score', name: 'Announcement pending' },
      { role: 'Editor', name: 'Announcement pending' },
      { role: 'Production Design', name: 'Announcement pending' },
      { role: 'Sound Design', name: 'Announcement pending' },
      { role: 'Costume Design', name: 'Announcement pending' }
    ]
  };

  // Prevent component code from accidentally mutating shared campaign data at runtime.
  const deepFreeze = (value) => {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  };

  global.PHOTOGRAPHER_SITE_CONTENT = deepFreeze(content);
})(window);
