from ..models import HexTile, TileCategory, TileType, TileEffect, EffectTrigger

TilesA = {
  'BUSINESS_SUPPLY_STORE': HexTile(
    id='BUSINESS_SUPPLY_STORE',
    key='business_supply_store',
    name='Business Supply Store',
    image='assets/tiles/A/business_supply_store.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=8,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Office', income=1)
    ],
    description='+1 income. +1 income for every Office.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'CONVENIENCE_STORE': HexTile(
    id='CONVENIENCE_STORE',
    key='convenience_store',
    name='Convenience Store',
    image='assets/tiles/A/convenience_store.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=6,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[],
    description='+1 income.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'FANCY_RESTAURANT': HexTile(
    id='FANCY_RESTAURANT',
    key='fancy_restaurant',
    name='Fancy Restaurant',
    image='assets/tiles/A/fancy_restaurant.webp',
    category=TileCategory.COMMERCIAL,
    type=TileType.RESTAURANT,
    cost=9,
    incomeChange=3,
    populationChange=0,
    reputationChange=0, 
    effects=[ 
      TileEffect(trigger=EffectTrigger.AFTER, target='Restaurant', income=-1)
    ],
    description= '+3 income. -1 income for all Restaurants built after this one.',
    limit=3,
    isUnique=False,
    set='Base'
  ),
  'FARM': HexTile(
    id='FARM',
    key='farm',
    name='Farm',
    image='assets/tiles/A/farm.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=9,
    incomeChange=0,
    populationChange=0,
    reputationChange=-1, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Restaurant', income=1)
    ],
    description='-1 reputation. +1 income for every Restaurant.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'FAST_FOOD_RESTAURANT': HexTile(
    id='FAST_FOOD_RESTAURANT',
    key='fast_food_restaurant',
    name='Fast Food Restaurant',
    image='assets/tiles/A/fast_food_restaurant.webp',
    category=TileCategory.COMMERCIAL,
    type=TileType.RESTAURANT,
    cost=7,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', population=3)
    ],
    description='+1 income. +3 population for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'FREEWAY': HexTile(
    id='FREEWAY',
    key='freeway',
    name='Freeway',
    image='assets/tiles/A/freeway.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=5,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=-1),
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Commercial', income=1)
    ],
    description='+1 income for each adjacent Commercial. -1 reputation for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'HOMEOWNERS_ASSOCIATION': HexTile(
    id='HOMEOWNERS_ASSOCIATION',
    key='homeowners_association',
    name="Homeowners Association",
    image='assets/tiles/A/homeowners_association.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=6,
    incomeChange=0,
    populationChange=1,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Residential', money=2)
    ],
    description='+1 population. Take $2 for every Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'LANDFILL': HexTile(
    id='LANDFILL',
    key='landfill',
    name='Landfill',
    image='assets/tiles/A/landfill.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=4,
    incomeChange=2,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(
          trigger=EffectTrigger.ADJACENT, 
          target=[TileCategory.INDUSTRIAL, TileCategory.CIVIC, TileCategory.RESIDENTIAL, TileCategory.COMMERCIAL],
          reputation=-1
      )
    ],
    description='+2 income. -1 reputation for each adjacent Industrial, Civic, Residential, or Commercial.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'MINT': HexTile(
    id='MINT',
    key='mint',
    name='Mint',
    image='assets/tiles/A/mint.webp',
    category=TileCategory.CIVIC,
    type=None,
    cost=15,
    incomeChange=3,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL_OWN, target='Civic', money=2)
    ],
    description='+3 income. +$2 for each of your Civic.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'MOBILE_HOME_COMMUNITY': HexTile(
    id='MOBILE_HOME_COMMUNITY',
    key='mobile_home_community',
    name='Mobile Home Community',
    image='assets/tiles/A/mobile_home_community.webp',
    category=TileCategory.RESIDENTIAL,
    type=None,
    cost=4,
    incomeChange=0,
    populationChange=6,
    reputationChange=0, 
    effects=[],
    description='+6 population.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'MUNICIPAL_AIRPORT': HexTile(
    id='MUNICIPAL_AIRPORT',
    key='municipal_airport',
    name='Municipal Airport',
    image='assets/tiles/A/municipal_airport.webp',
    category=TileCategory.INDUSTRIAL,
    type=TileType.AIRPORT,
    cost=6,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Airport', income=1),
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Residential', reputation=-1)
    ],
    description='+1 income for every Airport. -1 reputation for each adjacent Residential.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'OFFICE_BUILDING': HexTile(
    id='OFFICE_BUILDING',
    key='office_building',
    name='Office Building',
    image='assets/tiles/A/office_building.webp',
    category=TileCategory.COMMERCIAL,
    type=TileType.OFFICE,
    cost=9,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target='Commercial', income=1)
    ],
    description='+1 income. +1 income for each adjacent Commercial.',
    limit=3,
    isUnique=False,
    set='Base'
  ),
  'PARKING_LOT': HexTile(
    id='PARKING_LOT',
    key='parking_lot',
    name='Parking Lot',
    image='assets/tiles/A/parking_lot.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=12,
    incomeChange=1,
    populationChange=0,
    reputationChange=0, 
    effects=[
      TileEffect(trigger=EffectTrigger.ADJACENT, target=['Commercial', 'Civic'], income=1)
    ],
    description='+1 income. +1 income for each adjacent Commercial or Civic.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'SLAUGHTERHOUSE': HexTile(
    id='SLAUGHTERHOUSE',
    key='slaughterhouse',
    name='Slaughterhouse',
    image='assets/tiles/A/slaughterhouse.webp',
    category=TileCategory.INDUSTRIAL,
    type=None,
    cost=5,
    incomeChange=0,
    populationChange=0,
    reputationChange=-2, 
    effects=[
      TileEffect(trigger=EffectTrigger.ALL, target='Restaurant', income=1)
    ],
    description='-2 reputation. +1 income for every Restaurant.',
    limit=2,
    isUnique=False,
    set='Base'
  ),
  'WATERFRONT_REALTY': HexTile(
    id='WATERFRONT_REALTY',
    key='waterfront_realty',
    name='Waterfront Realty',
    image='assets/tiles/A/waterfront_realty.webp',
    category=TileCategory.COMMERCIAL,
    type=None,
    cost=6,
    incomeChange=0,
    populationChange=0,
    reputationChange=0, 
    effects=[],  
    description='When built, take $2 for each tile already adjacent to any of your Lakes. Tiles placed adjacent to your Lakes are now worth a $4 cash bonus instead of $2. (With investment: $6).',
    limit=2,
    isUnique=False,
    set='Base'
  ),
}