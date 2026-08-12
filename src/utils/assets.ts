import type { HexTile, Goal } from '../types';

export const getGameAssets = (tiles: Record<string, HexTile>, goals: Record<string, Goal>) => {
  const tileArray = Object.values(tiles);
  const goalArray = Object.values(goals);
  
  const tileImages = tileArray.map(t => `/${t.image.replace(/^\/+/, '')}`);
  const goalImages = goalArray.map(g => `/${g.image.replace(/^\/+/, '')}`);
  
  const uiImages = [
    '/assets/bestagon.png', 
    '/assets/valid4.png', 
    '/assets/yourturn/yourturn.png',
    '/assets/yourturn/your_turn_plane.png',
    '/assets/yourturn/your_turn_blimp.png',
    '/assets/yourturn/your_turn_rocket.png',
    '/assets/yourturn/your_turn_jet.png',

    '/assets/fish/fish1.png',
    '/assets/fish/fish2.png',
    '/assets/fish/fish3.png',
    '/assets/fish/fish4.png',
    '/assets/fish/fish5.png',
    '/assets/fish/fish6.png',
    '/assets/fish/fish7.png',
    '/assets/fish/fish8.png',
    '/assets/fish/fish9.png',
    '/assets/fish/fish10.png',
    '/assets/fish/fish11.png',
    '/assets/fish/fish12.png',

    '/assets/tags/airport.png',
    '/assets/tags/civic.png',
    '/assets/tags/commercial.png',
    '/assets/tags/dealership.png',
    '/assets/tags/down.png',
    '/assets/tags/income.png',
    '/assets/tags/industrial.png',
    '/assets/tags/investment.png',
    '/assets/tags/lake.png',
    '/assets/tags/money.png', 
    '/assets/tags/office.png',
    '/assets/tags/population.png', 
    '/assets/tags/reputation.png',
    '/assets/tags/residential.png',
    '/assets/tags/restaurant.png',
    '/assets/tags/school.png',
    '/assets/tags/skyscraper.png',
    '/assets/tags/up.png',

    '/assets/numtags/minus1income.png',
    '/assets/numtags/minus2income.png',
    '/assets/numtags/minus1reputation.png',
    '/assets/numtags/minus2reputation.png',
    '/assets/numtags/plus1reputation.png',
    '/assets/numtags/plus2reputation.png',
    '/assets/numtags/plus3reputation.png',
    '/assets/numtags/plus1income.png',
    '/assets/numtags/plus2income.png',
    '/assets/numtags/plus3income.png',
    '/assets/numtags/plus5income.png',
    '/assets/numtags/plus1population.png', 
    '/assets/numtags/plus2population.png', 
    '/assets/numtags/plus3population.png', 
    '/assets/numtags/plus5population.png', 
    '/assets/numtags/plus6population.png', 
    '/assets/numtags/plus10population.png',

    '/assets/colors/black.png',
    '/assets/colors/blue.png',
    '/assets/colors/cyan.png',
    '/assets/colors/green.png',
    '/assets/colors/grey.png',
    '/assets/colors/orange.png',
    '/assets/colors/purple.png',
    '/assets/colors/red.png',
    '/assets/colors/white.png',
    '/assets/colors/yellow.png',

    '/assets/components/invest_black.png',
    '/assets/components/invest_blue.png',
    '/assets/components/invest_cyan.png',
    '/assets/components/invest_green.png',
    '/assets/components/invest_grey.png',
    '/assets/components/invest_orange.png',
    '/assets/components/invest_purple.png',
    '/assets/components/invest_red.png',
    '/assets/components/invest_white.png',
    '/assets/components/invest_yellow.png',

    '/assets/tiles/lakes/lake_a.png',
    '/assets/tiles/lakes/lake_b.png',
    '/assets/tiles/lakes/lake_c.png',

    '/assets/gameback/gameback1.png',
    '/assets/gameback/gameback2.png',
    '/assets/gameback/gameback3.png',  
    '/assets/gameback/gameback4.png',  
    '/assets/gameback/gameback5.png',  
    '/assets/gameback/gameback6.png',  
    '/assets/gameback/gameback7.png',   
    '/assets/gameback/gameback8.png',
    '/assets/gameback/gameback9.png',
  ];

  return Array.from(new Set([...tileImages, ...goalImages, ...uiImages]));
};