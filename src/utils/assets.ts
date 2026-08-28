import type { HexTile, Goal } from '../types';

export const getGameAssets = (tiles: Record<string, HexTile>, goals: Record<string, Goal>) => {
  const tileArray = Object.values(tiles);
  const goalArray = Object.values(goals);
  
  const tileImages = tileArray.map(t => `/${t.image.replace(/^\/+/, '')}`);
  const goalImages = goalArray.map(g => `/${g.image.replace(/^\/+/, '')}`);
  
  const uiImages = [
    '/assets/bestagon.webp', 
    '/assets/yourturn/yourturn.webp',
    '/assets/yourturn/your_turn_plane.webp',
    '/assets/yourturn/your_turn_blimp.webp',
    '/assets/yourturn/your_turn_rocket.webp',
    '/assets/yourturn/your_turn_jet.webp',

    '/assets/fish/fish1.webp',
    '/assets/fish/fish2.webp',
    '/assets/fish/fish3.webp',
    '/assets/fish/fish4.webp',
    '/assets/fish/fish5.webp',
    '/assets/fish/fish6.webp',
    '/assets/fish/fish7.webp',
    '/assets/fish/fish8.webp',
    '/assets/fish/fish9.webp',
    '/assets/fish/fish10.webp',
    '/assets/fish/fish11.webp',
    '/assets/fish/fish12.webp',

    '/assets/tags/airport.webp',
    '/assets/tags/civic.webp',
    '/assets/tags/commercial.webp',
    '/assets/tags/dealership.webp',
    '/assets/tags/down.webp',
    '/assets/tags/income.webp',
    '/assets/tags/industrial.webp',
    '/assets/tags/investment.webp',
    '/assets/tags/lake.webp',
    '/assets/tags/money.webp', 
    '/assets/tags/office.webp',
    '/assets/tags/population.webp', 
    '/assets/tags/reputation.webp',
    '/assets/tags/residential.webp',
    '/assets/tags/restaurant.webp',
    '/assets/tags/school.webp',
    '/assets/tags/skyscraper.webp',
    '/assets/tags/up.webp',

    '/assets/numtags/minus1income.webp',
    '/assets/numtags/minus2income.webp',
    '/assets/numtags/minus1reputation.webp',
    '/assets/numtags/minus2reputation.webp',
    '/assets/numtags/plus1reputation.webp',
    '/assets/numtags/plus2reputation.webp',
    '/assets/numtags/plus3reputation.webp',
    '/assets/numtags/plus1income.webp',
    '/assets/numtags/plus2income.webp',
    '/assets/numtags/plus3income.webp',
    '/assets/numtags/plus5income.webp',
    '/assets/numtags/plus1population.webp', 
    '/assets/numtags/plus2population.webp', 
    '/assets/numtags/plus3population.webp', 
    '/assets/numtags/plus5population.webp', 
    '/assets/numtags/plus6population.webp', 
    '/assets/numtags/plus10population.webp',

    '/assets/colors/black.webp',
    '/assets/colors/blue.webp',
    '/assets/colors/cyan.webp',
    '/assets/colors/green.webp',
    '/assets/colors/grey.webp',
    '/assets/colors/orange.webp',
    '/assets/colors/purple.webp',
    '/assets/colors/red.webp',
    '/assets/colors/white.webp',
    '/assets/colors/yellow.webp',

    '/assets/components/invest_black.webp',
    '/assets/components/invest_blue.webp',
    '/assets/components/invest_cyan.webp',
    '/assets/components/invest_green.webp',
    '/assets/components/invest_grey.webp',
    '/assets/components/invest_orange.webp',
    '/assets/components/invest_purple.webp',
    '/assets/components/invest_red.webp',
    '/assets/components/invest_white.webp',
    '/assets/components/invest_yellow.webp',

    '/assets/tiles/lakes/lake_a.webp',
    '/assets/tiles/lakes/lake_b.webp',
    '/assets/tiles/lakes/lake_c.webp',
    '/assets/tiles/valid4.webp', 

    '/assets/gameback/gameback1.webp',
    '/assets/gameback/gameback2.webp',
    '/assets/gameback/gameback3.webp',  
    '/assets/gameback/gameback4.webp',  
    '/assets/gameback/gameback5.webp',  
    '/assets/gameback/gameback6.webp',  
    '/assets/gameback/gameback7.webp',   
    '/assets/gameback/gameback8.webp',
    '/assets/gameback/gameback9.webp',
  ];

  return Array.from(new Set([...tileImages, ...goalImages, ...uiImages]));
};