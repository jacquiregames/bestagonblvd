# backend/app/data/basic_tiles.py
from ..models import HexTile, TileCategory, TileType, TileEffect, EffectTrigger

TilesBasic = {
    'COMMUNITY_PARK': HexTile(
        id='COMMUNITY_PARK',
        key='community_park',
        name='Community Park',
        image='assets/tiles/basic/community_park.png',
        category=TileCategory.CIVIC,
        type=None,
        cost=4,
        incomeChange=-1,
        populationChange=0,
        reputationChange=0, 
        effects=[
            TileEffect(
                trigger=EffectTrigger.ADJACENT, target=[TileCategory.RESIDENTIAL, TileCategory.COMMERCIAL, TileCategory.INDUSTRIAL], reputation=1 ),
        ],
        description='-1 income. +1 reputation for each adjacent Residential, Commercial, or Industrial.',
        limit=8,
        isUnique=False,
        set='Base'
    ),
    'HEAVY_FACTORY': HexTile(
        id='HEAVY_FACTORY',
        key='heavy_factory',
        name='Heavy Factory',
        image='assets/tiles/basic/heavy_factory.png',
        category=TileCategory.INDUSTRIAL,
        type=None,
        cost=3,
        incomeChange=1,
        populationChange=0,
        reputationChange=0, 
        effects=[
            TileEffect(trigger=EffectTrigger.ADJACENT, target=[TileCategory.RESIDENTIAL, TileCategory.CIVIC], reputation=-1),            
        ],
        description='+1 income. -1 reputation for each adjacent Residential or Civic.',
        limit=8,
        isUnique=False,
        set='Base',
    ),
    'SUBURBS': HexTile(
        id='SUBURBS',
        key='suburbs',
        name='Suburbs',
        image='assets/tiles/basic/suburbs.png',
        category=TileCategory.RESIDENTIAL,
        type=None,
        cost=3,
        incomeChange=0,
        populationChange=2,
        reputationChange=0, 
        effects=[],
        description='+2 population.',
        limit=8,
        isUnique=False,
        set='Base',
    ),
}